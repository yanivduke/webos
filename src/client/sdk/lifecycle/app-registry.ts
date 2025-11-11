/**
 * App Registry
 * Tracks all running apps in the WebOS environment
 */

import type { AppManifest } from '../types/app-manifest';
import type { RunningApp, AppState, WebOSSDK } from '../types/sdk-interfaces';

/**
 * App Registry - Singleton service for managing running apps
 */
export class AppRegistry {
  private apps: Map<string, RunningApp> = new Map();
  private instanceCounters: Map<string, number> = new Map();

  /**
   * Register a new app instance
   * @param manifest App manifest
   * @param windowId Optional window ID
   * @returns Unique instance ID
   */
  register(manifest: AppManifest, windowId?: string): string {
    // Generate instance ID
    const counter = this.instanceCounters.get(manifest.id) || 0;
    const instanceId = manifest.runtime.multiInstance
      ? `${manifest.id}:${counter}`
      : manifest.id;

    // Check if non-multi-instance app is already running
    if (!manifest.runtime.multiInstance && this.apps.has(manifest.id)) {
      throw new Error(`App ${manifest.id} is already running and does not support multiple instances`);
    }

    // Update instance counter
    this.instanceCounters.set(manifest.id, counter + 1);

    // Create running app entry
    const runningApp: RunningApp = {
      manifest,
      state: 'running',
      windowId,
      startTime: Date.now(),
      metadata: {}
    };

    this.apps.set(instanceId, runningApp);

    console.log(`[AppRegistry] Registered app: ${instanceId}`);
    return instanceId;
  }

  /**
   * Unregister an app instance
   * @param instanceId Instance ID to unregister
   */
  unregister(instanceId: string): void {
    const app = this.apps.get(instanceId);
    if (!app) {
      console.warn(`[AppRegistry] App ${instanceId} not found for unregistration`);
      return;
    }

    this.apps.delete(instanceId);
    console.log(`[AppRegistry] Unregistered app: ${instanceId}`);
  }

  /**
   * Get a running app by instance ID
   * @param instanceId Instance ID
   * @returns Running app or undefined
   */
  getApp(instanceId: string): RunningApp | undefined {
    return this.apps.get(instanceId);
  }

  /**
   * Get all running apps
   * @returns Array of all running apps
   */
  getAllApps(): RunningApp[] {
    return Array.from(this.apps.values());
  }

  /**
   * Get all instances of a specific app
   * @param appId Base app ID
   * @returns Array of running instances
   */
  getAppInstances(appId: string): RunningApp[] {
    return Array.from(this.apps.entries())
      .filter(([id]) => id === appId || id.startsWith(`${appId}:`))
      .map(([, app]) => app);
  }

  /**
   * Update app state
   * @param instanceId Instance ID
   * @param state New state
   */
  setState(instanceId: string, state: AppState): void {
    const app = this.apps.get(instanceId);
    if (!app) {
      console.warn(`[AppRegistry] App ${instanceId} not found for state update`);
      return;
    }

    app.state = state;
    console.log(`[AppRegistry] App ${instanceId} state updated to: ${state}`);
  }

  /**
   * Set SDK instance for an app
   * @param instanceId Instance ID
   * @param sdk SDK instance
   */
  setSDK(instanceId: string, sdk: WebOSSDK): void {
    const app = this.apps.get(instanceId);
    if (!app) {
      console.warn(`[AppRegistry] App ${instanceId} not found for SDK assignment`);
      return;
    }

    app.sdk = sdk;
  }

  /**
   * Set metadata for an app
   * @param instanceId Instance ID
   * @param metadata Metadata object
   */
  setMetadata(instanceId: string, metadata: Record<string, unknown>): void {
    const app = this.apps.get(instanceId);
    if (!app) {
      console.warn(`[AppRegistry] App ${instanceId} not found for metadata update`);
      return;
    }

    app.metadata = { ...app.metadata, ...metadata };
  }

  /**
   * Check if an app is running
   * @param appId Base app ID
   * @returns True if at least one instance is running
   */
  isRunning(appId: string): boolean {
    return this.getAppInstances(appId).length > 0;
  }

  /**
   * Clear all apps (useful for testing)
   */
  clear(): void {
    this.apps.clear();
    this.instanceCounters.clear();
    console.log('[AppRegistry] Cleared all apps');
  }
}

/**
 * Singleton instance
 */
export const appRegistry = new AppRegistry();
