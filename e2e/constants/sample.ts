export const TREE_NODES = ".clickable";

export const NUMBER_INPUT = 'input[type="number"]';

export const PATHOGEN_LINk = 'a[class="linkDefault-34rbs"]';

export const TAXONS = '[class*="taxonName"]';
export const FILTER_RESULT = '[data-testid="filter-tag"]';
export const SEARCH_BAR = '[placeholder="Taxon name"]';
export const SEARCH_RESULT = "[class='result']";
export const SEARCH_RESULT_TITLE = "[class='result'] [class='title']";
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
export const X_CLOSE_ICON = '[data-testid="x-close-icon"]';
export const TOTAL_READ_POPOUP_CONTENT = '[data-testid="column-tooltip"]';

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
const NT_CONTIG_READS = "NT contig reads";
const NR_CONTIG_READS = "NR contig reads";

export const SHORT_READS_THRESHOLDS = [
  { text: "Score", value: "agg_score" },
  { text: "NT Z Score", value: "nt:z_score" },
  { text: "NT rPM", value: "nt:rpm" },
  { text: NT_R_TOTAL_READS, value: "nt:count" },
  { text: NT_CONTIGS, value: VALUE_NT_CONTIGS },
  { text: NT_CONTIG_READS, value: "nt:contig_r" },
  { text: "NT %id", value: VALUE_NT_PERCENT_IDENTITY },
  { text: NT_LENGTH, value: VALUE_NT_LENGTH },
  { text: NT_E, value: VALUE_NT_E },
  { text: "NR Z Score", value: "nr:z_score" },
  { text: "NR rPM", value: "nr:rpm" },
  { text: NR_R_TOTAL_READS, value: "nr:count" },
  { text: NR_CONTIGS, value: VALUE_NR_CONTIGS },
  { text: NR_CONTIG_READS, value: "nr:contig_r" },
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

const ANALYZE_NANOPORE_DATA = "Analyze-Nanopore-Data#sample-report";
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
  bPM: {
    description:
      "bPM:Number of bases within all the reads aligning to a given taxon, including those assembled into contigs that mapped to the taxon, per million bases sequenced. Learn more.",
    url: ANALYZE_NANOPORE_DATA,
  },
  b: {
    description:
      "b:Number of bases within all the reads aligning to a given taxon, including those assembled into contigs that mapped to the taxon. Learn more.",
    url: ANALYZE_NANOPORE_DATA,
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
  "contig b": {
    description:
      "contig b:Number of bases within all the reads that assembled into contigs aligning to a given taxon. Learn more.",
    url: ANALYZE_NANOPORE_DATA,
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
  UNCATEGORIZED,
];
export const FILTERS_DROPDOWN = '[data-testid="dropdown-menu"]';
export const THRESHOLD_OPTION_FILTER = '[class*="thresholdFilterList"] [data-testid="filters"]';
export const THRESHOLD_COMPARISON_OPERATORS = [">=", "<="];
export const THRESHOLD_FILTERS = [
  "Score",
  "NT Z Score",
  "NT rPM",
  "NT r (total reads)",
  "NT contigs",
  NT_CONTIG_READS,
  "NT %id",
  "NT L (alignment length in bp)",
  "NT E value (as a power of 10)",
  "NR Z Score",
  "NR rPM",
  "NR r (total reads)",
  "NR contigs",
  NR_CONTIG_READS,
  "NR %id",
  "NR L (alignment length in bp)",
  "NR E value (as a power of 10)",
];
export const ALL = "All";
export const SPECIFIC_ONLY = "Specific Only";
export const READ_SPECIFICITY_FILTERS = [ALL, SPECIFIC_ONLY];

export const ANNOTATION_FILTERS = ["Hit", "Not a hit", "Inconclusive"];

export const NAME_TYPE_FILTER = '[data-testid="name-type-filter"]';

export const SCIENTIFIC = "Scientific";
export const COMMON = "Common";
export const NAME_TYPES = [
  SCIENTIFIC,
  COMMON,
];

export const NAME_TYPE_FILTER_VALUE = 'span[data-testid="name-type-filter"] + span';

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
const DOWNLOAD_REPORT_TABLE = "download-report-table-csv";
const DOWNLOAD_NON_HOST_READS = "download-non-host-reads-fasta";
const DOWNLOAD_NON_HOST_CONTIGS = "download-non-host-contigs-fasta";
const DOWNLOAD_NON_HOST_CONTIGS_SUMMARY = "download-non-host-contigs-summary-csv";
const DOWNLOAD_UNMAPPED_READS = "download-unmapped-reads-fasta";
const CSV = ".csv";
const FASTA = ".fasta";

export const FILE_DOWNLOAD_TYPES_MNGS = [
  [DOWNLOAD_REPORT_TABLE, CSV],
  [DOWNLOAD_NON_HOST_READS, FASTA],
  [DOWNLOAD_NON_HOST_CONTIGS,FASTA],
  [DOWNLOAD_NON_HOST_CONTIGS_SUMMARY, CSV],
  [DOWNLOAD_UNMAPPED_READS, FASTA],
];

export const FILE_DOWNLOAD_TYPES_AMR = [
  [DOWNLOAD_REPORT_TABLE, CSV],
];

export const URL_DOWLOAD_TYPES = [
  ["View Results Folder", "/results_folder?pipeline_version="],
  ["View Pipeline Visualization", "/pipeline_viz/"],
];

export const FILTER_VALUE = "filter-value";
export const SAMPLE_FILE_NANOPORE = "28A-idseq-mosq.2to4mil_subsample.fq.gz";
export const SAMPLE_FILE_CT = "Ct20K_VarSkip.fastq.gz";
export const SAMPLE_FILE_R1 = "RR004_water_2_S23A_R1_001.fastq";
export const SAMPLE_FILE_R2 = "RR004_water_2_S23A_R2_001.fastq";
export const SAMPLE_FILE_NO_HOST_1 = "wgs_SARS_CoV2_no_host_R1.fastq.gz";
export const SAMPLE_FILE_NO_HOST_2 = "wgs_SARS_CoV2_no_host_R2.fastq.gz";
export const SAMPLE_FILE_1_PAIRED_R1 = "Sample_1_Paired_R1.fastq.gz";
export const SAMPLE_FILE_1_PAIRED_R2 = "Sample_1_Paired_R2.fastq.gz";
export const SAMPLE_FILE_CT20K = "Ct20K.fastq.gz";
export const IDSEQ_MOSQ_2TO4MIL_SUBSAMPLE_10P = "28A-idseq-mosq.2to4mil_subsample_10p.fq.gz";
export const MWGS_SE_SRR7002140_TA_252_DNA_BLAC_VANP_10P = "mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_R1.fastq.gz";
export const HG002_LONG_READS_METAG = "HG002_long_reads_metaG.fastq.gz";
export const MWGS_PE_SRR7002140_TAP_R1 = "mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_R1.fastq.gz";
export const MWGS_PE_SRR7002140_TAP_R2 = "mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_R2.fastq.gz";
export const MWGS_RNA_MOSQUITO_1_AEDES_RNA_10p_R1 = "mWGS_RNA_mosquito-1-aedes-rna_10p_R1.fastq.gz";
export const MWGS_RNA_MOSQUITO_1_AEDES_RNA_10p_R2 = "mWGS_RNA_mosquito-1-aedes-rna_10p_R2.fastq.gz";
export const MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R1 = "mWGS_RNA_human-128-lung-rna_10p_R1.fastq.gz";
export const MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R2 = "mWGS_RNA_human-128-lung-rna_10p_R2.fastq.gz";
export const RR004_WATER_2_S23A_R1 = "RR004_water_2_S23A_R1.fastq";
export const RR004_WATER_2_S23A_R2 = "RR004_water_2_S23A_R2.fastq";
export const SAMPLE1_R1_001 = "Sample1_r1_001.fastq";
export const SAMPLE2_R2_001 = "Sample2_r2_001.fastq";

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