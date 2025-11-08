import html2canvas from 'html2canvas';

export type CaptureMode = 'full-desktop' | 'active-window' | 'area';
export type CaptureFormat = 'png' | 'jpeg' | 'webp';
export type RecordingQuality = 'low' | 'medium' | 'high';

export interface CaptureOptions {
  mode: CaptureMode;
  format: CaptureFormat;
  quality?: number; // 0-1 for jpeg/webp
  countdown?: number; // seconds
}

export interface RecordingOptions {
  quality: RecordingQuality;
  includeAudio: boolean;
  maxDuration: number; // seconds
}

export interface CaptureResult {
  id: string;
  type: 'screenshot' | 'recording';
  dataUrl: string;
  blob: Blob;
  timestamp: Date;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ScreenCaptureHistory {
  captures: CaptureResult[];
  maxItems: number;
}

// Local storage key
const STORAGE_KEY = 'webos_screen_captures';
const MAX_HISTORY_ITEMS = 10;

/**
 * Screen Capture Manager
 */
class ScreenCaptureManager {
  private history: CaptureResult[] = [];
  private activeRecording: MediaRecorder | null = null;
  private recordingStream: MediaStream | null = null;
  private recordingStartTime: number = 0;
  private recordingChunks: Blob[] = [];
  private subscribers: Set<(captures: CaptureResult[]) => void> = new Set();

  constructor() {
    this.loadHistory();
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(options: CaptureOptions): Promise<CaptureResult> {
    // Apply countdown if specified
    if (options.countdown && options.countdown > 0) {
      await this.countdown(options.countdown);
    }

    let element: HTMLElement;

    switch (options.mode) {
      case 'full-desktop':
        element = document.querySelector('.amiga-desktop') as HTMLElement;
        if (!element) {
          throw new Error('Desktop element not found');
        }
        break;
      case 'active-window':
        element = this.getActiveWindow();
        if (!element) {
          throw new Error('No active window found');
        }
        break;
      case 'area':
        element = await this.selectArea();
        break;
      default:
        throw new Error('Invalid capture mode');
    }

    // Capture the element using html2canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#a0a0a0',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true
    });

    // Convert canvas to blob
    const blob = await this.canvasToBlob(canvas, options.format, options.quality);
    const dataUrl = canvas.toDataURL(`image/${options.format}`, options.quality);

    const capture: CaptureResult = {
      id: `capture_${Date.now()}`,
      type: 'screenshot',
      dataUrl,
      blob,
      timestamp: new Date(),
      width: canvas.width,
      height: canvas.height,
      format: options.format,
      size: blob.size
    };

    this.addToHistory(capture);
    return capture;
  }

  /**
   * Start screen recording
   */
  async startRecording(options: RecordingOptions): Promise<void> {
    if (this.activeRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      // Request display media (screen capture)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: this.getFrameRate(options.quality)
        } as any,
        audio: options.includeAudio
      });

      this.recordingStream = stream;
      this.recordingChunks = [];

      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType();
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: this.getBitrate(options.quality)
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(this.recordingChunks, { type: mimeType });
        const dataUrl = await this.blobToDataUrl(blob);

        const capture: CaptureResult = {
          id: `recording_${Date.now()}`,
          type: 'recording',
          dataUrl,
          blob,
          timestamp: new Date(),
          width: 1920,
          height: 1080,
          format: 'webm',
          size: blob.size
        };

        this.addToHistory(capture);
        this.cleanup();
      };

      // Start recording
      recorder.start(1000); // Collect data every second
      this.activeRecording = recorder;
      this.recordingStartTime = Date.now();

      // Auto-stop after max duration
      setTimeout(() => {
        if (this.activeRecording && this.activeRecording.state === 'recording') {
          this.stopRecording();
        }
      }, options.maxDuration * 1000);

    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop screen recording
   */
  async stopRecording(): Promise<void> {
    if (!this.activeRecording) {
      throw new Error('No recording in progress');
    }

    if (this.activeRecording.state === 'recording') {
      this.activeRecording.stop();
    }
  }

  /**
   * Get recording status
   */
  isRecording(): boolean {
    return this.activeRecording !== null && this.activeRecording.state === 'recording';
  }

  /**
   * Get recording duration in seconds
   */
  getRecordingDuration(): number {
    if (!this.recordingStartTime) return 0;
    return Math.floor((Date.now() - this.recordingStartTime) / 1000);
  }

  /**
   * Copy capture to clipboard
   */
  async copyToClipboard(capture: CaptureResult): Promise<void> {
    try {
      if (capture.type === 'screenshot') {
        // Copy image to clipboard
        const item = new ClipboardItem({ [capture.blob.type]: capture.blob });
        await navigator.clipboard.write([item]);
      } else {
        throw new Error('Cannot copy recording to clipboard');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw error;
    }
  }

  /**
   * Save capture to file system
   */
  async saveToFiles(capture: CaptureResult, filename: string): Promise<void> {
    try {
      // Convert blob to base64
      const base64 = await this.blobToBase64(capture.blob);

      // Save via API
      const response = await fetch('/api/files/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          content: base64,
          format: capture.format,
          type: capture.type
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save capture');
      }
    } catch (error) {
      console.error('Failed to save capture:', error);
      throw error;
    }
  }

  /**
   * Download capture
   */
  downloadCapture(capture: CaptureResult, filename: string): void {
    const link = document.createElement('a');
    link.href = capture.dataUrl;
    link.download = filename;
    link.click();
  }

  /**
   * Delete capture from history
   */
  deleteCapture(captureId: string): void {
    const index = this.history.findIndex(c => c.id === captureId);
    if (index !== -1) {
      this.history.splice(index, 1);
      this.saveHistory();
      this.notifySubscribers();
    }
  }

  /**
   * Get capture history
   */
  getHistory(): CaptureResult[] {
    return [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
    this.saveHistory();
    this.notifySubscribers();
  }

  /**
   * Subscribe to history changes
   */
  subscribe(callback: (captures: CaptureResult[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Private methods

  private async countdown(seconds: number): Promise<void> {
    return new Promise((resolve) => {
      let remaining = seconds;
      const interval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  }

  private getActiveWindow(): HTMLElement {
    // Find the topmost window (highest z-index or last in DOM)
    const windows = document.querySelectorAll('.amiga-window');
    return windows[windows.length - 1] as HTMLElement;
  }

  private async selectArea(): Promise<HTMLElement> {
    // For now, just capture the full desktop
    // Area selection would require a custom UI overlay
    const element = document.querySelector('.amiga-desktop') as HTMLElement;
    if (!element) {
      throw new Error('Desktop element not found');
    }
    return element;
  }

  private async canvasToBlob(
    canvas: HTMLCanvasElement,
    format: CaptureFormat,
    quality?: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        `image/${format}`,
        quality
      );
    });
  }

  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    const dataUrl = await this.blobToDataUrl(blob);
    // Remove data URL prefix
    return dataUrl.split(',')[1];
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm';
  }

  private getFrameRate(quality: RecordingQuality): number {
    switch (quality) {
      case 'low': return 15;
      case 'medium': return 30;
      case 'high': return 60;
      default: return 30;
    }
  }

  private getBitrate(quality: RecordingQuality): number {
    switch (quality) {
      case 'low': return 1000000; // 1 Mbps
      case 'medium': return 2500000; // 2.5 Mbps
      case 'high': return 5000000; // 5 Mbps
      default: return 2500000;
    }
  }

  private cleanup(): void {
    if (this.recordingStream) {
      this.recordingStream.getTracks().forEach(track => track.stop());
      this.recordingStream = null;
    }
    this.activeRecording = null;
    this.recordingStartTime = 0;
    this.recordingChunks = [];
  }

  private addToHistory(capture: CaptureResult): void {
    // Add to beginning
    this.history.unshift(capture);

    // Keep only last MAX_HISTORY_ITEMS
    if (this.history.length > MAX_HISTORY_ITEMS) {
      this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
    }

    this.saveHistory();
    this.notifySubscribers();
  }

  private saveHistory(): void {
    try {
      // Save only metadata, not blobs (too large for localStorage)
      const simplified = this.history.map(capture => ({
        id: capture.id,
        type: capture.type,
        dataUrl: capture.dataUrl,
        timestamp: capture.timestamp,
        width: capture.width,
        height: capture.height,
        format: capture.format,
        size: capture.size
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(simplified));
    } catch (error) {
      console.error('Failed to save capture history:', error);
    }
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.history = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          blob: null as any // Blob not stored
        }));
      }
    } catch (error) {
      console.error('Failed to load capture history:', error);
      this.history = [];
    }
  }

  private notifySubscribers(): void {
    const history = this.getHistory();
    this.subscribers.forEach(callback => callback(history));
  }
}

// Export singleton instance
export const screenCapture = new ScreenCaptureManager();
