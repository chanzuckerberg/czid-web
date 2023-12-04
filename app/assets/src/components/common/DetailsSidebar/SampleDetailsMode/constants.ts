import { SidebarTabName } from "./types";

export const SIDEBAR_TABS: SidebarTabName[] = [
  "Metadata",
  "Pipelines",
  "Notes",
];

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

// INFO_FIELD Constants - each workflow type uses a subset of these
const ANALYSIS_TYPE = {
  name: "Analysis Type",
  key: "analysisType",
};
const SEQUENCING_PLATFORM = {
  name: "Sequencing Platform",
  key: "technology",
};
const PIPELINE_VERSION = {
  name: "Pipeline Version",
  key: "pipelineVersion",
};
const NCBI_INDEX_DATE = {
  name: "NCBI Index Date",
  key: "ncbiIndexDate",
};
const HOST_SUBTRACTED = { name: "Host Subtracted", key: "hostSubtracted" };
const TOTAL_READS = {
  name: "Total Reads",
  key: "totalReads",
};
const ERCC_READS = {
  name: "ERCC Reads",
  key: "totalErccReads",
};
const PASSED_FILTERS = {
  name: "Passed Filters",
  key: "nonhostReads",
};
const UNMAPPED_READS = {
  name: "Unmapped Reads",
  key: "unmappedReads",
};
const PASSED_QUALITY_CONTROL = {
  name: "Passed Quality Control",
  key: "qcPercent",
};
const COMPRESSION_RATIO = {
  name: "Compression Ratio",
  key: "compressionRatio",
};
const MEAN_INSERT_SIZE = {
  name: "Mean Insert Size",
  key: "meanInsertSize",
};
const DATE_PROCESSED = {
  name: "Date Processed",
  key: "lastProcessedAt",
};
const WETLAB_PROTOCOL = {
  name: "Wetlab Protocol",
  key: "wetlabProtocol",
};
const MEDAKA_MODEL = {
  name: "Medaka Model",
  key: "medakaModel",
};
const MAPPED_READS = {
  name: "Mapped Reads",
  key: "mappedReads",
};
const CARD_DATABASE_VERSION = {
  name: "CARD Database Version",
  key: "cardDatabaseVersion",
};
const WILDCARD_DATABASE_VERSION = {
  name: "Wildcard Database Version",
  key: "wildcardDatabaseVersion",
};
const GUPPY_BASECALLER_VERSION = {
  name: "Guppy Basecaller Version",
  key: "guppyBasecallerVersion",
};

export const SHORT_READ_MNGS_INFO_FIELDS = [
  ANALYSIS_TYPE,
  SEQUENCING_PLATFORM,
  PIPELINE_VERSION,
  NCBI_INDEX_DATE,
  HOST_SUBTRACTED,
  TOTAL_READS,
  ERCC_READS,
  PASSED_FILTERS,
  UNMAPPED_READS,
  PASSED_QUALITY_CONTROL,
  COMPRESSION_RATIO,
  MEAN_INSERT_SIZE,
  DATE_PROCESSED,
];

export const LONG_READ_MNGS_INFO_FIELDS = [
  ANALYSIS_TYPE,
  SEQUENCING_PLATFORM,
  PIPELINE_VERSION,
  GUPPY_BASECALLER_VERSION,
  NCBI_INDEX_DATE,
  HOST_SUBTRACTED,
  TOTAL_READS,
  ERCC_READS,
  PASSED_FILTERS,
  UNMAPPED_READS,
  PASSED_QUALITY_CONTROL,
  DATE_PROCESSED,
];

export const CG_WORKFLOW_INFO_FIELDS = [
  ANALYSIS_TYPE,
  SEQUENCING_PLATFORM,
  WETLAB_PROTOCOL,
  MEDAKA_MODEL,
  PIPELINE_VERSION,
  HOST_SUBTRACTED,
  TOTAL_READS,
  ERCC_READS,
  MAPPED_READS,
  DATE_PROCESSED,
];

export const AMR_WORKFLOW_INFO_FIELDS = [
  ANALYSIS_TYPE,
  SEQUENCING_PLATFORM,
  PIPELINE_VERSION,
  CARD_DATABASE_VERSION,
  WILDCARD_DATABASE_VERSION,
  TOTAL_READS,
  ERCC_READS,
  PASSED_FILTERS,
  PASSED_QUALITY_CONTROL,
  COMPRESSION_RATIO,
  MEAN_INSERT_SIZE,
  DATE_PROCESSED,
];

export const HOST_FILTERING_WIKI =
  "https://github.com/chanzuckerberg/czid-workflows/wiki/CZID-mNGS-Pipeline-Stage-%231:-Host-Filtering-and-QC";
