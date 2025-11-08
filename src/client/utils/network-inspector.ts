/**
 * Network Inspector Utility
 * Intercepts and tracks network requests (fetch, XMLHttpRequest)
 */

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  timestamp: number;
  duration?: number;
  status?: number;
  statusText?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  requestSize?: number;
  responseSize?: number;
  type: 'fetch' | 'xhr';
  error?: string;
}

export interface NetworkStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  totalDuration: number;
  averageDuration: number;
  totalRequestSize: number;
  totalResponseSize: number;
}

class NetworkInspector {
  private requests: NetworkRequest[] = [];
  private maxRequests = 100;
  private subscribers: Array<(request: NetworkRequest) => void> = [];
  private enabled = true;

  constructor() {
    this.interceptFetch();
    this.interceptXHR();
  }

  /**
   * Intercept fetch API
   */
  private interceptFetch() {
    const originalFetch = window.fetch;

    window.fetch = async (_args): Promise<Response> => {
      if (!this.enabled) {
        return originalFetch.apply(_args);
      }

      const [resource, config] = args;
      const url = typeof resource === 'string' ? resource : (resource instanceof URL ? resource.toString() : (resource as Request).url);
      const method = config?.method || 'GET';
      const startTime = Date.now();

      const request: NetworkRequest = {
        id: `fetch-${startTime}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        method,
        timestamp: startTime,
        type: 'fetch',
        requestHeaders: config?.headers as Record<string, string>,
        requestBody: config?.body
      };

      if (config?.body) {
        request.requestSize = this.estimateSize(config.body);
      }

      try {
        const response = await originalFetch.apply(_args);
        const endTime = Date.now();

        // Clone response to read body without consuming it
        const clonedResponse = response.clone();

        request.duration = endTime - startTime;
        request.status = response.status;
        request.statusText = response.statusText;

        // Get response headers
        const headers: Record<string, string> = {};
        response.headers.forEach((value, _key) => {
          headers[key] = value;
        });
        request.responseHeaders = headers;

        // Try to read response body (if JSON)
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const body = await clonedResponse.text();
            request.responseBody = body ? JSON.parse(body) : null;
            request.responseSize = body.length;
          } else {
            const body = await clonedResponse.text();
            request.responseSize = body.length;
          }
        } catch (e) {
          // Could not read body
        }

        this.addRequest(request);

        return response;
      } catch (error: any) {
        const endTime = Date.now();
        request.duration = endTime - startTime;
        request.error = error.message || 'Network error';
        this.addRequest(request);
        throw error;
      }
    };
  }

  /**
   * Intercept XMLHttpRequest
   */
  private interceptXHR() {
    const self = this;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(
      method: string,
      url: string | URL
    ) {
      if (self.enabled) {
        (this as any).__networkInspector = {
          method,
          url: url.toString(),
          startTime: Date.now()
        };
      }
      return originalOpen.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      if (!self.enabled || !(this as any).__networkInspector) {
        return originalSend.apply(this, arguments as any);
      }

      const inspectorData = (this as any).__networkInspector;
      const startTime = inspectorData.startTime;

      const request: NetworkRequest = {
        id: `xhr-${startTime}-${Math.random().toString(36).substr(2, 9)}`,
        url: inspectorData.url,
        method: inspectorData.method,
        timestamp: startTime,
        type: 'xhr',
        requestBody: body
      };

      if (body) {
        request.requestSize = self.estimateSize(body);
      }

      // Track request headers
      const originalSetRequestHeader = this.setRequestHeader;
      const requestHeaders: Record<string, string> = {};
      this.setRequestHeader = function(name: string, value: string) {
        requestHeaders[name] = value;
        return originalSetRequestHeader.apply(this, arguments as any);
      };
      request.requestHeaders = requestHeaders;

      // Listen for response
      this.addEventListener('loadend', () => {
        const endTime = Date.now();
        request.duration = endTime - startTime;
        request.status = this.status;
        request.statusText = this.statusText;

        // Get response headers
        const responseHeaders: Record<string, string> = {};
        const headerString = this.getAllResponseHeaders();
        if (headerString) {
          headerString.split('\r\n').forEach(line => {
            const parts = line.split(': ');
            if (parts.length === 2) {
              responseHeaders[parts[0]] = parts[1];
            }
          });
        }
        request.responseHeaders = responseHeaders;

        // Get response body
        try {
          if (this.responseType === 'json' || !this.responseType) {
            request.responseBody = this.response;
            request.responseSize = self.estimateSize(this.response);
          } else if (this.responseType === 'text') {
            request.responseSize = this.responseText?.length || 0;
          }
        } catch (e) {
          // Could not read response
        }

        if (this.status === 0 || this.status >= 400) {
          request.error = this.statusText || 'Request failed';
        }

        self.addRequest(request);
      });

      return originalSend.apply(this, arguments as any);
    };
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    }
    if (data instanceof Blob) {
      return data.size;
    }
    if (data instanceof FormData) {
      // Rough estimate
      return 1024; // Can't easily calculate FormData size
    }
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }
    if (typeof data === 'object') {
      return new Blob([JSON.stringify(data)]).size;
    }
    return 0;
  }

  /**
   * Add a request to the list
   */
  private addRequest(request: NetworkRequest) {
    this.requests.push(request);

    // Keep only last N requests
    if (this.requests.length > this.maxRequests) {
      this.requests.shift();
    }

    // Notify subscribers
    this.notifySubscribers(request);
  }

  /**
   * Get all requests
   */
  public getRequests(): NetworkRequest[] {
    return [...this.requests];
  }

  /**
   * Get request by ID
   */
  public getRequestById(id: string): NetworkRequest | undefined {
    return this.requests.find(r => r.id === id);
  }

  /**
   * Get filtered requests
   */
  public getFilteredRequests(filter: {
    method?: string;
    status?: number;
    url?: string;
    hasError?: boolean;
  }): NetworkRequest[] {
    let filtered = [...this.requests];

    if (filter.method) {
      filtered = filtered.filter(r => r.method === filter.method);
    }

    if (filter.status !== undefined) {
      filtered = filtered.filter(r => r.status === filter.status);
    }

    if (filter.url) {
      const urlLower = filter.url.toLowerCase();
      filtered = filtered.filter(r => r.url.toLowerCase().includes(urlLower));
    }

    if (filter.hasError !== undefined) {
      filtered = filtered.filter(r => filter.hasError ? !!r.error : !r.error);
    }

    return filtered;
  }

  /**
   * Get network statistics
   */
  public getStats(): NetworkStats {
    const stats: NetworkStats = {
      total: this.requests.length,
      successful: 0,
      failed: 0,
      pending: 0,
      totalDuration: 0,
      averageDuration: 0,
      totalRequestSize: 0,
      totalResponseSize: 0
    };

    this.requests.forEach(req => {
      if (req.status === undefined) {
        stats.pending++;
      } else if (req.status >= 200 && req.status < 400) {
        stats.successful++;
      } else {
        stats.failed++;
      }

      if (req.duration) {
        stats.totalDuration += req.duration;
      }

      if (req.requestSize) {
        stats.totalRequestSize += req.requestSize;
      }

      if (req.responseSize) {
        stats.totalResponseSize += req.responseSize;
      }
    });

    if (stats.total > 0) {
      stats.averageDuration = stats.totalDuration / stats.total;
    }

    return stats;
  }

  /**
   * Clear all requests
   */
  public clearRequests() {
    this.requests = [];
  }

  /**
   * Enable/disable network inspection
   */
  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Check if inspection is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set max requests to keep
   */
  public setMaxRequests(max: number) {
    this.maxRequests = max;
    while (this.requests.length > this.maxRequests) {
      this.requests.shift();
    }
  }

  /**
   * Subscribe to new requests
   */
  public subscribe(callback: (request: NetworkRequest) => void) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(request: NetworkRequest) {
    this.subscribers.forEach(callback => {
      try {
        callback(request);
      } catch (e) {
        // Don't let subscriber errors break network inspection
      }
    });
  }

  /**
   * Export requests to JSON
   */
  public exportToJson(): string {
    const data = {
      exported: new Date().toISOString(),
      count: this.requests.length,
      stats: this.getStats(),
      requests: this.requests
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export requests to HAR format (HTTP Archive)
   */
  public exportToHAR(): string {
    const har = {
      log: {
        version: '1.2',
        creator: {
          name: 'WebOS Network Inspector',
          version: '1.0'
        },
        entries: this.requests.map(req => ({
          startedDateTime: new Date(req.timestamp).toISOString(),
          time: req.duration || 0,
          request: {
            method: req.method,
            url: req.url,
            httpVersion: 'HTTP/1.1',
            headers: Object.entries(req.requestHeaders || {}).map(([name, value]) => ({ name, value })),
            queryString: [],
            postData: req.requestBody ? {
              mimeType: 'application/json',
              text: JSON.stringify(req.requestBody)
            } : undefined,
            headersSize: -1,
            bodySize: req.requestSize || -1
          },
          response: {
            status: req.status || 0,
            statusText: req.statusText || '',
            httpVersion: 'HTTP/1.1',
            headers: Object.entries(req.responseHeaders || {}).map(([name, value]) => ({ name, value })),
            content: {
              size: req.responseSize || -1,
              mimeType: req.responseHeaders?.['content-type'] || 'application/octet-stream'
            },
            redirectURL: '',
            headersSize: -1,
            bodySize: req.responseSize || -1
          },
          cache: {},
          timings: {
            send: 0,
            wait: req.duration || 0,
            receive: 0
          }
        }))
      }
    };
    return JSON.stringify(har, null, 2);
  }
}

// Export singleton instance
export const networkInspector = new NetworkInspector();
