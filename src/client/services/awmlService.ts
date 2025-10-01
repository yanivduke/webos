export interface AwmlModuleRecord {
  filePath: string;
  modulePath: string | null;
  entry: string | null;
  metadata: Record<string, unknown>;
  config: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchAwmlModule = async (filePath: string): Promise<AwmlModuleRecord | null> => {
  const response = await fetch(`/api/app-state/awml/modules?path=${encodeURIComponent(filePath)}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to load AWML module config');
  }
  const data = await response.json();
  return data.module ?? null;
};

export const saveAwmlModule = async (payload: {
  filePath: string;
  modulePath?: string;
  entry?: string;
  metadata?: Record<string, unknown>;
  config?: Record<string, string>;
}) => {
  const response = await fetch('/api/app-state/awml/modules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const { error, message } = await response.json().catch(() => ({}));
    throw new Error(error || message || 'Failed to save AWML module config');
  }

  return response.json();
};
