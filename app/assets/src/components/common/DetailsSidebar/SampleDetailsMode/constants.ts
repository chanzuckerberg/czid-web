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
    name: "Analysis Type",
    key: "workflow",
  },
  {
    name: "Sequencing Platform",
    key: "technology",
  },
  {
    name: "Pipeline Version",
    key: "pipelineVersion",
  },
  {
    name: "Host Subtracted",
    key: "hostSubtracted",
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
    name: "Mean Insert Size",
    key: "meanInsertSize",
  },
  {
    name: "Date Processed",
    key: "lastProcessedAt",
  },
];

export const WORKFLOW_INFO_FIELDS = [
  {
    name: "Analysis Type",
    key: "workflow",
  },
  {
    name: "Sequencing Platform",
    key: "technology",
  },
  {
    name: "Wetlab Protocol",
    key: "wetlabProtocol",
  },
  {
    name: "Medaka Model",
    key: "medakaModel",
  },
  {
    name: "Pipeline Version",
    key: "pipelineVersion",
  },
  {
    name: "Host Subtracted",
    key: "hostSubtracted",
  },
  {
    name: "Total Reads",
    key: "totalReads",
  },
  {
    name: "ERCC Reads",
    key: "erccMappedReads",
  },
  {
    name: "Mapped Reads",
    key: "mappedReads",
  },
  {
    name: "Date Processed",
    key: "lastProcessedAt",
  },
];

export const HOST_FILTERING_WIKI =
  "https://github.com/chanzuckerberg/czid-workflows/wiki/CZID-mNGS-Pipeline-Stage-%231:-Host-Filtering-and-QC";
