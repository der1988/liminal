import { attackAt, unrestAt } from "../simulation/events";
/** Optional procedural ambience; no downloads, speech or autoplay. */
export class Ambience {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = false;
  private roar: GainNode | null = null;
  private rumble: OscillatorNode | null = null;
  private voices: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private lastImpact = -1;
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
  update(time: number) {
    if (!this.context || !this.enabled || !this.roar || !this.rumble) return;
    const a = this.context,
      attack = attackAt(time, 0),
      unrest = unrestAt(time);
    this.roar.gain.setTargetAtTime(
      0.012 + attack.windup * 0.035 + attack.strike * 0.24,
      a.currentTime,
      0.1,
    );
    this.rumble.frequency.setTargetAtTime(
      38 + attack.windup * 12 + attack.strike * 25,
      a.currentTime,
      0.08,
    );
    this.voices?.gain.setTargetAtTime(
      0.012 + unrest.pressure * 0.025,
      a.currentTime,
      0.2,
    );
    const beat = Math.floor(time * 3.5);
    if (unrest.charge > 0.25 && beat !== this.lastImpact && this.noise) {
      this.lastImpact = beat;
      const source = a.createBufferSource();
      source.buffer = this.noise;
      const filter = a.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 380;
      const gain = a.createGain();
      gain.gain.setValueAtTime(0.4, a.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.19);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master!);
      source.start(0, 0, 0.21);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    }
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
    this.noise = noise;
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
    const growl = a.createOscillator();
    growl.type = "sawtooth";
    growl.frequency.value = 38;
    this.rumble = growl;
    const throat = a.createBiquadFilter();
    throat.type = "lowpass";
    throat.frequency.value = 155;
    throat.Q.value = 3;
    const roar = a.createGain();
    roar.gain.value = 0.012;
    this.roar = roar;
    growl.connect(throat);
    throat.connect(roar);
    roar.connect(master);
    growl.start();
    const crowd = a.createBufferSource();
    crowd.buffer = noise;
    crowd.loop = true;
    crowd.playbackRate.value = 1.8;
    const vocal = a.createBiquadFilter();
    vocal.type = "bandpass";
    vocal.frequency.value = 780;
    vocal.Q.value = 1.3;
    this.voices = a.createGain();
    this.voices.gain.value = 0.02;
    crowd.connect(vocal);
    vocal.connect(this.voices);
    this.voices.connect(master);
    crowd.start();
  }
  dispose() {
    void this.context?.close();
  }
}
