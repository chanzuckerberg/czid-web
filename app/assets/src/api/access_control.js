import { postWithCSRF } from "./core";

export const validateSampleIds = sampleIds =>
  postWithCSRF("/samples/validate_access_to_sample_ids", {
    sampleIds: sampleIds,
  });
