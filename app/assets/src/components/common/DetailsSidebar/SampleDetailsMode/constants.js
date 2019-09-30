export const SAMPLE_ADDITIONAL_INFO = [
  {
    name: "Sample Name",
    key: "name",
  },
  {
    name: "Project",
    key: "project_name",
  },
  {
    name: "Upload Date",
    key: "upload_date",
  },
  {
    name: "Host",
    key: "host_genome_name",
  },
];

export const PIPELINE_INFO_FIELDS = [
  {
    name: "Pipeline Version",
    key: "pipelineVersion",
  },
  {
    name: "Total Reads",
    key: "totalReads",
  },
  {
    name: "ERCC Reads",
    key: "totalErccReads",
  },
  {
    name: "Passed Filters",
    key: "nonhostReads",
  },
  {
    name: "Unmapped Reads",
    key: "unmappedReads",
  },
  {
    name: "Passed Quality Control",
    key: "qcPercent",
  },
  {
    name: "Compression Ratio",
    key: "compressionRatio",
  },
  {
    name: "Date Processed",
    key: "lastProcessedAt",
  },
];

export const PIPELINE_RUN_STEPS = [
  {
    name: "Validate Input",
    key: "validate_input_out",
  },
  {
    name: "Star",
    key: "star_out",
  },
  {
    name: "Trimmomatic",
    key: "trimmomatic_out",
  },
  {
    name: "Priceseq",
    key: "priceseq_out",
  },
  {
    name: "Cdhitdup",
    key: "cdhitdup_out",
  },
  {
    name: "LZW",
    key: "lzw_out",
  },
  {
    name: "Bowtie2",
    key: "bowtie2_out",
  },
  {
    name: "Subsample",
    key: "subsampled_out",
  },
  {
    name: "Gsnap Filter",
    key: "gsnap_filter_out",
  },
];
