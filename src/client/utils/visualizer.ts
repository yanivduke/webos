/**
 * Audio Visualizer
 * Web Audio API-based audio visualization with Amiga-style graphics
 */

export type VisualizerType = 'spectrum' | 'waveform' | 'circle' | 'bars';

export interface VisualizerOptions {
  type: VisualizerType;
  colorScheme: 'amiga' | 'blue' | 'green' | 'orange' | 'rainbow';
  barCount?: number;
  smoothing?: number;
  fillStyle?: 'solid' | 'gradient';
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  gradient?: string[];
}

class AudioVisualizer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private analyser: AnalyserNode | null = null;
  private animationId: number | null = null;
  private options: VisualizerOptions = {
    type: 'spectrum',
    colorScheme: 'amiga',
    barCount: 64,
    smoothing: 0.8,
    fillStyle: 'solid',
  };

  private colorSchemes: Record<string, ColorScheme> = {
    amiga: {
      primary: '#0055aa',
      secondary: '#ffaa00',
      background: '#a0a0a0',
      gradient: ['#0055aa', '#00aaff', '#ffaa00'],
    },
    blue: {
      primary: '#00aaff',
      secondary: '#0055aa',
      background: '#000000',
      gradient: ['#000055', '#0055aa', '#00aaff'],
    },
    green: {
      primary: '#00ff00',
      secondary: '#00aa00',
      background: '#000000',
      gradient: ['#003300', '#00aa00', '#00ff00'],
    },
    orange: {
      primary: '#ffaa00',
      secondary: '#ff5500',
      background: '#000000',
      gradient: ['#553300', '#ff5500', '#ffaa00'],
    },
    rainbow: {
      primary: '#ff0000',
      secondary: '#00ff00',
      background: '#000000',
      gradient: ['#ff0000', '#ffaa00', '#ffff00', '#00ff00', '#0055aa', '#aa00ff'],
    },
  };

  /**
   * Initialize visualizer with canvas element
   */
  initialize(canvas: HTMLCanvasElement, analyser: AnalyserNode): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analyser = analyser;

    if (this.ctx) {
      // Set default canvas size
      this.resize();
    }
  }

  /**
   * Set visualizer options
   */
  setOptions(options: Partial<VisualizerOptions>): void {
    this.options = { ...this.options, ...options };

    if (this.analyser && options.smoothing !== undefined) {
      this.analyser.smoothingTimeConstant = options.smoothing;
    }
  }

  /**
   * Start visualization
   */
  start(): void {
    if (!this.canvas || !this.ctx || !this.analyser) {
      console.warn('Visualizer not initialized');
      return;
    }

    this.stop(); // Stop any existing animation
    this.animate();
  }

  /**
   * Stop visualization
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Clear canvas
    if (this.ctx && this.canvas) {
      const scheme = this.colorSchemes[this.options.colorScheme];
      this.ctx.fillStyle = scheme.background;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Resize canvas to fit container
   */
  resize(): void {
    if (!this.canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  /**
   * Animation loop
   */
  private animate(): void {
    if (!this.canvas || !this.ctx || !this.analyser) return;

    this.animationId = requestAnimationFrame(() => this.animate());

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    const scheme = this.colorSchemes[this.options.colorScheme];
    this.ctx.fillStyle = scheme.background;
    this.ctx.fillRect(0, 0, width, height);

    // Render based on visualizer type
    switch (this.options.type) {
      case 'spectrum':
        this.renderSpectrum();
        break;
      case 'waveform':
        this.renderWaveform();
        break;
      case 'circle':
        this.renderCircle();
        break;
      case 'bars':
        this.renderBars();
        break;
    }
  }

  /**
   * Render spectrum analyzer (frequency bars)
   */
  private renderSpectrum(): void {
    if (!this.ctx || !this.canvas || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const width = this.canvas.width;
    const height = this.canvas.height;
    const barCount = this.options.barCount || 64;
    const barWidth = width / barCount;
    const scheme = this.colorSchemes[this.options.colorScheme];

    for (let i = 0; i < barCount; i++) {
      // Sample frequency data
      const dataIndex = Math.floor((i / barCount) * bufferLength);
      const value = dataArray[dataIndex];
      const barHeight = (value / 255) * height;

      const x = i * barWidth;
      const y = height - barHeight;

      // Draw bar with Amiga-style bevel
      if (this.options.fillStyle === 'gradient' && scheme.gradient) {
        const gradient = this.ctx.createLinearGradient(0, height, 0, 0);
        scheme.gradient.forEach((color, index) => {
          gradient.addColorStop(index / (scheme.gradient!.length - 1), color);
        });
        this.ctx.fillStyle = gradient;
      } else {
        this.ctx.fillStyle = scheme.primary;
      }

      this.ctx.fillRect(x, y, barWidth - 2, barHeight);

      // Add bevel effect
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(x, y, 1, barHeight);
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(x + barWidth - 3, y, 1, barHeight);
    }
  }

  /**
   * Render waveform
   */
  private renderWaveform(): void {
    if (!this.ctx || !this.canvas || !this.analyser) return;

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    const width = this.canvas.width;
    const height = this.canvas.height;
    const scheme = this.colorSchemes[this.options.colorScheme];

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = scheme.primary;
    this.ctx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();

    // Optional: Fill under waveform
    if (this.options.fillStyle === 'gradient' && scheme.gradient) {
      this.ctx.lineTo(width, height);
      this.ctx.lineTo(0, height);
      this.ctx.closePath();

      const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, scheme.primary);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
  }

  /**
   * Render circular/radial visualizer
   */
  private renderCircle(): void {
    if (!this.ctx || !this.canvas || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    const barCount = this.options.barCount || 64;
    const scheme = this.colorSchemes[this.options.colorScheme];

    // Draw center circle
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
    this.ctx.fillStyle = scheme.secondary;
    this.ctx.fill();

    // Draw bars radiating outward
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * bufferLength);
      const value = dataArray[dataIndex];
      const barLength = (value / 255) * radius;

      const angle = (i / barCount) * 2 * Math.PI;
      const x1 = centerX + Math.cos(angle) * radius * 0.4;
      const y1 = centerY + Math.sin(angle) * radius * 0.4;
      const x2 = centerX + Math.cos(angle) * (radius * 0.4 + barLength);
      const y2 = centerY + Math.sin(angle) * (radius * 0.4 + barLength);

      // Gradient color based on position
      if (this.options.fillStyle === 'gradient' && scheme.gradient) {
        const colorIndex = Math.floor((i / barCount) * scheme.gradient.length);
        this.ctx.strokeStyle = scheme.gradient[colorIndex % scheme.gradient.length];
      } else {
        this.ctx.strokeStyle = scheme.primary;
      }

      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }

  /**
   * Render vertical bars (classic spectrum analyzer style)
   */
  private renderBars(): void {
    if (!this.ctx || !this.canvas || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const width = this.canvas.width;
    const height = this.canvas.height;
    const barCount = this.options.barCount || 32;
    const barWidth = (width / barCount) * 0.8; // 80% width for spacing
    const barSpacing = (width / barCount) * 0.2;
    const scheme = this.colorSchemes[this.options.colorScheme];

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * bufferLength);
      const value = dataArray[dataIndex];
      const barHeight = (value / 255) * height * 0.9;

      const x = i * (barWidth + barSpacing);
      const y = height - barHeight;

      // Draw bar segments (stacked blocks)
      const segmentHeight = 4;
      const segments = Math.floor(barHeight / segmentHeight);

      for (let j = 0; j < segments; j++) {
        const segmentY = height - (j + 1) * segmentHeight;

        // Color based on height (gradient effect)
        if (this.options.fillStyle === 'gradient' && scheme.gradient) {
          const colorIndex = Math.floor((j / segments) * scheme.gradient.length);
          this.ctx.fillStyle = scheme.gradient[colorIndex % scheme.gradient.length];
        } else {
          // Fade from secondary to primary based on height
          const ratio = j / segments;
          this.ctx.fillStyle = ratio > 0.7 ? scheme.primary : scheme.secondary;
        }

        this.ctx.fillRect(x, segmentY, barWidth, segmentHeight - 1);
      }
    }
  }

  /**
   * Get available color schemes
   */
  getColorSchemes(): string[] {
    return Object.keys(this.colorSchemes);
  }

  /**
   * Get available visualizer types
   */
  getVisualizerTypes(): VisualizerType[] {
    return ['spectrum', 'waveform', 'circle', 'bars'];
  }

  /**
   * Capture current frame as image
   */
  captureFrame(): string | null {
    if (!this.canvas) return null;
    return this.canvas.toDataURL('image/png');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.canvas = null;
    this.ctx = null;
    this.analyser = null;
  }
}

// Export singleton instance
export const audioVisualizer = new AudioVisualizer();
