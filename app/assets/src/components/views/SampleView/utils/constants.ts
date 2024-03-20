import { WorkflowType, WORKFLOW_TABS } from "~/components/utils/workflows";
import { FilterSelections } from "~/interface/sampleView";

export const SPECIES_LEVEL_INDEX = 1;
export const GENUS_LEVEL_INDEX = 2;

export const KEY_SAMPLE_VIEW_OPTIONS = "SampleViewOptions";

export const NONE_BACKGROUND_VALUE = 0;
export const KEY_SELECTED_OPTIONS_BACKGROUND = "background";
export const KEY_SELECTED_OPTIONS_TAXA = "taxa";
export const KEY_SELECTED_OPTIONS_THRESHOLDS = "thresholdsShortReads";

export const NANOPORE_DEFAULT_COLUMN_WIDTH = 80;

export const LOCAL_STORAGE_FIELDS = {
  selectedOptions: { excludePaths: ["background", "taxon"] },
};

export const URL_FIELDS = {
  pipelineVersion: "string",
  selectedOptions: "object",
  tempSelectedOptions: "object",
  view: "string",
  currentTab: "string",
  workflowRunId: "string",
};

export type URL_FIELDS = {
  pipelineVersion: string;
  selectedOptions: object;
  tempSelectedOptions?: object;
  view: string;
  currentTab: string;
  workflowRunId: string | null;
};

export type LOCAL_STORAGE_FIELDS = {
  selectedOptions: Partial<Omit<FilterSelections, "background" | "taxon">>;
};

export const CG_HISTOGRAM_FILL_COLOR = "#A9BDFC";
export const CG_HISTOGRAM_HOVER_FILL_COLOR = "#3867FA";

export const METRIC_DECIMAL_PLACES = {
  agg_score: 0,
  z_score: 1,
  rpm: 1,
  count: 0,
  contigs: 0,
  contig_r: 0,
  percent_identity: 1,
  alignment_length: 1,
  e_value: 1,
};

export const PIPELINE_RUN_TABS = [
  WORKFLOW_TABS.SHORT_READ_MNGS,
  WORKFLOW_TABS.LONG_READ_MNGS,
  WORKFLOW_TABS.AMR_DEPRECATED,
];

export const NOTIFICATION_TYPES = {
  consensusGenomeCreated: "consensusGenomeCreated",
  invalidBackground: "invalidBackground",
  discoveryViewFiltersPersisted: "discoveryViewFiltersPersisted",
  sampleDeleteSuccess: "sampleDeleteSuccess",
  sampleDeleteError: "sampleDeleteError",
  multipleIndexVersions: "multipleIndexVersions",
};

// Text constants
const NT_R_TOTAL_READS = "NT r (total reads)";
const NT_CONTIGS = "NT contigs";
const NT_LENGTH = "NT L (alignment length in bp)";
const NT_E = "NT E value (as a power of 10)";
const NR_R_TOTAL_READS = "NR r (total reads)";
const NR_CONTIGS = "NR contigs";
const NR_LENGTH = "NR L (alignment length in bp)";
const NR_E = "NR E value (as a power of 10)";

// value constants
const VALUE_NT_CONTIGS = "nt:contigs";
const VALUE_NT_PERCENT_IDENTITY = "nt:percent_identity";
const VALUE_NT_LENGTH = "nt:alignment_length";
const VALUE_NT_E = "nt:e_value";
const VALUE_NR_CONTIGS = "nr:contigs";
const VALUE_NR_PERCENT_IDENTITY = "nr:percent_identity";
const VALUE_NR_LENGTH = "nr:alignment_length";
const VALUE_NR_E = "nr:e_value";

export const NON_BACKGROUND_DEPENDENT_SHORT_READS_THRESHOLDS = [
  { text: "NT rPM", value: "nt:rpm" },
  { text: NT_R_TOTAL_READS, value: "nt:count" },
  { text: NT_CONTIGS, value: VALUE_NT_CONTIGS },
  { text: "NT contig reads", value: "nt:contig_r" },
  { text: "NT %id", value: VALUE_NT_PERCENT_IDENTITY },
  { text: NT_LENGTH, value: VALUE_NT_LENGTH },
  { text: NT_E, value: VALUE_NT_E },
  { text: "NR rPM", value: "nr:rpm" },
  { text: NR_R_TOTAL_READS, value: "nr:count" },
  { text: NR_CONTIGS, value: VALUE_NR_CONTIGS },
  { text: "NR contig reads", value: "nr:contig_r" },
  { text: "NR %id", value: VALUE_NR_PERCENT_IDENTITY },
  { text: NR_LENGTH, value: VALUE_NR_LENGTH },
  { text: NR_E, value: VALUE_NR_E },
];

export const SHORT_READS_THRESHOLDS = [
  { text: "Score", value: "agg_score" },
  { text: "NT Z Score", value: "nt:z_score" },
  { text: "NT rPM", value: "nt:rpm" },
  { text: NT_R_TOTAL_READS, value: "nt:count" },
  { text: NT_CONTIGS, value: VALUE_NT_CONTIGS },
  { text: "NT contig reads", value: "nt:contig_r" },
  { text: "NT %id", value: VALUE_NT_PERCENT_IDENTITY },
  { text: NT_LENGTH, value: VALUE_NT_LENGTH },
  { text: NT_E, value: VALUE_NT_E },
  { text: "NR Z Score", value: "nr:z_score" },
  { text: "NR rPM", value: "nr:rpm" },
  { text: NR_R_TOTAL_READS, value: "nr:count" },
  { text: NR_CONTIGS, value: VALUE_NR_CONTIGS },
  { text: "NR contig reads", value: "nr:contig_r" },
  { text: "NR %id", value: VALUE_NR_PERCENT_IDENTITY },
  { text: NR_LENGTH, value: VALUE_NR_LENGTH },
  { text: NR_E, value: VALUE_NR_E },
];

export const LONG_READS_THRESHOLDS = [
  { text: "NT bPM", value: "nt:bpm" },
  { text: "NT b (total bases)", value: "nt:base_count" },
  { text: NT_R_TOTAL_READS, value: "nt:count" },
  { text: NT_CONTIGS, value: VALUE_NT_CONTIGS },
  { text: "NT contig bases", value: "nt:contig_b" },
  { text: "NT %id", value: VALUE_NT_PERCENT_IDENTITY },
  { text: NT_LENGTH, value: VALUE_NT_LENGTH },
  { text: NT_E, value: VALUE_NT_E },
  { text: "NR bPM", value: "nr:bpm" },
  { text: "NR b (total bases)", value: "nr:base_count" },
  { text: NR_R_TOTAL_READS, value: "nr:count" },
  { text: NR_CONTIGS, value: VALUE_NR_CONTIGS },
  { text: "NR contig bases", value: "nr:contig_b" },
  { text: "NR %id", value: VALUE_NR_PERCENT_IDENTITY },
  { text: NR_LENGTH, value: VALUE_NR_LENGTH },
  { text: NR_E, value: VALUE_NR_E },
];

export const THRESHOLDS = {
  [WORKFLOW_TABS.SHORT_READ_MNGS]: SHORT_READS_THRESHOLDS,
  [WORKFLOW_TABS.LONG_READ_MNGS]: LONG_READS_THRESHOLDS,
};

// We intend to eventually support backgrounds for long-read-mngs in future iterations of ONT
export const BACKGROUND_DEPENDENT_READS_THRESHOLDS =
  SHORT_READS_THRESHOLDS.filter(
    threshold =>
      !NON_BACKGROUND_DEPENDENT_SHORT_READS_THRESHOLDS.some(
        nbdThreshold =>
          threshold.text === nbdThreshold.text &&
          threshold.value === nbdThreshold.value,
      ),
  );

export const TREE_METRICS = {
  [WorkflowType.SHORT_READ_MNGS]: [
    { text: "Aggregate Score", value: "aggregatescore" },
    { text: NT_R_TOTAL_READS, value: "nt_r" },
    { text: "NT rPM", value: "nt_rpm" },
    { text: NR_R_TOTAL_READS, value: "nr_r" },
    { text: "NR rPM", value: "nr_rpm" },
  ],
  [WorkflowType.LONG_READ_MNGS]: [
    { text: "NT b (total bases)", value: "nt_b" },
    { text: "NT bPM", value: "nt_bpm" },
    { text: "NR b (total bases)", value: "nr_b" },
    { text: "NR bPM", value: "nr_bpm" },
  ],
};

export const TREE_VIZ_TOOLTIP_METRICS = {
  [WorkflowType.SHORT_READ_MNGS]: {
    aggregatescore: {
      label: "Aggregate Score",
      agg: (arr: number[]) => Math.max(...arr),
    },
    nt_r: {
      label: "NT r",
      agg: (arr: number[]) => arr.reduce((a: number, b: number) => a + b, 0),
    },
    nt_rpm: {
      label: "NT rpm",
      agg: (arr: number[]) => arr.reduce((a: number, b: number) => a + b, 0),
    },
    nr_r: {
      label: "NR r",
      agg: (arr: number[]) => arr.reduce((a: number, b: number) => a + b, 0),
    },
    nr_rpm: {
      label: "NR rpm",
      agg: (arr: number[]) => arr.reduce((a: number, b: number) => a + b, 0),
    },
  },
  [WorkflowType.LONG_READ_MNGS]: {
    nt_b: {
      label: "NT b",
      agg: (arr: number[]) => arr.reduce((a: number, b: number) => a + b, 0),
    },
    nt_bpm: {
      label: "NT bpm",
      agg: (arr: number[]) => arr.reduce((a: number, b: number) => a + b, 0),
    },
    nr_b: {
      label: "NR b",
      agg: (arr: number[]) => arr.reduce((a: number, b: number) => a + b, 0),
    },
    nr_bpm: {
      label: "NR bpm",
      agg: (arr: number[]) => arr.reduce((a: number, b: number) => a + b, 0),
    },
  },
};

export const CATEGORIES = [
  { name: "Archaea" },
  { name: "Bacteria" },
  { name: "Eukaryota" },
  { name: "Viroids" },
  { name: "Viruses", children: ["Phage"] },
  { name: "Uncategorized" },
];

const DOC_BASE_LINK =
  "https://help.czid.org/hc/en-us/articles/360034790574-Single-Sample-Report-Table";
const ONT_HELP_LINK =
  "https://chanzuckerberg.zendesk.com/hc/en-us/articles/13832912199188-Analyze-Nanopore-Data#sample-report";

export const REPORT_TABLE_COLUMNS = {
  NT_aggregatescore: {
    title: "Aggregate score",
    tooltip:
      "Experimental ranking score for prioritizing microbes based on abundance within the sample (rPM) as well as compared to control samples (Z-score).",
    link: DOC_BASE_LINK + "#score",
  },
  zscore: {
    title: "Z-score",
    tooltip:
      "Statistic used for evaluating the prevalence of microbes in the sample as compared to background contaminants.",
    link: DOC_BASE_LINK + "#z-score",
  },
  rpm: {
    tooltip:
      "Number of reads aligning to the taxon in the NCBI NR/NT database, per million reads sequenced.",
    link: DOC_BASE_LINK + "#rpm",
  },
  r: {
    tooltip:
      "Number of reads aligning to the taxon in the NCBI NT/NR database.",
    link: DOC_BASE_LINK + "#reads",
  },
  contigs: {
    tooltip: "Number of assembled contigs aligning to the taxon.",
    link: DOC_BASE_LINK + "#contig",
  },
  contigreads: {
    tooltip: "Total number of reads across all assembled contigs.",
    link: DOC_BASE_LINK + "#contig-r",
  },
  percentidentity: {
    tooltip: "Average percent-identity of alignments to NCBI NT/NR.",
    link: DOC_BASE_LINK + "#identity-match",
  },
  alignmentlength: {
    tooltip:
      "Average length of the local alignment for all contigs and reads assigned to this taxon.",
    link: DOC_BASE_LINK + "#average-length",
  },
  evalue: {
    tooltip: "Average expect value (e-value) of alignments to NCBI NT/NR.",
    link: DOC_BASE_LINK + "#e-value",
  },
  sourceCountType: {
    tooltip: "The DB that the single merged NT/NR value was derived from",
  },
  unavailable: {
    tooltip:
      "Unavailable for prototype. Value would be available when released",
  },
  bpm: {
    tooltip:
      "Number of bases within all the reads aligning to a given taxon, including those assembled into contigs that mapped to the taxon, per million bases sequenced.",
    link: ONT_HELP_LINK,
  },
  b: {
    tooltip:
      "Number of bases within all the reads aligning to a given taxon, including those assembled into contigs that mapped to the taxon.",
    link: ONT_HELP_LINK,
  },
  contigbases: {
    tooltip:
      "Number of bases within all the reads that assembled into contigs aligning to a given taxon.",
    link: ONT_HELP_LINK,
  },
  // ONT-specific reads tooltip
  r_ont: {
    tooltip:
      "Number of reads aligning to a given taxon, including those assembled into contigs that mapped to the taxon.",
    link: ONT_HELP_LINK,
  },
};

export const TAXON_GENERAL_FIELDS = [
  "taxId",
  "taxLevel",
  "genus_tax_id",
  "name",
  "common_name",
  "category",
  "is_phage",
  "species_tax_ids",
];

export const BACKGROUND_FIELDS = ["agg_score", "max_z_score"];

export const SHORT_READ_TAXON_COUNT_TYPE_METRICS = [
  "z_score",
  "rpm",
  "count",
  "contigs",
  "contig_r",
  "percent_identity",
  "alignment_length",
  "e_value",
  "bg_mean",
  "bg_stdev",
  "bg_mean_mass_normalized",
  "bg_stdev_mass_normalized",
];

export const LONG_READ_TAXON_COUNT_TYPE_METRICS = [
  "bpm",
  "base_count",
  "count",
  "contigs",
  "contig_b",
  "percent_identity",
  "alignment_length",
  "e_value",
];

export const TAXON_COUNT_TYPE_METRICS = {
  [WorkflowType.SHORT_READ_MNGS]: SHORT_READ_TAXON_COUNT_TYPE_METRICS,
  [WorkflowType.LONG_READ_MNGS]: LONG_READ_TAXON_COUNT_TYPE_METRICS,
};

export const SARS_COV_2_ACCESSION_ID = "MN908947.3";

// WorkflowRun state names
export const CREATED_STATE = "CREATED";
export const RUNNING_STATE = "RUNNING";
export const SUCCEEDED_STATE = "SUCCEEDED";

// Taxonomy levels
export const TAX_LEVEL_GENUS = "genus";
export const TAX_LEVEL_SPECIES = "species";

// Annotation types
export const ANNOTATION_HIT = "hit";
export const ANNOTATION_NOT_A_HIT = "not_a_hit";
export const ANNOTATION_INCONCLUSIVE = "inconclusive";
export const ANNOTATION_NONE = "none";

// Supported downloads
export const DOWNLOAD_CONTIGS = "download-contigs";
export const DOWNLOAD_READS = "download-reads";

// Discovery Filter keys
export const KEY_TAXON = "taxon";
export const KEY_TAXON_SELECTED = `${KEY_TAXON}Selected`;
export const KEY_TAXON_THRESHOLDS_SELECTED = "taxonThresholdsSelected";
export const KEY_ANNOTATIONS_SELECTED = "annotationsSelected";

export const ONT_PIPELINE_RUNNING_STATUS_MESSAGE = "Running Pipeline Steps";
