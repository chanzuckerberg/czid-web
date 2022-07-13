import { CG_QUALITY_CONTROL_LINK, BULK_DOWNLOAD_LINK } from "~/components/utils/documentationLinks";

// Stores information about conditional fields for bulk downloads.
export const CONDITIONAL_FIELDS = [
  // Note: This first field is referenced directly in renderOption, as
  // it needs to display a placeholder component. Be careful when modifying.
  {
    field: "file_format",
    // The download type this conditional field applies to.
    downloadType: "reads_non_host",
    // The field this conditional field depends on.
    dependentFields: ["taxa_with_reads"],
    // The values of the dependent field that trigger the conditional field.
    triggerValues: ["all", undefined],
  },
  {
    field: "background",
    downloadType: "combined_sample_taxon_results",
    dependentFields: ["metric"],
    triggerValues: ["NR.zscore", "NT.zscore"],
  },
  {
    field: "background",
    downloadType: "biom_format",
    dependentFields: ["metric", "filter_by"],
    triggerValues: ["NR.zscore", "NT.zscore"],
  },
];

export const DEFAULT_BACKGROUND_MODEL = 26;

export const BULK_DOWNLOAD_TYPES = {
  SAMPLE_METADATA: "sample_metadata",
  CONSENSUS_GENOME_INTERMEDIATE_OUTPUT_FILES:
    "consensus_genome_intermediate_output_files",
  BIOM_FORMAT_DOWNLOAD_TYPE: "biom_format",

};

export const BULK_DOWNLOAD_DOCUMENTATION_LINKS = {
  [BULK_DOWNLOAD_TYPES.CONSENSUS_GENOME_INTERMEDIATE_OUTPUT_FILES]: CG_QUALITY_CONTROL_LINK,
  [BULK_DOWNLOAD_TYPES.BIOM_FORMAT_DOWNLOAD_TYPE]: BULK_DOWNLOAD_LINK,
};
