export interface ScreenerConfig {
  subset_limit?: number;
  month_end: boolean;
  metrics: string[];
  timeframes: string[];
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: string[];
  created_at: string;
  completed_at?: string;
  error?: string;
}

export interface FundResult {
  rank: number;
  scheme_name: string;
  category: string;
  overall_score: number;
  sharpe_score?: number;
  sortino_score?: number;
  up_cap_score?: number;
  down_cap_score?: number;
  rolling_score?: number;
  fund_age?: number;
  aum?: string;
  expense_ratio?: string;
}

export interface CategorySummary {
  category: string;
  funds_screened: number;
  rankable_funds: number;
  not_rankable: number;
  top_3: string[];
}

export interface ScreenerResults {
  categories: CategorySummary[];
  top_funds: FundResult[];
  all_rankable?: FundResult[];
  generated_at: string;
  filter_summary: string;
}
