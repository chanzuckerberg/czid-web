import { WORKFLOW_VALUES } from "../components/utils/workflows";
import { PipelineRun } from "./shared";
import { DateString } from "./shared/generic";

export interface WorkflowRun {
  id: number;
  wdl_version: string;
  executed_at: DateString;
  workflow: WORKFLOW_VALUES;
  status: string;
  input_error: string;
  inputs?: {
    accession_id: string;
    accession_name: string;
    taxon_id: number;
    taxon_name: string;
    technology: string;
    wetlab_protocol: string;
  };
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

export enum WorkflowValues {
  CONSENSUS_GENOME = "consensus-genome",
  SHORT_READ_MNGS = "short-read-mngs",
}

export interface ThresholdFilterShape {
  metric: string; // $TSFixMe this could be a Metric enum
  metricDisplay: string;
  operator: ">=" | "<=";
  value: number;
}

export default interface Sample {
  error_message: string;
  known_user_error: string;
  pipeline_runs: PipelineRun[];
  workflow_runs: WorkflowRun[] | undefined;
  id: number;
  name: string;
  createdAt: string;
  defaultBackgroundId: number;
  defaultPipelineRunId: number;
  deletable: boolean;
  editable: boolean;
  initial_workflow: string;
  upload_error: string;
}
