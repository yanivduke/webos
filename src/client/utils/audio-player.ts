/**
 * Audio Player Engine
 * HTML5 Audio API wrapper for WebOS Media Player
 */

import type { MediaFile } from './media-library';

export type PlaybackMode = 'normal' | 'shuffle' | 'repeat-off' | 'repeat-one' | 'repeat-all';

export interface AudioPlayerState {
  currentTrack: MediaFile | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  mode: PlaybackMode;
  queue: MediaFile[];
  queueIndex: number;
  isLoading: boolean;
  error: string | null;
}

export interface EqualizerBand {
  frequency: number;
  gain: number; // -12 to +12 dB
}

type AudioPlayerEventType =
  | 'play'
  | 'pause'
  | 'stop'
  | 'trackchange'
  | 'timeupdate'
  | 'volumechange'
  | 'queuechange'
  | 'modechange'
  | 'ended'
  | 'error'
  | 'loading';

type EventCallback = (data?: any) => void;

class AudioPlayer {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private equalizerNodes: BiquadFilterNode[] = [];

  private state: AudioPlayerState = {
    currentTrack: null,
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    mode: 'normal',
    queue: [],
    queueIndex: -1,
    isLoading: false,
    error: null,
  };

  private eventListeners: Map<AudioPlayerEventType, Set<EventCallback>> = new Map();
  private playHistory: MediaFile[] = [];
  private shuffleHistory: number[] = []; // Indices of tracks played in shuffle mode
  private crossfadeDuration: number = 0; // seconds (0 = disabled)

  constructor() {
    this.audio = new Audio();
    this.setupAudioElement();
    this.loadState();
  }

  /**
   * Setup audio element event listeners
   */
  private setupAudioElement(): void {
    this.audio.addEventListener('loadstart', () => {
      this.state.isLoading = true;
      this.emit('loading', { isLoading: true });
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.state.duration = this.audio.duration;
      this.state.isLoading = false;
      this.emit('loading', { isLoading: false });
    });

    this.audio.addEventListener('timeupdate', () => {
      this.state.currentTime = this.audio.currentTime;
      this.emit('timeupdate', {
        currentTime: this.state.currentTime,
        duration: this.state.duration,
      });
    });

    this.audio.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    this.audio.addEventListener('error', (e) => {
      const error = this.audio.error;
      this.state.error = error ? `Audio error: ${error.message}` : 'Unknown audio error';
      this.state.isLoading = false;
      this.emit('error', { error: this.state.error });
    });

    this.audio.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.state.isPaused = false;
      this.emit('play');
    });

    this.audio.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.state.isPaused = true;
      this.emit('pause');
    });
  }

  /**
   * Initialize Web Audio API (for equalizer and visualization)
   */
  private initAudioContext(): void {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.gainNode = this.audioContext.createGain();
      this.analyserNode = this.audioContext.createAnalyser();

      // Setup 5-band equalizer
      const frequencies = [60, 230, 910, 3600, 14000]; // Hz
      this.equalizerNodes = frequencies.map(freq => {
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });

      // Connect nodes: source -> eq -> gain -> analyser -> destination
      let currentNode: AudioNode = this.sourceNode;
      for (const eqNode of this.equalizerNodes) {
        currentNode.connect(eqNode);
        currentNode = eqNode;
      }
      currentNode.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);

      // Configure analyser
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;
    } catch (error) {
      console.error('Failed to initialize Audio Context:', error);
    }
  }

  // ==================== Playback Control ====================

  /**
   * Load and play a track
   */
  async loadTrack(track: MediaFile): Promise<void> {
    try {
      this.state.error = null;
      this.state.currentTrack = track;
      this.audio.src = track.path;
      this.initAudioContext();

      await this.audio.load();
      this.emit('trackchange', { track });
    } catch (error) {
      this.state.error = `Failed to load track: ${error}`;
      this.emit('error', { error: this.state.error });
      throw error;
    }
  }

  /**
   * Play current or specified track
   */
  async play(track?: MediaFile): Promise<void> {
    try {
      if (track) {
        await this.loadTrack(track);
      }

      if (!this.audio.src) {
        throw new Error('No track loaded');
      }

      await this.audio.play();

      // Add to play history
      if (this.state.currentTrack) {
        this.playHistory.unshift(this.state.currentTrack);
        if (this.playHistory.length > 50) {
          this.playHistory = this.playHistory.slice(0, 50);
        }
      }
    } catch (error) {
      this.state.error = `Failed to play: ${error}`;
      this.emit('error', { error: this.state.error });
      throw error;
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.audio.pause();
  }

  /**
   * Stop playback and reset position
   */
  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.emit('stop');
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Seek to position (in seconds)
   */
  seek(seconds: number): void {
    if (!this.audio.src) return;

    this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration));
    this.state.currentTime = this.audio.currentTime;
    this.emit('timeupdate', {
      currentTime: this.state.currentTime,
      duration: this.state.duration,
    });
  }

  /**
   * Seek by delta (in seconds)
   */
  seekBy(delta: number): void {
    this.seek(this.state.currentTime + delta);
  }

  // ==================== Volume Control ====================

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(level: number): void {
    this.state.volume = Math.max(0, Math.min(1, level));
    this.audio.volume = this.state.volume;

    if (this.gainNode) {
      this.gainNode.gain.value = this.state.volume;
    }

    this.emit('volumechange', { volume: this.state.volume });
    this.saveState();
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.state.isMuted = !this.state.isMuted;
    this.audio.muted = this.state.isMuted;
    this.emit('volumechange', { volume: this.state.volume, isMuted: this.state.isMuted });
  }

  /**
   * Increase volume by 10%
   */
  volumeUp(): void {
    this.setVolume(this.state.volume + 0.1);
  }

  /**
   * Decrease volume by 10%
   */
  volumeDown(): void {
    this.setVolume(this.state.volume - 0.1);
  }

  // ==================== Queue Management ====================

  /**
   * Set the playback queue
   */
  setQueue(tracks: MediaFile[], startIndex: number = 0): void {
    this.state.queue = [...tracks];
    this.state.queueIndex = startIndex;
    this.shuffleHistory = [];
    this.emit('queuechange', { queue: this.state.queue, index: this.state.queueIndex });
    this.saveState();
  }

  /**
   * Add tracks to the end of the queue
   */
  addToQueue(tracks: MediaFile[]): void {
    this.state.queue.push(...tracks);
    this.emit('queuechange', { queue: this.state.queue, index: this.state.queueIndex });
    this.saveState();
  }

  /**
   * Insert tracks after current track
   */
  playNext(tracks: MediaFile[]): void {
    const insertIndex = this.state.queueIndex + 1;
    this.state.queue.splice(insertIndex, 0, ...tracks);
    this.emit('queuechange', { queue: this.state.queue, index: this.state.queueIndex });
    this.saveState();
  }

  /**
   * Remove track from queue by index
   */
  removeFromQueue(index: number): void {
    if (index < 0 || index >= this.state.queue.length) return;

    this.state.queue.splice(index, 1);

    // Adjust current index if needed
    if (index < this.state.queueIndex) {
      this.state.queueIndex--;
    } else if (index === this.state.queueIndex) {
      // Removed current track, stop playback
      this.stop();
      this.state.currentTrack = null;
      this.state.queueIndex = Math.min(this.state.queueIndex, this.state.queue.length - 1);
    }

    this.emit('queuechange', { queue: this.state.queue, index: this.state.queueIndex });
    this.saveState();
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.state.queue = [];
    this.state.queueIndex = -1;
    this.shuffleHistory = [];
    this.emit('queuechange', { queue: this.state.queue, index: this.state.queueIndex });
    this.saveState();
  }

  /**
   * Reorder queue (move track from one index to another)
   */
  reorderQueue(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.state.queue.length ||
        toIndex < 0 || toIndex >= this.state.queue.length) {
      return;
    }

    const [track] = this.state.queue.splice(fromIndex, 1);
    this.state.queue.splice(toIndex, 0, track);

    // Adjust current index
    if (fromIndex === this.state.queueIndex) {
      this.state.queueIndex = toIndex;
    } else if (fromIndex < this.state.queueIndex && toIndex >= this.state.queueIndex) {
      this.state.queueIndex--;
    } else if (fromIndex > this.state.queueIndex && toIndex <= this.state.queueIndex) {
      this.state.queueIndex++;
    }

    this.emit('queuechange', { queue: this.state.queue, index: this.state.queueIndex });
    this.saveState();
  }

  // ==================== Playback Modes ====================

  /**
   * Set playback mode
   */
  setMode(mode: PlaybackMode): void {
    this.state.mode = mode;
    this.emit('modechange', { mode });
    this.saveState();
  }

  /**
   * Cycle repeat mode
   */
  cycleRepeatMode(): void {
    const modes: PlaybackMode[] = ['repeat-off', 'repeat-all', 'repeat-one'];
    const currentIndex = modes.indexOf(this.state.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setMode(modes[nextIndex]);
  }

  /**
   * Toggle shuffle mode
   */
  toggleShuffle(): void {
    if (this.state.mode === 'shuffle') {
      this.setMode('normal');
      this.shuffleHistory = [];
    } else {
      this.setMode('shuffle');
    }
  }

  // ==================== Track Navigation ====================

  /**
   * Play next track in queue
   */
  async next(): Promise<void> {
    if (this.state.queue.length === 0) return;

    let nextIndex: number;

    if (this.state.mode === 'shuffle') {
      nextIndex = this.getRandomUnplayedIndex();
    } else {
      nextIndex = this.state.queueIndex + 1;

      // Handle repeat modes
      if (nextIndex >= this.state.queue.length) {
        if (this.state.mode === 'repeat-all') {
          nextIndex = 0;
        } else {
          // End of queue
          this.stop();
          this.emit('ended');
          return;
        }
      }
    }

    this.state.queueIndex = nextIndex;
    const track = this.state.queue[nextIndex];

    if (track) {
      await this.play(track);
      this.emit('queuechange', { queue: this.state.queue, index: this.state.queueIndex });
    }
  }

  /**
   * Play previous track in queue
   */
  async previous(): Promise<void> {
    // If more than 3 seconds into track, restart current track
    if (this.state.currentTime > 3) {
      this.seek(0);
      return;
    }

    if (this.state.queue.length === 0) return;

    let prevIndex: number;

    if (this.state.mode === 'shuffle' && this.shuffleHistory.length > 1) {
      // Go back in shuffle history
      this.shuffleHistory.pop(); // Remove current
      prevIndex = this.shuffleHistory[this.shuffleHistory.length - 1];
    } else {
      prevIndex = this.state.queueIndex - 1;

      if (prevIndex < 0) {
        if (this.state.mode === 'repeat-all') {
          prevIndex = this.state.queue.length - 1;
        } else {
          prevIndex = 0;
        }
      }
    }

    this.state.queueIndex = prevIndex;
    const track = this.state.queue[prevIndex];

    if (track) {
      await this.play(track);
      this.emit('queuechange', { queue: this.state.queue, index: this.state.queueIndex });
    }
  }

  /**
   * Handle track ended event
   */
  private async handleTrackEnded(): Promise<void> {
    if (this.state.mode === 'repeat-one') {
      this.seek(0);
      await this.play();
    } else {
      await this.next();
    }
  }

  /**
   * Get random unplayed index for shuffle mode
   */
  private getRandomUnplayedIndex(): number {
    const unplayed = this.state.queue
      .map((_, index) => index)
      .filter(index => !this.shuffleHistory.includes(index));

    if (unplayed.length === 0) {
      // All tracks played, reset shuffle history
      this.shuffleHistory = [];
      return Math.floor(Math.random() * this.state.queue.length);
    }

    const randomIndex = unplayed[Math.floor(Math.random() * unplayed.length)];
    this.shuffleHistory.push(randomIndex);
    return randomIndex;
  }

  // ==================== Equalizer ====================

  /**
   * Set equalizer band gain
   */
  setEqualizerBand(bandIndex: number, gain: number): void {
    if (!this.equalizerNodes[bandIndex]) {
      this.initAudioContext();
    }

    if (this.equalizerNodes[bandIndex]) {
      const clampedGain = Math.max(-12, Math.min(12, gain));
      this.equalizerNodes[bandIndex].gain.value = clampedGain;
      this.saveState();
    }
  }

  /**
   * Get equalizer bands
   */
  getEqualizerBands(): EqualizerBand[] {
    const frequencies = [60, 230, 910, 3600, 14000];
    return frequencies.map((freq, index) => ({
      frequency: freq,
      gain: this.equalizerNodes[index]?.gain.value || 0,
    }));
  }

  /**
   * Reset equalizer to flat (all gains to 0)
   */
  resetEqualizer(): void {
    this.equalizerNodes.forEach(node => {
      node.gain.value = 0;
    });
    this.saveState();
  }

  // ==================== Analyser (for visualization) ====================

  /**
   * Get analyser node for visualization
   */
  getAnalyser(): AnalyserNode | null {
    if (!this.analyserNode) {
      this.initAudioContext();
    }
    return this.analyserNode;
  }

  // ==================== State Management ====================

  /**
   * Get current player state
   */
  getState(): Readonly<AudioPlayerState> {
    return { ...this.state };
  }

  /**
   * Get play history
   */
  getPlayHistory(): MediaFile[] {
    return [...this.playHistory];
  }

  /**
   * Save state to localStorage
   */
  private saveState(): void {
    try {
      const stateToSave = {
        volume: this.state.volume,
        mode: this.state.mode,
        equalizerBands: this.getEqualizerBands(),
      };
      localStorage.setItem('webos_audio_player_state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save audio player state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadState(): void {
    try {
      const saved = localStorage.getItem('webos_audio_player_state');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.volume !== undefined) {
          this.setVolume(state.volume);
        }
        if (state.mode) {
          this.state.mode = state.mode;
        }
        if (state.equalizerBands) {
          state.equalizerBands.forEach((band: EqualizerBand, index: number) => {
            this.setEqualizerBand(index, band.gain);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load audio player state:', error);
    }
  }

  // ==================== Event System ====================

  /**
   * Add event listener
   */
  on(event: AudioPlayerEventType, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: AudioPlayerEventType, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event
   */
  private emit(event: AudioPlayerEventType, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // ==================== Cleanup ====================

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.audio.src = '';
    this.eventListeners.clear();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance
export const audioPlayer = new AudioPlayer();
