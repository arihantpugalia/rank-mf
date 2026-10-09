import { create } from 'zustand';
import { ScreenerConfig, ScreenerResults } from './types';

interface ScreenerStore {
  config: ScreenerConfig;
  jobId: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
  results: ScreenerResults | null;
  setConfig: (config: ScreenerConfig) => void;
  startJob: (jobId: string) => void;
  setCompleted: (results: ScreenerResults) => void;
  setFailed: () => void;
  reset: () => void;
}

export const useScreenerStore = create<ScreenerStore>((set) => ({
  config: {
    month_end: true,
    metrics: ['Sharpe', 'Sortino', 'Up Capture', 'Down Capture', 'Rolling Returns'],
    timeframes: ['1y', '3y', '5y'],
  },
  jobId: null,
  status: 'idle',
  results: null,
  setConfig: (config) => set({ config }),
  startJob: (jobId) => set({ jobId, status: 'running' }),
  setCompleted: (results) => set({ results, status: 'completed' }),
  setFailed: () => set({ status: 'failed' }),
  reset: () => set({ jobId: null, status: 'idle', results: null }),
}));
