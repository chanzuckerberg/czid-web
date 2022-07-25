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

export interface WorkflowRuns {
  workflowsRun: [];
}

export enum WorkflowValues {
  CONSENSUS_GENOME = "consensus-genome",
  SHORT_READ_MNGS = "short-read-mngs"
}

export interface ThresholdFilterShape {
  metric: string; // $TSFixMe this could be a Metric enum
  metricDisplay: string;
  operator: ">=" | "<=";
  value: number;
}

export default interface Sample {
  pipeline_runs: PipelineRuns;
  workflow_runs: WorkflowRuns;
  id: number;
  name: string;
  createdAt: string;
  defaultBackgroundId: number;
  defaultPipelineRunId: number;
  deletable: boolean;
  editable: boolean;
  initialWorkflow: string;
}
