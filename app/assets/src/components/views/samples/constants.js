import { keys } from "lodash/fp";

export const SAMPLE_TABLE_COLUMNS = {
  total_reads: {
    display_name: "Total reads",
    type: "pipeline_data"
  },
  nonhost_reads: {
    display_name: "Passed filters",
    type: "pipeline_data"
  },
  total_ercc_reads: {
    display_name: "ERCC reads",
    type: "pipeline_data"
  },
  fraction_subsampled: {
    display_name: "Subsampled fraction",
    type: "pipeline_data"
  },
  quality_control: {
    display_name: "Passed QC",
    tooltip: "Passed quality control",
    type: "pipeline_data"
  },
  compression_ratio: {
    display_name: "DCR",
    tooltip: "Duplicate compression ratio",
    type: "pipeline_data"
  },
  pipeline_status: {
    display_name: "Status",
    type: "pipeline_data"
  },
  nucleotide_type: {
    display_name: "Nucleotide type",
    type: "metadata"
  },
  collection_location: {
    display_name: "Collection Location",
    type: "metadata"
  },
  host_genome: {
    display_name: "Host",
    type: "sampleMetadata"
  },
  sample_type: {
    display_name: "Sample type",
    type: "metadata"
  },
  notes: {
    display_name: "Notes",
    type: "sampleMetadata"
  }
};

export const INITIAL_COLUMNS = [
  "total_reads",
  "nonhost_reads",
  "quality_control",
  "compression_ratio",
  "host_genome",
  "collection_location",
  "pipeline_status"
];

export const ALL_COLUMNS = keys(SAMPLE_TABLE_COLUMNS);
