import { ScreenerConfig, JobStatus, ScreenerResults } from './types';

const API_BASE = 'http://localhost:8000';

export async function runScreener(config: ScreenerConfig): Promise<{ job_id: string; message: string }> {
  const response = await fetch(`${API_BASE}/api/screener`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error('Failed to start screener');
  }

  return response.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${API_BASE}/api/status/${jobId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch job status');
  }

  return response.json();
}

export async function getResults(jobId: string): Promise<ScreenerResults> {
  const response = await fetch(`${API_BASE}/api/results/${jobId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch results');
  }

  return response.json();
}

export function getDownloadUrl(jobId: string): string {
  return `${API_BASE}/api/download/${jobId}`;
}
