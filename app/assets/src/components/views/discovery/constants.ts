export const BAR_FILL_COLOR = "#A9BDFC";
export const HOVER_BAR_FILL_COLOR = "#3867FA";
export const BAR_CLICK_FILL_COLOR = "#223F9C";
export const READS_LOST_STACK_COLORS = [
  "#AABDFC",
  "#DF87B0",
  "#88D0CA",
  "#2C8CB5",
  "#E58740",
  "#D43A81",
  "#55C567",
  "#1E968B",
];
export const READS_REMAINING_COLOR = "#693BAC";
export const READS_REMAINING = "Passed Filters";
export const HOST_FILTER_STAGE_NAME = "Host Filtering";
export const HUMAN_READABLE_STEP_NAMES = {
  Star: "Filter host (STAR)",
  Trimmomatic: "Trim adapters",
  Priceseq: "Filter low quality",
  // Cdhitdup required here for backwards compatibility
  Cdhitdup: "Filter duplicates",
  "Idseq Dedup": "Filter duplicates",
  Lzw: "Filter low complexity",
  Bowtie2: "Filter host (Bowtie2)",
  Subsampled: "Subsampling",
  "Gsnap Filter": "Filter human (GSNAP)",
  "Star Downstream": "Filter human (STAR)",
  "Bowtie2 Bowtie2 Human": "Filter human (Bowtie2)",
  "Czid Dedup": "Mark duplicates (Czid Dedup)",
  "Fastp Qc": "Quality control",
  "Bowtie2 Filter": "Filter host (Bowtie2)",
  "Hisat2 Filter": "Filter host (Hisat2)",
  "Bowtie2 Human Filter": "Filter human (Bowtie2)",
  "Hisat2 Human Filter": "Filter human (Hisat2)",
  "Fastp Low Quality Reads": "Filter low quality",
  "Fastp Low Complexity Reads": "Filter low complexity",
  "Fastp Too Short Reads": "Filter length",
};
export const MIN_NUM_BINS = 10;
export const MIN_BIN_WIDTH = {
  totalReads: 1000,
  qc: 10,
  dcr: 0.5,
  meanInsertSize: 50,
};
export const MISSING_INSERT_SIZE_WARNING = `This value is only computed for paired-end sequencing libraries generated from human hosts and samples processed on pipeline version 3.19 and later.`;

export const KEY_DISCOVERY_VIEW_OPTIONS = "DiscoveryViewOptions";

export const KEY_DISCOVERY_SESSION_FILTERS = "filters";

export const ANNOTATION_FILTER_OPTIONS = [
  {
    name: "Hit",
  },
  {
    name: "Not a hit",
  },
  {
    name: "Inconclusive",
  },
];

export const DISPLAY_PLQC = "plqc";

export const TAB_PROJECTS = "projects";

export const TAB_SAMPLES = "samples";

export const TAB_VISUALIZATIONS = "visualizations";

export const CURRENT_TAB_OPTIONS = [
  TAB_PROJECTS,
  TAB_SAMPLES,
  TAB_VISUALIZATIONS,
];
export const SAMPLE_WAS_DELETED = "sampleWasDeleted";

export const MODERN_HOST_FILTERING_SHORT_READ_MNGS_VERSION = 8;
