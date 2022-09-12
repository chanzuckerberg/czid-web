import { WORKFLOWS } from "~/components/utils/workflows";

// metadataFields that should not be available for input for a workflow
export const METADATA_FIELDS_UNAVAILABLE_BY_WORKFLOW = {
  [WORKFLOWS.SHORT_READ_MNGS.value]: ["ct_value"],
  [WORKFLOWS.AMR.value]: ["ct_value"],
  [WORKFLOWS.CONSENSUS_GENOME.value]: [],
};

export const FIELDS_THAT_SHOULD_NOT_HAVE_NEGATIVE_INPUT = new Set([
  "ct_value",
  "host_age",
  "sample_unit",
]);

export const FIELDS_THAT_HAVE_MAX_INPUT = {
  host_age: 90,
};

// See HOST_GENOME_SYNONYMS in MetadataField
export const HOST_GENOME_SYNONYMS = [
  "host_genome",
  "Host Genome",
  "host_organism",
  "Host Organism",
];
