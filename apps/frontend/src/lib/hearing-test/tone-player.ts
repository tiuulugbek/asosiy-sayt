/**
 * Sof ton chiqaruvchi (Web Audio).
 *
 * - Sinus toni, uzuq-uzuq (impulsli), har bir impuls yumshoq boshlanib tugaydi (chertish eshitilmasligi uchun).
 * - Ton faqat bitta quloqqa beriladi: chap yoki oʻng kanal.
 * - Daraja dBFS da beriladi: amplituda = 10^(dB/20).
 */
export type Ear = 'left' | 'right';

export interface ToneOptions {
  frequency: number;
  /** Daraja, dBFS (manfiy son; 0 — eng baland). */
  levelDb: number;
  ear: Ear;
  pulses?: number;
  pulseMs?: number;
  gapMs?: number;
}

const RAMP_SECONDS = 0.035;

export class TonePlayer {
  private context: AudioContext | null = null;
  private merger: ChannelMergerNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  /** Foydalanuvchi tugmani bosgan paytda chaqirilishi kerak (brauzer ovozga shundagina ruxsat beradi). */
  async unlock(): Promise<void> {
    if (!this.context) {
      const Ctor: typeof AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.context = new Ctor();
      this.merger = this.context.createChannelMerger(2);
      this.merger.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  /** Tonni beradi va uning umumiy davomiyligini (ms) qaytaradi. */
  play({ frequency, levelDb, ear, pulses = 2, pulseMs = 450, gapMs = 200 }: ToneOptions): number {
    this.stop();
    const context = this.context;
    const merger = this.merger;
    if (!context || !merger) return 0;

    const amplitude = Math.pow(10, Math.min(0, levelDb) / 20);
    const pulse = pulseMs / 1000;
    const gap = gapMs / 1000;
    const start = context.currentTime + 0.02;
    const total = pulses * pulse + (pulses - 1) * gap;

    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0, context.currentTime);
    for (let i = 0; i < pulses; i += 1) {
      const t0 = start + i * (pulse + gap);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(amplitude, t0 + RAMP_SECONDS);
      gain.gain.setValueAtTime(amplitude, t0 + pulse - RAMP_SECONDS);
      gain.gain.linearRampToValueAtTime(0, t0 + pulse);
    }

    oscillator.connect(gain);
    // Kirish 0 — chap kanal, kirish 1 — oʻng kanal. Ikkinchi kanal jim qoladi.
    gain.connect(merger, 0, ear === 'left' ? 0 : 1);
    oscillator.start(start);
    oscillator.stop(start + total + 0.05);
    oscillator.onended = () => {
      if (this.oscillator === oscillator) {
        this.disconnect();
      }
    };

    this.oscillator = oscillator;
    this.gain = gain;
    return Math.round((0.02 + total) * 1000);
  }

  /** Tonni yumshoq toʻxtatadi. */
  stop(): void {
    const { context, oscillator, gain } = this;
    if (!context || !oscillator || !gain) return;
    try {
      const now = context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + RAMP_SECONDS);
      oscillator.stop(now + RAMP_SECONDS + 0.01);
    } catch {
      // ton allaqachon tugagan
    }
    this.oscillator = null;
    this.gain = null;
  }

  private disconnect(): void {
    try {
      this.oscillator?.disconnect();
      this.gain?.disconnect();
    } catch {
      // allaqachon uzilgan
    }
    this.oscillator = null;
    this.gain = null;
  }

  close(): void {
    this.stop();
    if (this.context) {
      void this.context.close();
      this.context = null;
      this.merger = null;
    }
  }
}
