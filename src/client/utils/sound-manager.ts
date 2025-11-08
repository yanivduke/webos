/**
 * Amiga-style Sound Manager
 * Handles all system sounds with authentic Amiga-style audio
 */

export type SoundType =
  | 'click'
  | 'open'
  | 'close'
  | 'error'
  | 'insert'
  | 'eject'
  | 'delete'
  | 'drag'
  | 'drop'
  | 'menu'
  | 'startup';

interface SoundConfig {
  enabled: boolean;
  volume: number;
}

class SoundManager {
  private config: SoundConfig = {
    enabled: true,
    volume: 0.3
  };

  private audioContext: AudioContext | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported', error);
    }
  }

  /**
   * Play a system sound
   */
  play(soundType: SoundType) {
    if (!this.config.enabled || !this.audioContext) return;

    switch (soundType) {
      case 'click':
        this.playClick();
        break;
      case 'open':
        this.playOpen();
        break;
      case 'close':
        this.playClose();
        break;
      case 'error':
        this.playError();
        break;
      case 'insert':
        this.playInsert();
        break;
      case 'eject':
        this.playEject();
        break;
      case 'delete':
        this.playDelete();
        break;
      case 'drag':
        this.playDrag();
        break;
      case 'drop':
        this.playDrop();
        break;
      case 'menu':
        this.playMenu();
        break;
      case 'startup':
        this.playStartup();
        break;
    }
  }

  /**
   * Simple click sound
   */
  private playClick() {
    this.playBeep(800, 0.05, 'sine', 0.15);
  }

  /**
   * Window open sound (rising tone)
   */
  private playOpen() {
    const ctx = this.audioContext!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(this.config.volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /**
   * Window close sound (falling tone)
   */
  private playClose() {
    const ctx = this.audioContext!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(this.config.volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /**
   * Error sound (harsh beep)
   */
  private playError() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playBeep(200, 0.1, 'sawtooth', 0.4);
      }, i * 150);
    }
  }

  /**
   * Disk insert sound
   */
  private playInsert() {
    this.playBeep(600, 0.08, 'square', 0.2);
    setTimeout(() => this.playBeep(800, 0.08, 'square', 0.2), 80);
  }

  /**
   * Disk eject sound
   */
  private playEject() {
    this.playBeep(800, 0.08, 'square', 0.2);
    setTimeout(() => this.playBeep(600, 0.08, 'square', 0.2), 80);
  }

  /**
   * Delete/trash sound
   */
  private playDelete() {
    const ctx = this.audioContext!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(this.config.volume * 0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  /**
   * Drag start sound
   */
  private playDrag() {
    this.playBeep(500, 0.04, 'sine', 0.1);
  }

  /**
   * Drop sound
   */
  private playDrop() {
    this.playBeep(700, 0.06, 'sine', 0.15);
  }

  /**
   * Menu interaction sound
   */
  private playMenu() {
    this.playBeep(1000, 0.03, 'sine', 0.12);
  }

  /**
   * System startup sound (Amiga-style)
   */
  private playStartup() {
    // First tone
    setTimeout(() => this.playBeep(440, 0.15, 'sine', 0.3), 0);
    // Second tone
    setTimeout(() => this.playBeep(554, 0.15, 'sine', 0.3), 200);
    // Third tone
    setTimeout(() => this.playBeep(659, 0.25, 'sine', 0.35), 400);
  }

  /**
   * Generic beep helper
   */
  private playBeep(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.2
  ) {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(this.config.volume * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    this.saveConfig();
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.saveConfig();
  }

  /**
   * Get current config
   */
  getConfig(): SoundConfig {
    return { ...this.config };
  }

  /**
   * Load config from localStorage
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem('webos-sound-config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load sound config', error);
    }
  }

  /**
   * Save config to localStorage
   */
  private saveConfig() {
    try {
      localStorage.setItem('webos-sound-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save sound config', error);
    }
  }
}

// Singleton instance
const soundManager = new SoundManager();
soundManager.loadConfig();

export default soundManager;
