/**
 * Sound Effects Composable
 * Manages Amiga-style sound effects with volume control and persistence
 */

import { ref, watch } from 'vue';
import {
  playTone,
  playGlide,
  playChord,
  playSequence,
  playNoise,
  playBlip,
  type WaveformType
} from '../utils/audio-synthesizer';

export type SoundEventType =
  | 'click'
  | 'open'
  | 'close'
  | 'error'
  | 'success'
  | 'type'
  | 'dragStart'
  | 'drop'
  | 'menuOpen'
  | 'startup';

interface SoundSettings {
  volume: number; // 0-100
  muted: boolean;
}

// Sound presets for each event type
const soundPresets: Record<SoundEventType, () => void> = {
  // Desktop icon click, button press - short sharp click
  click: () => {
    playBlip(880, getAdjustedVolume(0.2));
  },

  // Window/drawer opens - ascending glide
  open: () => {
    playGlide(440, 880, 150, 'sawtooth', getAdjustedVolume(0.25));
  },

  // Window closes - descending glide
  close: () => {
    playGlide(880, 440, 150, 'sawtooth', getAdjustedVolume(0.25));
  },

  // Error alert - harsh low beep sequence
  error: () => {
    playSequence(
      [
        { frequency: 220, duration: 100 },
        { frequency: 200, duration: 100 },
        { frequency: 220, duration: 100 }
      ],
      'square',
      getAdjustedVolume(0.3)
    );
  },

  // Success - happy chirp
  success: () => {
    playSequence(
      [
        { frequency: 523, duration: 80 }, // C5
        { frequency: 659, duration: 80 }, // E5
        { frequency: 784, duration: 120 }  // G5
      ],
      'square',
      getAdjustedVolume(0.25)
    );
  },

  // Key press in text fields - soft tick
  type: () => {
    playBlip(1200, getAdjustedVolume(0.1));
  },

  // Begin dragging icon - pickup sound
  dragStart: () => {
    playGlide(600, 800, 80, 'triangle', getAdjustedVolume(0.2));
  },

  // Drop icon - place sound
  drop: () => {
    playGlide(800, 400, 100, 'triangle', getAdjustedVolume(0.2));
  },

  // Menu expands - quick blip
  menuOpen: () => {
    playBlip(1400, getAdjustedVolume(0.15));
  },

  // Classic Amiga boot sound sequence - iconic startup
  startup: () => {
    playSequence(
      [
        { frequency: 440, duration: 150 }, // A4
        { frequency: 554, duration: 150 }, // C#5
        { frequency: 659, duration: 150 }, // E5
        { frequency: 880, duration: 300 }  // A5 (held longer)
      ],
      'square',
      getAdjustedVolume(0.3)
    );
  }
};

// Global sound settings state
const settings = ref<SoundSettings>({
  volume: 70,
  muted: false
});

// Load settings from localStorage on initialization
const loadSettings = (): void => {
  try {
    const saved = localStorage.getItem('amiga-sound-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      settings.value = {
        volume: parsed.volume ?? 70,
        muted: parsed.muted ?? false
      };
    }
  } catch (error) {
    console.error('Error loading sound settings:', error);
  }
};

// Save settings to localStorage
const saveSettings = (): void => {
  try {
    localStorage.setItem('amiga-sound-settings', JSON.stringify(settings.value));
  } catch (error) {
    console.error('Error saving sound settings:', error);
  }
};

// Calculate adjusted volume based on settings
const getAdjustedVolume = (baseVolume: number): number => {
  if (settings.value.muted) return 0;
  return baseVolume * (settings.value.volume / 100);
};

// Initialize settings on first import
loadSettings();

// Watch for settings changes and persist
watch(
  settings,
  () => {
    saveSettings();
  },
  { deep: true }
);

/**
 * Composable for sound effects management
 */
export const useSoundEffects = () => {
  /**
   * Play a sound effect by event type
   */
  const playSound = (eventType: SoundEventType): void => {
    if (settings.value.muted) return;

    const soundFn = soundPresets[eventType];
    if (soundFn) {
      soundFn();
    } else {
      console.warn(`Unknown sound event type: ${eventType}`);
    }
  };

  /**
   * Set master volume (0-100)
   */
  const setVolume = (volume: number): void => {
    settings.value.volume = Math.max(0, Math.min(100, volume));
  };

  /**
   * Toggle mute on/off
   */
  const toggleMute = (): void => {
    settings.value.muted = !settings.value.muted;
  };

  /**
   * Set mute state explicitly
   */
  const setMuted = (muted: boolean): void => {
    settings.value.muted = muted;
  };

  /**
   * Get current volume
   */
  const getVolume = (): number => {
    return settings.value.volume;
  };

  /**
   * Check if muted
   */
  const isMuted = (): boolean => {
    return settings.value.muted;
  };

  /**
   * Play a test sound (for preferences UI)
   */
  const playTestSound = (): void => {
    playSound('click');
  };

  return {
    playSound,
    setVolume,
    toggleMute,
    setMuted,
    getVolume,
    isMuted,
    playTestSound,
    settings // Expose reactive settings for UI binding
  };
};
