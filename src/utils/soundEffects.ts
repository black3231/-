/**
 * Web Audio API 기반 효과음 합성기
 * 별도의 오디오 파일 로딩 없이 부드러운 아케이드 사운드 재생
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (typeof window === 'undefined') return null;
    
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /** 단어 입력 성공음 (밝은 화음) */
  playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.25);
    });
  }

  /** 오류음 (낮은 경고음) */
  playError() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** 타이머 카운트다운 째깍 소리 */
  playTick(isUrgent: boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 880 : 440, now); // A5 or A4

    gain.gain.setValueAtTime(isUrgent ? 0.15 : 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /** 한방단어 공격음 (묵직한 강타음) */
  playOneShot() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // 저음 펀치
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);

    // 고음 텐션 벨
    const bell = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(1320, now);
    bellGain.gain.setValueAtTime(0.15, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    bell.connect(bellGain);
    bellGain.connect(ctx.destination);

    bell.start(now);
    bell.stop(now + 0.5);
  }

  /** 승리 팡파레 */
  playVictory() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const melody = [
      { freq: 523.25, duration: 0.15 }, // C5
      { freq: 659.25, duration: 0.15 }, // E5
      { freq: 783.99, duration: 0.15 }, // G5
      { freq: 1046.50, duration: 0.4 }, // C6
    ];

    let timeOffset = 0;
    melody.forEach(({ freq, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + timeOffset);

      gain.gain.setValueAtTime(0.2, now + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + duration);

      timeOffset += duration * 0.9;
    });
  }

  /** 패배 사운드 */
  playDefeat() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 415.3, 392, 369.99]; // 하강 음계

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);

      gain.gain.setValueAtTime(0.12, now + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.25);
    });
  }
}

export const sounds = new SoundSynthesizer();
