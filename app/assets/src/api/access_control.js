import { postWithCSRF } from "./core";

export const validateSampleIds = sampleIds =>
  postWithCSRF("/samples/validate_sample_ids", {
    sampleIds: sampleIds,
  });
