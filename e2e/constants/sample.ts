export const TREE_NODES = ".clickable";

export const NUMBER_INPUT = 'input[type="number"]';

export const PATHOGEN_LINk = 'a[class="linkDefault-34rbs"]';

export const TAXONS = '[class*="taxonName"]'
export const FILTER_RESULT = '[data-testid="filter-tag"]';
export const SEARCH_BAR = '[placeholder="Taxon name"]';
export const ALL_COLUMN_HEADERS = [
  "Taxon",
  "Score",
  "Z Score",
  "rPM",
  "r",
  "contig",
  "contig r",
  "%id",
  "L",
  "E value",
];

export const FILTER_HEADERS = '[data-testid="filters"]';

export const SAMPLE_INFO = "Sample Info";
export const HOST_INFO = "Host Info";
export const INFECTION_INFO = "Infection Info";
export const SEQUENCING_INFO = "Sequencing Info";

export const PIPELINE_INFO = "Pipeline Info";
export const READS_REMAINING = "Reads Remaining";
export const BASES_REMAINING = "Bases Remaining";
export const ERCC = "ERCC Spike-In Counts";
export const DOWNLOADS = "Downloads";

export const COLUMNS_LABEL = 'div[data-testid*="column-header"]';
export const FILTER_TAG = '[data-testid="filter-tag"]';
export const CANCEL_ICON =
  '[data-testid="filter-tag"] [data-testid="x-close-icon"]';
export const X_CLOSE_ICON =
  '[data-testid="x-close-icon"]';
export const TOTAL_READ_POPOUP_CONTENT = '[data-testid="column-tooltip"]';
export const COLUMN_HEADER_PROP = {
  Score: {
    description:
      "Score:Experimental ranking score for prioritizing microbes based on abundance within the sample (rPM) as well as compared to control samples (Z-score). Learn more.",
    url: "Single-Sample-Report-Table#score",
  },
  "Z Score": {
    description:
      "Z Score:Statistic used for evaluating the prevalence of microbes in the sample as compared to background contaminants. Learn more.",
    url: "Single-Sample-Report-Table#z-score",
  },
  rPM: {
    description:
      "rPM:Number of reads aligning to the taxon in the NCBI NR/NT database, per million reads sequenced. Learn more.",
    url: "Single-Sample-Report-Table#rpm",
  },

  r: {
    description:
      "r:Number of reads aligning to the taxon in the NCBI NT/NR database. Learn more.",
    url: "Single-Sample-Report-Table#reads",
  },

  contig: {
    description:
      "contig:Number of assembled contigs aligning to the taxon. Learn more.",
    url: "Single-Sample-Report-Table#contig",
  },
  "contig r": {
    description:
      "contig r:Total number of reads across all assembled contigs. Learn more.",
    url: "Single-Sample-Report-Table#contig-r",
  },
  "%id": {
    description:
      "%id:Average percent-identity of alignments to NCBI NT/NR. Learn more.",
    url: "Single-Sample-Report-Table#identity-match",
  },
  L: {
    description:
      "L:Average length of the local alignment for all contigs and reads assigned to this taxon. Learn more.",
    url: "Single-Sample-Report-Table#average-length",
  },

  "E value": {
    description:
      "E value:Average expect value (e-value) of alignments to NCBI NT/NR. Learn more.",
    url: "Single-Sample-Report-Table#e-value",
  },
};
export const LEARN_MORE_LINK = '[data-testid="column-tooltip"] a';
export const KLEBSIELLA = "Klebsiella";
export const KLEBSIELLA_GENUS = "Klebsiella (genus)";
export const ARCHAEA_FILTER = '[data-testid="dropdown-archaea"]';
export const BACTERIA_FILTER = '[data-testid="dropdown-bacteria"]';
export const EUKARYOTA_FILTER = '[data-testid="dropdown-eukaryota"]';
export const VIROIDS_FILTER = '[data-testid="dropdown-viroids"]';
export const VIRUSES_FILTER = '[data-testid="dropdown-viruses"]';
export const VIRUSES_PHAGE_FILTER = '[data-testid="dropdown-viruses---phage"]';
export const UNCATEGORIZED_FILTER = '[data-testid="dropdown-uncategorized"]';
export const CATEGORIES_FILTER = '[data-testid="category-filter"]';
export const ARCHAEA = "Archaea";
export const BACTERIA = "Bacteria";
export const EUKARYOTA = "Eukaryota";
export const VIROIDS = "Viroids";
export const VIRUSES = "Viruses";
export const PHAGE = "Phage";
export const UNCATEGORIZED = "Uncategorized";
export const CATEGORY_NAMES = [
  ARCHAEA,
  BACTERIA,
  EUKARYOTA,
  VIROIDS,
  VIRUSES,
  PHAGE,
  UNCATEGORIZED
];
export const FILTERS_DROPDOWN = '[data-testid="dropdown-menu"]';
export const THRESHOLD_OPTION_FILTER = '[class*="thresholdFilterList"] [data-testid="filters"]'
export const THRESHOLD_COMPARISON_OPERATORS = [">=", "<="]
export const THRESHOLD_FILTERS = [
  "Score",
  "NT Z Score",
  "NT rPM",
  "NT r (total reads)",
  "NT contigs",
  "NT contig reads",
  "NT %id",
  "NT L (alignment length in bp)",
  "NT E value (as a power of 10)",
  "NR Z Score",
  "NR rPM",
  "NR r (total reads)",
  "NR contigs",
  "NR contig reads",
  "NR %id",
  "NR L (alignment length in bp)",
  "NR E value (as a power of 10)",
];
export const ALL = "All"
export const SPECIFIC_ONLY = "Specific Only"
export const READ_SPECIFICITY_FILTERS = [ALL, SPECIFIC_ONLY];

export const ANNOTATION_FILTERS = ["Hit", "Not a hit", "Inconclusive"];

export const NAME_TYPE_FILTER = '[data-testid="name-type-filter"]'

export const SCIENTIFIC = "Scientific";
export const COMMON = "Common";
export const NAME_TYPES = [
  SCIENTIFIC,
  COMMON
];

export const NAME_TYPE_FILTER_VALUE = 'span[data-testid="name-type-filter"] + span'

export const APPLY_BUTTON = '[data-testid="apply"]';
export const APPLY = 'text="Apply"';
export const THRESHOLD_FILTER = '[data-testid="threshold-filters-filter"]';
export const SCORE = "Score";
export const READ_SPECIFICITY = '[data-testid="read-specificity-filter"]';
export const ANNOTATION_TEXT = '[data-testid="annotation-filter"]';

export const OVERFLOW_BUTTON = "overflow-btn";
export const BULK_DELETE_MODAL = "bulk-delete-modal";
export const DELETE_RUN_MENUITEM = "delete-run-menuitem";
export const DELETE_DISABLED_TOOLTIP = "delete-disabled-tooltip";
export const FILE_DOWLOAD_TYPES_MNGS = [
  ["Download Report Table (.csv)", ".csv"],
  // todo: uncomment when data-testid is on staging (smccanny)
  // [Download Report Table with Applied Filters (.csv), ".csv"],
  ["Download Non-Host Reads (.fasta)", ".fasta"],
  ["Download Non-Host Contigs (.fasta)", ".fasta"],
  ["Download Non-Host Contigs Summary (.csv)", ".csv"],
  ["Download Unmapped Reads (.fasta)", ".fasta"],
];
export const FILE_DOWLOAD_TYPES_AMR = [
  ["Download Report Table (.csv)", ".csv"],
  // todo: uncomment when data-testid is on staging (smccanny)
  // [Download Report Table with Applied Filters (.csv), ".csv"],
  ["Download Non-Host Reads (.fasta)", ".fasta"],
  ["Download Non-Host Contigs (.fasta)", ".fasta"],
  ["Download Comprehensive AMR Metrics File (.tsv)", ".tsv"],
  ["Download Intermediate Files (.zip)", ".zip"],
];
export const URL_DOWLOAD_TYPES = [
  ["View Results Folder", "/results_folder?pipeline_version="],
  ["View Pipeline Visualization", "/pipeline_viz/"],
];

export const FILTER_VALUE = "filter-value";
export const SAMPLE_FILE_R1 = "RR004_water_2_S23A_R1_001.fastq";
export const SAMPLE_FILE_R2 = "RR004_water_2_S23A_R2_001.fastq";

export const SAMPLE_NAMES: Record<string, string[]> = {
  STAGING: ["RNAEnr_10e4_viralcopies_RVOPv2_iSeq"],
  LOCAL: [],
  CI: [],
};
export const SAMPLE_IDS: Record<string, number[]> = {
  STAGING: [
    24329, 25307, 25983, 25745, 26022, 25528, 25986, 25987, 25609, 26101, 25747,
    25746,
  ],
  LOCAL: [],
  CI: [],
};
export const TEST_PROJECTS: Record<string, string> = {
  STAGING: "New QA Project",
  LOCAL: "E2E Test Project",
  CI: "E2E Test Project",
};
export const TAXON_IDS: Record<string, number[]> = {
  STAGING: [573, 694003],
  LOCAL: [],
  CI: [],
};
export const PHYLOTREE_IDS: Record<string, number[]> = {
  STAGING: [244],
  LOCAL: [],
  CI: [],
};
