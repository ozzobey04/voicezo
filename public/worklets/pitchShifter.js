/**
 * Real-time pitch shifter — simplified OLA (Overlap-Add) method.
 * Controlled via port messages: { pitch: number, robot: boolean }
 */
class PitchShifterProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.pitch    = 1.0
    this.robot    = false
    this.ringFreq = 0
    this.ringPhase = 0

    const CAP = 16384
    this.inBuf  = new Float32Array(CAP)
    this.outBuf = new Float32Array(CAP)
    this.inLen  = 0
    this.outLen = 0

    this.grainSize = 1024
    this.hopIn     = 512
    this.hann      = this._makeHann(this.grainSize)

    this.port.onmessage = ({ data }) => {
      if (data.pitch  !== undefined) this.pitch    = data.pitch
      if (data.robot  !== undefined) this.robot    = data.robot
      if (data.ringFreq !== undefined) this.ringFreq = data.ringFreq
    }
  }

  _makeHann(n) {
    const w = new Float32Array(n)
    for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / n))
    return w
  }

  _resample(src, srcLen, dstLen) {
    const out = new Float32Array(dstLen)
    const ratio = srcLen / dstLen
    for (let i = 0; i < dstLen; i++) {
      const p = i * ratio
      const lo = p | 0
      const hi = Math.min(lo + 1, srcLen - 1)
      const f  = p - lo
      out[i] = src[lo] * (1 - f) + src[hi] * f
    }
    return out
  }

  _processGrain() {
    const gs = this.grainSize
    const hopOut = Math.round(this.hopIn * this.pitch)

    if (this.inLen < gs) return false

    // Grab grain
    const grain = this._resample(this.inBuf, gs, Math.round(gs / this.pitch))
    const stretched = this._resample(grain, grain.length, gs)

    // Window + overlap-add into outBuf
    for (let i = 0; i < gs; i++) {
      const pos = this.outLen + i
      if (pos < this.outBuf.length) {
        this.outBuf[pos] += stretched[i] * this.hann[i]
      }
    }
    this.outLen = Math.max(this.outLen, this.outLen + hopOut)

    // Consume input
    const consume = this.hopIn
    this.inBuf.copyWithin(0, consume)
    this.inLen -= consume
    return true
  }

  process(inputs, outputs) {
    const inp = inputs[0]?.[0]
    const out = outputs[0]?.[0]
    if (!inp || !out) return true

    // Push to input buffer
    for (let i = 0; i < inp.length; i++) {
      if (this.inLen < this.inBuf.length) this.inBuf[this.inLen++] = inp[i]
    }

    // Process grains until we have enough output
    while (this.outLen < out.length + this.grainSize) {
      if (!this._processGrain()) break
    }

    // Read from output buffer
    const take = Math.min(out.length, this.outLen)
    for (let i = 0; i < take; i++) out[i] = this.outBuf[i]
    for (let i = take; i < out.length; i++) out[i] = 0

    // Robot ring-mod overlay
    if (this.robot && this.ringFreq > 0) {
      const sr = sampleRate
      for (let i = 0; i < out.length; i++) {
        out[i] *= Math.sin(2 * Math.PI * this.ringFreq * this.ringPhase / sr)
        this.ringPhase++
      }
    }

    // Shift out buffer
    if (take > 0) {
      this.outBuf.copyWithin(0, take)
      this.outLen -= take
      this.outBuf.fill(0, this.outLen)
    }

    return true
  }
}

registerProcessor('pitch-shifter', PitchShifterProcessor)
