/** Optional procedural ambience; no downloads, speech or autoplay. */
export class Ambience {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = false;
  async toggle() {
    if (!this.context) this.create();
    const next = !this.enabled;
    await this.context!.resume();
    this.enabled = next;
    this.master!.gain.setTargetAtTime(
      next ? 0.25 : 0,
      this.context!.currentTime,
      0.6,
    );
    return this.enabled;
  }
  pause(paused: boolean) {
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        this.enabled && !paused ? 0.25 : 0,
        this.context.currentTime,
        0.6,
      );
  }
  private create() {
    const a = new AudioContext();
    this.context = a;
    const master = a.createGain();
    master.gain.value = 0;
    master.connect(a.destination);
    this.master = master;
    const noise = a.createBuffer(1, a.sampleRate * 4, a.sampleRate);
    const data = noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + Math.random() * 0.04 - 0.02) / 1.02;
      data[i] = last * 3.5;
    }
    const source = a.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const low = a.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 550;
    source.connect(low);
    low.connect(master);
    source.start();
    const hum = a.createOscillator();
    hum.frequency.value = 43;
    const gain = a.createGain();
    gain.gain.value = 0.06;
    hum.connect(gain);
    gain.connect(master);
    hum.start();
    const siren = a.createOscillator();
    siren.type = "sine";
    siren.frequency.value = 490;
    const sirenGain = a.createGain();
    sirenGain.gain.value = 0.009;
    const modulation = a.createOscillator();
    modulation.frequency.value = 0.14;
    const depth = a.createGain();
    depth.gain.value = 130;
    modulation.connect(depth);
    depth.connect(siren.frequency);
    siren.connect(sirenGain);
    sirenGain.connect(master);
    siren.start();
    modulation.start();
  }
  dispose() {
    void this.context?.close();
  }
}
