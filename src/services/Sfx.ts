import { Save } from './Save';

// Sonidos 8-bit sintetizados en tiempo real con Web Audio API.
// Ventaja: no hay archivos de audio que cargar ni licencias que gestionar.

type Wave = OscillatorType;

export type SfxName =
  | 'click' | 'reveal' | 'flag' | 'wrong' | 'alarm' | 'tick' | 'tickFast'
  | 'boom' | 'defused' | 'win' | 'error' | 'cut' | 'blip' | 'egg'
  | 'padR' | 'padB' | 'padG' | 'padY' | 'step' | 'rotate' | 'toggle';

// Melodía de fondo: notas MIDI (0 = silencio), 8 pasos por compás.
const LEAD = [69, 0, 72, 0, 76, 74, 72, 0, 69, 0, 72, 74, 76, 0, 79, 0, 77, 0, 76, 0, 74, 72, 74, 0, 72, 0, 69, 0, 71, 0, 72, 0];
const BASS = [45, 45, 0, 45, 48, 0, 48, 0, 41, 41, 0, 41, 43, 0, 43, 0, 45, 45, 0, 45, 48, 0, 48, 0, 41, 0, 43, 0, 45, 0, 45, 0];

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

class SfxEngine {
  private ctx?: AudioContext;
  private master?: GainNode;
  private musicGain?: GainNode;
  private musicTimer?: number;
  private step = 0;
  private nextNoteTime = 0;

  /** Los navegadores exigen un gesto del usuario antes de reproducir audio. */
  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private tone(freq: number, dur: number, type: Wave = 'square', vol = 0.2, slideTo?: number, delay = 0, out?: AudioNode): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(out ?? this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.4, delay = 0, lowpass = 1200): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(lowpass, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
  }

  play(name: SfxName): void {
    if (!Save.data.sound) return;
    this.unlock();
    switch (name) {
      case 'click': this.tone(660, 0.06, 'square', 0.12); break;
      case 'blip': this.tone(880, 0.05, 'square', 0.1); break;
      case 'toggle': this.tone(520, 0.05, 'square', 0.12); this.tone(780, 0.05, 'square', 0.12, undefined, 0.05); break;
      case 'reveal': this.tone(300 + Math.random() * 120, 0.05, 'triangle', 0.18); break;
      case 'step': this.tone(400, 0.04, 'triangle', 0.15); break;
      case 'rotate': this.tone(250, 0.06, 'square', 0.1, 400); break;
      case 'flag': this.tone(500, 0.08, 'square', 0.15, 900); break;
      case 'cut': this.noise(0.08, 0.3, 0, 4000); this.tone(1200, 0.05, 'square', 0.1, 300); break;
      case 'wrong': this.tone(220, 0.12, 'square', 0.2); this.tone(160, 0.2, 'square', 0.2, undefined, 0.1); break;
      case 'error': this.tone(140, 0.25, 'sawtooth', 0.22, 70); break;
      case 'tick': this.tone(1000, 0.03, 'square', 0.06); break;
      case 'tickFast': this.tone(1400, 0.04, 'square', 0.1); break;
      case 'alarm':
        for (let i = 0; i < 3; i++) {
          this.tone(880, 0.1, 'square', 0.18, undefined, i * 0.2);
          this.tone(660, 0.1, 'square', 0.18, undefined, i * 0.2 + 0.1);
        }
        break;
      case 'boom':
        this.noise(1.2, 0.9, 0, 2000);
        this.tone(120, 0.8, 'sawtooth', 0.4, 30);
        break;
      case 'defused':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'square', 0.15, undefined, i * 0.08));
        break;
      case 'win':
        [523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, 'square', 0.15, undefined, i * 0.11));
        break;
      case 'egg':
        [784, 988, 1175, 1568, 1175, 1568].forEach((f, i) => this.tone(f, 0.08, 'triangle', 0.2, undefined, i * 0.07));
        break;
      case 'padR': this.tone(midi(60), 0.3, 'square', 0.15); break;
      case 'padB': this.tone(midi(64), 0.3, 'square', 0.15); break;
      case 'padG': this.tone(midi(67), 0.3, 'square', 0.15); break;
      case 'padY': this.tone(midi(72), 0.3, 'square', 0.15); break;
    }
  }

  // --- Música en bucle con planificador "lookahead" ---
  startMusic(): void {
    if (!Save.data.music || this.musicTimer !== undefined) return;
    this.unlock();
    if (!this.ctx) return;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.schedule(), 50);
  }

  stopMusic(): void {
    if (this.musicTimer !== undefined) window.clearInterval(this.musicTimer);
    this.musicTimer = undefined;
  }

  private schedule(): void {
    if (!this.ctx || !this.musicGain) return;
    const stepDur = 0.16;
    while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
      const delay = this.nextNoteTime - this.ctx.currentTime;
      const lead = LEAD[this.step % LEAD.length];
      const bass = BASS[this.step % BASS.length];
      if (lead) this.tone(midi(lead), stepDur * 0.9, 'square', 0.5, undefined, delay, this.musicGain);
      if (bass) this.tone(midi(bass), stepDur * 0.9, 'triangle', 0.9, undefined, delay, this.musicGain);
      this.step++;
      this.nextNoteTime += stepDur;
    }
  }
}

export const Sfx = new SfxEngine();
