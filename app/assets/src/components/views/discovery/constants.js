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
};
export const MIN_NUM_BINS = 10;
export const MIN_BIN_WIDTH = {
  totalReads: 1000,
  qc: 10,
  dcr: 0.5,
  meanInsertSize: 50,
};
export const MISSING_INSERT_SIZE_WARNING = `This value is only computed for paired-end sequencing libraries generated from human hosts and samples processed on pipeline version 3.19 and later.`;
