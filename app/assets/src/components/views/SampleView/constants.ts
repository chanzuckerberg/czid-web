import { WORKFLOWS } from "~/components/utils/workflows";
import { FIELDS_METADATA } from "~utils/tooltip";

export const SPECIES_LEVEL_INDEX = 1;
export const GENUS_LEVEL_INDEX = 2;

export const KEY_SAMPLE_VIEW_OPTIONS = "SampleViewOptions";

export const KEY_SELECTED_OPTIONS_BACKGROUND = "background";
export const KEY_SELECTED_OPTIONS_TAXA = "taxa";
export const KEY_SELECTED_OPTIONS_THRESHOLDS = "thresholdsReads";

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
  workflowRunId: "number",
};

export const CG_VIEW_METRIC_COLUMNS = [
  "referenceNCBIEntry",
  "referenceLength",
  "coverageDepth",
  "coverageBreadth",
].map(key => [
  {
    key,
    ...FIELDS_METADATA[key],
  },
]);

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

export const TABS = {
  CONSENSUS_GENOME: WORKFLOWS.CONSENSUS_GENOME.label,
  SHORT_READ_MNGS: WORKFLOWS.SHORT_READ_MNGS.label,
  AMR_DEPRECATED: "Antimicrobial Resistance (Deprecated)",
  AMR: WORKFLOWS.AMR.label,
  MERGED_NT_NR: "Metagenomics - Simplified",
  LONG_READ_MNGS: WORKFLOWS.LONG_READ_MNGS.label,
};

export const PIPELINE_RUN_TABS = [
  TABS.SHORT_READ_MNGS,
  TABS.LONG_READ_MNGS,
  TABS.AMR_DEPRECATED,
  TABS.MERGED_NT_NR,
];

export const NOTIFICATION_TYPES = {
  consensusGenomeCreated: "consensusGenomeCreated",
  invalidBackground: "invalidBackground",
  discoveryViewFiltersPersisted: "discoveryViewFiltersPersisted",
};

export const NON_BACKGROUND_DEPENDENT_READS_THRESHOLDS = [
  { text: "NT rPM", value: "nt:rpm" },
  { text: "NT r (total reads)", value: "nt:count" },
  { text: "NT contigs", value: "nt:contigs" },
  { text: "NT contig reads", value: "nt:contig_r" },
  { text: "NT %id", value: "nt:percent_identity" },
  { text: "NT L (alignment length in bp)", value: "nt:alignment_length" },
  { text: "NT E value (as a power of 10)", value: "nt:e_value" },
  { text: "NR rPM", value: "nr:rpm" },
  { text: "NR r (total reads)", value: "nr:count" },
  { text: "NR contigs", value: "nr:contigs" },
  { text: "NR contig reads", value: "nr:contig_r" },
  { text: "NR %id", value: "nr:percent_identity" },
  { text: "NR L (alignment length in bp)", value: "nr:alignment_length" },
  { text: "NR E value (as a power of 10)", value: "nr:e_value" },
];

export const READS_THRESHOLDS = [
  { text: "Score", value: "agg_score" },
  { text: "NT Z Score", value: "nt:z_score" },
  { text: "NT rPM", value: "nt:rpm" },
  { text: "NT r (total reads)", value: "nt:count" },
  { text: "NT contigs", value: "nt:contigs" },
  { text: "NT contig reads", value: "nt:contig_r" },
  { text: "NT %id", value: "nt:percent_identity" },
  { text: "NT L (alignment length in bp)", value: "nt:alignment_length" },
  { text: "NT E value (as a power of 10)", value: "nt:e_value" },
  { text: "NR Z Score", value: "nr:z_score" },
  { text: "NR rPM", value: "nr:rpm" },
  { text: "NR r (total reads)", value: "nr:count" },
  { text: "NR contigs", value: "nr:contigs" },
  { text: "NR contig reads", value: "nr:contig_r" },
  { text: "NR %id", value: "nr:percent_identity" },
  { text: "NR L (alignment length in bp)", value: "nr:alignment_length" },
  { text: "NR E value (as a power of 10)", value: "nr:e_value" },
];

export const BASES_THRESHOLDS = [
  { text: "NT bPM", value: "nt:bpm" },
  { text: "NT b (total bases)", value: "nt:base_count" },
  { text: "NT contigs", value: "nt:contigs" },
  { text: "NT contig bases", value: "nt:contig_b" },
  { text: "NT %id", value: "nt:percent_identity" },
  { text: "NT L (alignment length in bp)", value: "nt:alignment_length" },
  { text: "NT E value (as a power of 10)", value: "nt:e_value" },
  { text: "NR bPM", value: "nr:bpm" },
  { text: "NR b (total bases)", value: "nr:base_count" },
  { text: "NR contigs", value: "nr:contigs" },
  { text: "NR contig bases", value: "nr:contig_b" },
  { text: "NR %id", value: "nr:percent_identity" },
  { text: "NR L (alignment length in bp)", value: "nr:alignment_length" },
  { text: "NR E value (as a power of 10)", value: "nr:e_value" },
];

export const THRESHOLDS = {
  [TABS.SHORT_READ_MNGS]: READS_THRESHOLDS,
  [TABS.LONG_READ_MNGS]: BASES_THRESHOLDS,
};

// We intend to eventually support backgrounds for long-read-mngs in future iterations of ONT
export const BACKGROUND_DEPENDENT_READS_THRESHOLDS = READS_THRESHOLDS.filter(
  threshold =>
    !NON_BACKGROUND_DEPENDENT_READS_THRESHOLDS.some(
      nbdThreshold =>
        threshold.text === nbdThreshold.text &&
        threshold.value === nbdThreshold.value,
    ),
);

export const TREE_METRICS = {
  [TABS.SHORT_READ_MNGS]: [
    { text: "Aggregate Score", value: "aggregatescore" },
    { text: "NT r (total reads)", value: "nt_r" },
    { text: "NT rPM", value: "nt_rpm" },
    { text: "NR r (total reads)", value: "nr_r" },
    { text: "NR rPM", value: "nr_rpm" },
  ],
  [TABS.LONG_READ_MNGS]: [
    { text: "NT b (total bases)", value: "nt_b" },
    { text: "NT bPM", value: "nt_bpm" },
    { text: "NR b (total bases)", value: "nr_b" },
    { text: "NR bPM", value: "nr_bpm" },
  ],
};

export const TREE_VIZ_TOOLTIP_METRICS = {
  [TABS.SHORT_READ_MNGS]: {
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
  [TABS.LONG_READ_MNGS]: {
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

const ONT_DOC_LINK =
  "https://docs.google.com/document/d/1ZsZ8ythCMrER7eZKbjZG93O6bNB37pJpsX2lf1sAs_I/edit#bookmark=id.h6dlo72hypko";

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
    link: ONT_DOC_LINK,
  },
  b: {
    tooltip:
      "Number of bases within all the reads aligning to a given taxon, including those assembled into contigs that mapped to the taxon.",
    link: ONT_DOC_LINK,
  },
  contigbases: {
    tooltip:
      "Number of bases within all the reads that assembled into contigs aligning to a given taxon.",
    link: ONT_DOC_LINK,
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
  "contigs",
  "contig_b",
  "percent_identity",
  "alignment_length",
  "e_value",
];

export const TAXON_COUNT_TYPE_METRICS = {
  [WORKFLOWS.SHORT_READ_MNGS.value]: SHORT_READ_TAXON_COUNT_TYPE_METRICS,
  [WORKFLOWS.LONG_READ_MNGS.value]: LONG_READ_TAXON_COUNT_TYPE_METRICS,
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

export const ONT_PIPELINE_RUNNING_STATUS = "Running Pipeline Steps";
