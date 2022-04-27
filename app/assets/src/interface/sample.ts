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
