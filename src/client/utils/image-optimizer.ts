/**
 * Image Optimizer Utility
 *
 * Provides utilities for lazy loading images and optimizing image delivery.
 * Supports responsive loading, WebP conversion, and intersection observer-based lazy loading.
 */

interface ImageOptions {
  src: string;
  alt?: string;
  lazy?: boolean;
  sizes?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface WebPSupportCache {
  supported: boolean | null;
  checking: boolean;
}

class ImageOptimizer {
  private webPSupport: WebPSupportCache = {
    supported: null,
    checking: false,
  };

  private observers: Map<HTMLElement, IntersectionObserver> = new Map();

  constructor() {
    this.checkWebPSupport();
  }

  /**
   * Check if browser supports WebP
   */
  private async checkWebPSupport(): Promise<boolean> {
    if (this.webPSupport.supported !== null) {
      return this.webPSupport.supported;
    }

    if (this.webPSupport.checking) {
      // Wait for ongoing check
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (this.webPSupport.supported !== null) {
            clearInterval(interval);
            resolve(this.webPSupport.supported);
          }
        }, 50);
      });
    }

    this.webPSupport.checking = true;

    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        this.webPSupport.supported = webP.height === 2;
        this.webPSupport.checking = false;
        resolve(this.webPSupport.supported);

        if (import.meta.env.DEV) {
          console.log(
            `🖼️ WebP Support: ${this.webPSupport.supported ? 'Yes' : 'No'}`
          );
        }
      };
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Convert image URL to WebP if supported
   */
  async getOptimizedURL(url: string): Promise<string> {
    const supportsWebP = await this.checkWebPSupport();

    if (!supportsWebP) {
      return url;
    }

    // For static assets, check if a .webp version exists
    // This is a simple implementation - in production, you'd have a build step
    const webpURL = url.replace(/\.(jpg|jpeg|png)$/i, '.webp');

    // Check if WebP version exists (only for local assets)
    if (url.startsWith('/') || url.startsWith('./')) {
      try {
        const response = await fetch(webpURL, { method: 'HEAD' });
        if (response.ok) {
          return webpURL;
        }
      } catch (e) {
        // WebP version doesn't exist, use original
      }
    }

    return url;
  }

  /**
   * Create a lazy-loaded image element
   */
  createLazyImage(options: ImageOptions): HTMLImageElement {
    const img = document.createElement('img');

    img.alt = options.alt || '';
    img.dataset.src = options.src;

    // Set placeholder if provided
    if (options.placeholder) {
      img.src = options.placeholder;
    } else {
      // Use a 1x1 transparent pixel as placeholder
      img.src =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }

    // Add lazy class for styling
    img.classList.add('lazy-image');

    if (options.sizes) {
      img.sizes = options.sizes;
    }

    // Set up intersection observer for lazy loading
    if (options.lazy !== false) {
      this.observeImage(img, options);
    } else {
      this.loadImage(img, options);
    }

    return img;
  }

  /**
   * Observe image for intersection (lazy loading)
   */
  private observeImage(img: HTMLImageElement, options: ImageOptions): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage(img, options);
            observer.disconnect();
            this.observers.delete(img);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image is visible
        threshold: 0.01,
      }
    );

    observer.observe(img);
    this.observers.set(img, observer);
  }

  /**
   * Load the actual image
   */
  private async loadImage(
    img: HTMLImageElement,
    options: ImageOptions
  ): Promise<void> {
    const src = img.dataset.src || options.src;

    if (!src) {
      return;
    }

    try {
      // Get optimized URL (WebP if supported)
      const optimizedSrc = await this.getOptimizedURL(src);

      // Preload image
      const preloadImg = new Image();
      preloadImg.src = optimizedSrc;

      preloadImg.onload = () => {
        img.src = optimizedSrc;
        img.classList.remove('lazy-image');
        img.classList.add('lazy-loaded');
        options.onLoad?.();
      };

      preloadImg.onerror = () => {
        const error = new Error(`Failed to load image: ${optimizedSrc}`);
        options.onError?.(error);

        if (import.meta.env.DEV) {
          console.error(error);
        }
      };
    } catch (error) {
      options.onError?.(error as Error);

      if (import.meta.env.DEV) {
        console.error('Image loading error:', error);
      }
    }
  }

  /**
   * Preload images for faster loading
   */
  preloadImages(urls: string[]): Promise<void[]> {
    return Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
            img.src = url;
          })
      )
    );
  }

  /**
   * Get image size without loading full image
   */
  async getImageDimensions(
    url: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  /**
   * Clean up observers
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }

  /**
   * Get statistics about loaded images
   */
  getImageStats(): {
    total: number;
    totalSize: number;
    cached: number;
    images: Array<{ src: string; size: number; cached: boolean }>;
  } {
    if (!window.performance || !window.performance.getEntriesByType) {
      return { total: 0, totalSize: 0, cached: 0, images: [] };
    }

    const resources = window.performance.getEntriesByType(
      'resource'
    ) as PerformanceResourceTiming[];

    const imageResources = resources.filter((resource) =>
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(resource.name)
    );

    const images = imageResources.map((resource) => ({
      src: resource.name,
      size: resource.transferSize || 0,
      cached: resource.transferSize === 0,
    }));

    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    const cached = images.filter((img) => img.cached).length;

    return {
      total: images.length,
      totalSize,
      cached,
      images,
    };
  }

  /**
   * Log image loading statistics
   */
  logStats(): void {
    if (!import.meta.env.DEV) {
      return;
    }

    const stats = this.getImageStats();

    console.log(
      '%c🖼️ Image Loading Statistics',
      'background: #0055aa; color: white; padding: 4px 8px; font-weight: bold;'
    );

    console.table({
      'Total Images': stats.total,
      'Total Size': `${(stats.totalSize / 1024).toFixed(2)} KB`,
      'Cached Images': stats.cached,
      'Cache Hit Rate': `${((stats.cached / stats.total) * 100).toFixed(1)}%`,
    });

    if (stats.images.length > 0) {
      console.log('Image Details:');
      stats.images.forEach((img) => {
        const fileName = img.src.split('/').pop();
        console.log(
          `  ${fileName}: ${(img.size / 1024).toFixed(2)} KB ${
            img.cached ? '(cached)' : ''
          }`
        );
      });
    }
  }
}

// Export singleton instance
export const imageOptimizer = new ImageOptimizer();

// Global access for debugging
if (import.meta.env.DEV) {
  (window as any).__imageOptimizer = imageOptimizer;
}

/**
 * Vue directive for lazy loading images
 * Usage: <img v-lazy="imageSrc" alt="description">
 */
export const vLazy = {
  mounted(el: HTMLImageElement, binding: { value: string }) {
    if (!(el instanceof HTMLImageElement)) {
      console.warn('v-lazy directive can only be used on img elements');
      return;
    }

    const options: ImageOptions = {
      src: binding.value,
      alt: el.alt,
      lazy: true,
    };

    // Store original src
    el.dataset.src = binding.value;

    // Set placeholder
    el.src =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // Use the image optimizer to lazy load
    imageOptimizer['observeImage'](el, options);
  },

  unmounted(el: HTMLImageElement) {
    // Cleanup observer if it exists
    const observer = imageOptimizer['observers'].get(el);
    if (observer) {
      observer.disconnect();
      imageOptimizer['observers'].delete(el);
    }
  },
};
