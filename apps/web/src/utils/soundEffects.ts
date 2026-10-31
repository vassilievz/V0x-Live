// Utilitário de efeitos sonoros sintetizados via Web Audio API — Vox Live
class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private lastPlayedAt: Record<string, number> = {};
  private readonly storageKey = "vox_sfx_enabled";

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(this.storageKey) !== "false";
  }

  public setEnabled(enabled: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.storageKey, String(enabled));
  }

  private canPlay(key: string, cooldownMs = 250): boolean {
    if (!this.isEnabled()) return false;
    const now = performance.now();
    const last = this.lastPlayedAt[key] ?? 0;
    if (now - last < cooldownMs) return false;
    this.lastPlayedAt[key] = now;
    return true;
  }

  public playJoin(): void {
    if (!this.canPlay("join", 350)) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playTone(ctx, 440, now, 0.09, "triangle", 0.12, 1400);
    this.playTone(ctx, 659.25, now + 0.075, 0.16, "sine", 0.14, 1800);
  }

  public playLeave(): void {
    if (!this.canPlay("leave", 350)) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playTone(ctx, 329.63, now, 0.08, "triangle", 0.11, 1000);
    this.playTone(ctx, 220.0, now + 0.07, 0.15, "sine", 0.12, 800);
  }

  public playUnmute(): void {
    if (!this.canPlay("mic", 120)) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playTone(ctx, 523.25, now, 0.045, "sine", 0.08, 1600);
    this.playTone(ctx, 698.46, now + 0.035, 0.06, "sine", 0.09, 2000);
  }

  public playMute(): void {
    if (!this.canPlay("mic", 120)) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playTone(ctx, 480, now, 0.045, "sine", 0.08, 1200);
    this.playTone(ctx, 340, now + 0.035, 0.06, "sine", 0.08, 900);
  }

  public playCineStart(): void {
    if (!this.canPlay("cine", 1000)) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playTone(ctx, 293.66, now, 0.18, "triangle", 0.09, 1200);
    this.playTone(ctx, 440.0, now + 0.08, 0.22, "sine", 0.09, 1600);
    this.playTone(ctx, 587.33, now + 0.16, 0.3, "sine", 0.1, 2000);
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    peakGain: number,
    filterFreq: number,
  ): void {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterFreq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    } catch {
      /* AudioContext not ready */
    }
  }
}

export const soundEffects = new SoundEffectsManager();
