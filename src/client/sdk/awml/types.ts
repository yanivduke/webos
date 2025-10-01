export interface AwmlConfigEntry {
  name: string;
  value: string;
}

export interface AwmlDescriptor {
  filePath: string;
  modulePath: string;
  entry: string;
  config: Record<string, string>;
  metadata: {
    name: string;
    version?: string;
    author?: string;
    description?: string;
  };
}

export interface AwmlRuntimeHooks {
  onLog?: (message: string) => void;
  onStatus?: (message: string) => void;
}

export interface AwmlExecutionResult {
  descriptor: AwmlDescriptor;
  startedAt: string;
  finishedAt: string;
}
