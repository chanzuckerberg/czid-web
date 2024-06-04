import { WorkflowType } from "../components/utils/workflows";
import { PipelineRun, SampleId } from "./shared";
import { DateString } from "./shared/generic";

export interface WorkflowRun {
  id: string;
  wdl_version: string;
  executed_at: DateString;
  workflow: WorkflowType;
  status: string;
  input_error: {
    label?: string;
    message: string;
  };
  inputs: {
    accession_id: string;
    accession_name: string;
    card_version: string;
    creation_source: CreationSource;
    ref_fasta: string;
    taxon_id: string;
    taxon_name: string;
    technology: string;
    wetlab_protocol: string;
    wildcard_version: string;
  };
  run_finalized: boolean;
  parsed_cached_results?: {
    quality_metrics?: {
      total_reads: number;
      total_ercc_reads: number;
      adjusted_remaining_reads: number;
      percent_remaining: number;
      qc_percent: number;
      compression_ratio: number;
      insert_size_mean: number;
      insert_size_standard_deviation: number;
    };
  };
}
export interface ThresholdFilterShape {
  metric: string;
  metricDisplay: string;
  operator: ">=" | "<=";
  value: number;
}

export enum SampleStatus {
  COMPLETE_ISSUE = "COMPLETE - ISSUE",
  IN_PROGRESS = "IN PROGRESS",
  INCOMPLETE_ISSUE = "INCOMPLETE - ISSUE",
  LOADING = "Loading", // This is used for analytics, so leaving the casing as is
  PROCESSING_SKIPPED = "PROCESSING SKIPPED",
  SAMPLE_FAILED = "SAMPLE FAILED",
}

export default interface Sample {
  error_message?: string;
  known_user_error?: string;
  pipeline_runs?: ReadonlyArray<PipelineRun> | null;
  workflow_runs?: ReadonlyArray<WorkflowRun> | null;
  id: SampleId;
  name: string;
  created_at: DateString;
  updated_at: DateString;
  default_background_id: number;
  default_pipeline_run_id: string;
  editable: boolean;
  initial_workflow: WorkflowType;
  upload_error: string;
  user_id: number;
  host_genome_id: number;
  project: {
    id: string;
    name: string;
  };
  project_id: number;
  status: SampleStatus;
}

export enum CreationSource {
  COVID = "SARS-CoV-2 Upload",
  WGS = "Viral CG Upload",
  MNGS = "mNGS Report",
}
