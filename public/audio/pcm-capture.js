// Original streaming mono resampler. Only 20ms PCM frames leave this worklet;
// microphone samples are never retained beyond the current interpolation frame.
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.alive = true;
    this.carry = new Float32Array(0);
    this.position = 0;
    this.frame = new Int16Array(320);
    this.count = 0;
    this.port.onmessage = (event) => {
      if (event.data?.type === "stop") {
        this.alive = false;
        this.carry = new Float32Array(0);
        this.frame.fill(0);
      }
    };
  }
  process(inputs, outputs) {
    if (outputs[0]) for (const channel of outputs[0]) channel.fill(0);
    if (!this.alive) return false;
    const input = inputs[0]?.[0];
    if (!input?.length) return true;
    const samples = new Float32Array(this.carry.length + input.length);
    samples.set(this.carry);
    samples.set(input, this.carry.length);
    const ratio = sampleRate / 16000;
    while (this.position + 1 < samples.length) {
      const i = Math.floor(this.position),
        fraction = this.position - i;
      const value = Math.max(
        -1,
        Math.min(1, samples[i] + (samples[i + 1] - samples[i]) * fraction),
      );
      this.frame[this.count++] = Math.round(
        value * (value < 0 ? 32768 : 32767),
      );
      this.position += ratio;
      if (this.count === 320) {
        const buffer = new ArrayBuffer(640),
          view = new DataView(buffer);
        for (let j = 0; j < 320; j++) view.setInt16(j * 2, this.frame[j], true);
        this.port.postMessage({ type: "pcm", buffer }, [buffer]);
        this.count = 0;
      }
    }
    const used = Math.min(samples.length, Math.floor(this.position));
    this.carry = samples.slice(used);
    this.position -= used;
    return true;
  }
}
registerProcessor("vantagallu-pcm-capture", PcmCapture);
