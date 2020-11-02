import { postWithCSRF } from "./core";

export const validateSampleIds = (sampleIds, workflow) =>
  postWithCSRF("/samples/validate_sample_ids", {
    sampleIds: sampleIds,
    workflow,
  });
