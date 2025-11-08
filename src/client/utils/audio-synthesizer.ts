/**
 * Audio Synthesizer - Web Audio API utility for generating retro Amiga-style sounds
 * Uses OscillatorNode for tone generation with chiptuneish waveforms
 */

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface SoundConfig {
  frequency: number | number[]; // Single frequency or array for glides
  duration: number; // milliseconds
  waveform: WaveformType;
  volume?: number; // 0-1
  attack?: number; // milliseconds
  decay?: number; // milliseconds
}

/**
 * Play a single tone using Web Audio API
 */
export const playTone = (
  frequency: number,
  duration: number,
  waveform: WaveformType = 'square',
  volume: number = 0.3
): void => {
  try {
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.frequency.value = frequency;
    oscillator.type = waveform;

    // Envelope: quick attack, exponential decay
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + duration / 1000
    );

    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration / 1000);

    // Clean up context after sound finishes
    setTimeout(() => {
      audioCtx.close();
    }, duration + 100);
  } catch (error) {
    console.error('Error playing tone:', error);
  }
};

/**
 * Play a frequency sweep (glide) - great for open/close sounds
 */
export const playGlide = (
  startFreq: number,
  endFreq: number,
  duration: number,
  waveform: WaveformType = 'sawtooth',
  volume: number = 0.3
): void => {
  try {
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      endFreq,
      audioCtx.currentTime + duration / 1000
    );

    // Envelope
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + duration / 1000
    );

    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration / 1000);

    setTimeout(() => {
      audioCtx.close();
    }, duration + 100);
  } catch (error) {
    console.error('Error playing glide:', error);
  }
};

/**
 * Play a chord (multiple frequencies simultaneously)
 */
export const playChord = (
  frequencies: number[],
  duration: number,
  waveform: WaveformType = 'square',
  volume: number = 0.2
): void => {
  try {
    const audioCtx = new AudioContext();
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(volume, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    frequencies.forEach((freq) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.frequency.value = freq;
      oscillator.type = waveform;

      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + duration / 1000
      );

      oscillator.connect(gainNode).connect(masterGain);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + duration / 1000);
    });

    setTimeout(() => {
      audioCtx.close();
    }, duration + 100);
  } catch (error) {
    console.error('Error playing chord:', error);
  }
};

/**
 * Play a sequence of notes
 */
export const playSequence = (
  notes: Array<{ frequency: number; duration: number }>,
  waveform: WaveformType = 'square',
  volume: number = 0.3
): void => {
  try {
    const audioCtx = new AudioContext();
    let currentTime = audioCtx.currentTime;

    notes.forEach((note) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.frequency.value = note.frequency;
      oscillator.type = waveform;

      gainNode.gain.setValueAtTime(volume, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        currentTime + note.duration / 1000
      );

      oscillator.connect(gainNode).connect(audioCtx.destination);
      oscillator.start(currentTime);
      oscillator.stop(currentTime + note.duration / 1000);

      currentTime += note.duration / 1000;
    });

    const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0);
    setTimeout(() => {
      audioCtx.close();
    }, totalDuration + 100);
  } catch (error) {
    console.error('Error playing sequence:', error);
  }
};

/**
 * Play noise burst (for error sounds)
 */
export const playNoise = (duration: number, volume: number = 0.2): void => {
  try {
    const audioCtx = new AudioContext();
    const bufferSize = audioCtx.sampleRate * (duration / 1000);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + duration / 1000
    );

    noise.connect(gainNode).connect(audioCtx.destination);
    noise.start(audioCtx.currentTime);

    setTimeout(() => {
      audioCtx.close();
    }, duration + 100);
  } catch (error) {
    console.error('Error playing noise:', error);
  }
};

/**
 * Play a blip (very short click)
 */
export const playBlip = (frequency: number = 1000, volume: number = 0.2): void => {
  playTone(frequency, 30, 'square', volume);
};
