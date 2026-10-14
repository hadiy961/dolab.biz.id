class AudioSynthService {
  private audioCtx: AudioContext | null = null;
  private rotorOsc: OscillatorNode | null = null;
  private rotorGain: GainNode | null = null;
  private enabled = false;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggleAudio(): boolean {
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.rotorOsc = this.audioCtx.createOscillator();
      this.rotorGain = this.audioCtx.createGain();
      this.rotorOsc.type = 'triangle';
      this.rotorOsc.frequency.value = 95;
      this.rotorGain.gain.value = 0.0;
      this.rotorOsc.connect(this.rotorGain);
      this.rotorGain.connect(this.audioCtx.destination);
      this.rotorOsc.start();
    }

    this.enabled = !this.enabled;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (!this.enabled && this.rotorGain && this.audioCtx) {
      this.rotorGain.gain.setTargetAtTime(0.0, this.audioCtx.currentTime, 0.05);
    }
    return this.enabled;
  }

  public updateRotorSound(rotorThrottle: number, speed: number): void {
    if (!this.enabled || !this.audioCtx || !this.rotorOsc || !this.rotorGain) return;
    const speedNorm = Math.min(1, speed / 30);
    this.rotorOsc.frequency.setTargetAtTime(
      65 + rotorThrottle * 85 + speedNorm * 60,
      this.audioCtx.currentTime,
      0.08
    );
    this.rotorGain.gain.setTargetAtTime(rotorThrottle * 0.06, this.audioCtx.currentTime, 0.08);
  }

  public playBeep(freq = 720, duration = 0.06): void {
    if (!this.enabled || !this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.05;
      osc.connect(g);
      g.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Ignore browser autoplay restrictions
    }
  }

  public playChord(frequencies: number[]): void {
    if (!this.enabled) {
      this.toggleAudio();
    }
    frequencies.forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, 0.18), i * 90);
    });
  }
}

export const audioSynth = new AudioSynthService();
