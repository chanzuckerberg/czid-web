export type BooleanNums = 0 | 1;

export type DateString = string;

export interface DropdownOption {
  text: string;
  value: string | number;
}

export interface ERCCComparisonShape {
  name: string;
  actual: number;
  expected: number;
}

export interface LabelVal {
  label: string;
  value: string;
}

export interface PipelineRun {
  id: number;
  sample_id: number;
  created_at: DateString;
  updated_at: DateString;
  job_status: "CHECKED" | string;
  finalized: number;
  total_reads: number;
  adjusted_remaining_reads: number;
  unmapped_reads: number | null;
  subsample: number;
  pipeline_branch: "master" | string;
  total_ercc_reads: number;
  fraction_subsampled: number;
  pipeline_version: string;
  pipeline_commit: string;
  truncated: null;
  results_finalized: number;
  alignment_config_id: number;
  alert_sent: number;
  dag_vars: string | null;
  assembled: number;
  max_input_fragments: number;
  error_message: string | null;
  known_user_error: null;
  pipeline_execution_strategy: "step_function" | string;
  sfn_execution_arn: string;
  use_taxon_whitelist: boolean;
  wdl_version: string;
  s3_output_prefix: string;
  executed_at: DateString;
  time_to_finalized: number;
  time_to_results_finalized: number;
  qc_percent: number;
  compression_ratio: number;
  deprecated: boolean;
  version: {
    pipeline: string;
    alignment_db: string;
  };
  host_subtracted: string;
}

export interface SummaryStats {
  adjusted_remaining_reads: number;
  compression_ratio: number;
  qc_percent: number;
  percent_remaining: number;
  unmapped_reads: number | null;
  insert_size_mean: number;
  insert_size_standard_deviation: number;
  last_processed_at: DateString;
  reads_after_star: number;
  reads_after_trimmomatic: number;
  reads_after_priceseq: number;
  reads_after_czid_dedup: number;
}

export type SampleId = number;
export type SnapshotShareId = string;
