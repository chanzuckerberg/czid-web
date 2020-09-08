export const BAR_FILL_COLOR = "#A9BDFC";
export const HOVER_BAR_FILL_COLOR = "#3867FA";
export const BAR_CLICK_FILL_COLOR = "#223F9C";
export const READS_LOST_STACK_COLORS = [
  "#AABDFC",
  "#DF87B0",
  "#88D0CA",
  "#F08080",
  "#FFD700",
  "#2C8CB5",
  "#E58740",
  "#D43A81",
  "#55C567",
  "#1E968B",
];
export const READS_REMAINING_COLOR = "#693BAC";
export const READS_REMAINING = "Reads remaining";
export const HOST_FILTER_STAGE_NAME = "Host Filtering";
export const HUMAN_READABLE_STEP_NAMES = {
  Star: "Filter host (STAR)",
  Trimmomatic: "Trim adapters",
  "Price Seq": "Filter low quality",
  "Cd Hit Dup": "Identify duplicates",
  Lzw: "Filter low complexity",
  "Bowtie2 Bowtie2": "Filter host (Bowtie2)",
  Subsample: "Subsampling",
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
