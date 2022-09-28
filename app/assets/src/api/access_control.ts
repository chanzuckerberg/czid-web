import { postWithCSRF } from "./core";

export const validateSampleIds = ({ sampleIds, workflow }: $TSFixMe) =>
  postWithCSRF("/samples/validate_sample_ids", {
    sampleIds,
    workflow,
  });

export const validateWorkflowRunIds = ({
  workflowRunIds,
  workflow,
}: $TSFixMe) =>
  postWithCSRF("/workflow_runs/validate_workflow_run_ids", {
    workflowRunIds,
    workflow,
  });
