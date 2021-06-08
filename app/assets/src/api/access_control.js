import { postWithCSRF } from "./core";

export const validateSampleIds = ({ sampleIds, workflow }) =>
  postWithCSRF("/samples/validate_sample_ids", {
    sampleIds,
    workflow,
  });

export const validateWorkflowRunIds = ({ workflowRunIds, workflow }) =>
  postWithCSRF("/workflow_runs/validate_workflow_run_ids", {
    workflowRunIds,
    workflow,
  });
