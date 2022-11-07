import { DateString } from "./shared/generic";
export interface PipelineRuns {
  adjustedRemainingReads: number;
  alignmentConfigName: string;
  assembled: number;
  createdAt: string;
  errorMessage: string;
  unownUserError: string;
  pipelineVersion: string;
  totalErccReads: number;
}

export interface WorkflowRun {
  workflow: string;
  status: string;
  wdl_version: string;
  id: number;
  executed_at: DateString;
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

export type WorkflowRuns = WorkflowRun[];

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
  pipeline_runs: PipelineRuns;
  workflow_runs: WorkflowRuns | undefined;
  id: number;
  name: string;
  createdAt: string;
  defaultBackgroundId: number;
  defaultPipelineRunId: number;
  deletable: boolean;
  editable: boolean;
  initialWorkflow: string;
  upload_error: string;
}
