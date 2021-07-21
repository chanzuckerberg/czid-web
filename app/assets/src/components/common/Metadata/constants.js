import { WORKFLOWS } from "~/components/utils/workflows";

// metadataFields that should not be available for input for a workflow
export const METADATA_FIELDS_UNAVAILABLE_BY_WORKFLOW = {
  [WORKFLOWS.SHORT_READ_MNGS.value]: new Set(["ct_value"]),
  [WORKFLOWS.CONSENSUS_GENOME.value]: new Set([]),
};

export const FIELDS_THAT_SHOULD_NOT_HAVE_NEGATIVE_INPUT = new Set([
  "ct_value",
  "host_age",
  "sample_unit",
]);
