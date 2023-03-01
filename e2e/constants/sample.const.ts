export const VIEWS = ".reportViewSelector-1i1wY a";
export const TREE_NODES = ".clickable";
export const KNOWN_PATHOGEN =
  "div[class='node-overlay node-overlay__573'] div[class='ui red medium label pathogenLabel-10iFi label-c76vR']";

export const PATHOGEN_POPUP = ".pathogenLabelPopup-drI1l";
export const PATHOGEN_POPUP_TEXT =
  "Organism with known human pathogenicity. See the full list of pathogens.";
export const PATHOGEN_LINk = 'a[class="linkDefault-34rbs"]';
export const TREE_VIEW_TITLE = ".title-1oZTJ";
export const SAMPLE_NUMBER = ".sampleName-1zqqT";
export const FILTER_RESULT = ".taxonName-2Ct87";
export const MENU_ITEM_PUBLIC = "menu-item-public";
export const SEARCH_PUBLIC = "Search Public...";
export const METAGENOMICS = "Metagenomics";
export const MENU_ICON = ".menuItem-25eT6";
export const PIPELINE_LABELS_VALUE = ".metadataValue-2cDlV";
export const ILLUMINA = "Illumina";
export const HUMAN = "Human";
export const METAGENOMIC = "Metagenomic";
export const PIPELINE_READS_LABEL = ".narrowMetadataValueContainer-2CnKh";
export const VIEW_PIPELINE_VISUALIZATION = ".metadataValue-2cDlV a";
export const READS_REMAINING_LABELS = ".label--gcey";
export const DOWNLOADS_LABELS = ".downloadLink-14o8v";
export const SIDEBAR_PIPELINE_AMR_SELECTOR =
  ".tabLabels-3dR_d[data-testid='antimicrobial-resistance']";
export const ANTIMICROBIAL_RESISTANCE = "Antimicrobial Resistance";
export const AMR_LABEL_SELECTOR = ".label-9CR8O";
export const ALL_PIPELINE_INFO = [
  "Analysis Type",
  "Sequencing Platform",
  "Pipeline Version",
  "Host Subtracted",
  "Total Reads",
  "ERCC Reads",
  "Passed Filters",
  "Unmapped Reads",
  "Passed Quality Control",
  "Compression Ratio",
  "Mean Insert Size",
  "Date Processed",
];
export const ALL_READS_REMAINING = [
  "Host Filtering Step",
  "Validate Input",
  "Trimmomatic",
  "Price Seq",
  "CZID-dedup",
  "LZW",
  "Bowtie2",
  "Subsample",
  "GSNAP",
];
export const NO_DATA = ".noData-2AfzS";
export const ALL_DOWNLOAD = [
  "Download Non-Host Reads (.fasta)",
  "Download Unmapped Reads (.fasta)",
  "View Results Folder",
  "View Pipeline Visualization",
];

export const DOWNLOAD_HREF = [
  "nonhost_fasta?pipeline_version=7.1",
  "unidentified_fasta?pipeline_version=7.1",
  "results_folder?pipeline_version=7.1",
  "pipeline_viz/7.1",
];
export const SIDE_BAR_HEADER = ".title-3Oy38";
export const METADATA_LABELS = ".label-9CR8O";
export const PIPELINES = '[data-testid="pipelines"]';

export const NUMBER_INPUT = 'input[type="number"]';
export const PIPELINE_LINK = ".pipelineInfo-Yfrsi";
export const PIPELINE_LINK_PATH = "pipeline_viz/7.1?";
export const SAMPLE_HEADER = ".sampleName-1xb-q";
export const SAMPLE_DETAILS = "text='Sample Details'";
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

export const FILTER_HEADERS = ".labelContainer-3Rr0F";
export const META = '[data-testid="metadata"]';
export const NOTES = '[data-testid="notes"]';

export const SAMPLE_INFO = "Sample Info";
export const HOST_INFO = "Host Info";
export const INFECTION_INFO = "Infection Info";
export const SEQUENCING_INFO = "Sequencing Info";

export const PIPELINE_INFO = "Pipeline Info";
export const READS_REMAINING = "Reads Remaining";
export const ERCC = "ERCC Spike-In Counts";
export const DOWNLOADS = "Downloads";

export const EDIT_METADATA = ".editLink-Nhfe2";
export const METADATA_DROP_DOWN = ".field-2_Ouc  .dropdownTrigger-1fB9V";
export const DROP_DOWN = '[role="option"]';
export const DNA = "text='DNA'";
export const RNA = "text='RNA'";
export const COLLECTION_DATE_FIELD = '[placeholder="YYYY-MM"]';
export const WRONG_DATE_FORMAT = [
  "date",
  "111111",
  "111223112",
  "0-=2-22",
  "222342-223-234",
];
export const WRONG_DATE_ERROR_MSG =
  "text='Please input a date in the format YYYY-MM or MM/YYYY. (for human samples)'";

export const RIGHT_DATE_FORMAT = ["2022-12", "10-2022"];
export const HOST_INFO_DROPDOWNS = [
  ["Yes", "No"],
  [
    "Aedes sierrensis",
    "Culex erythrothorax",
    "Anopheles punctipennis",
    "Anopheles freeborni",
    "Culex tarsalis",
    "Culex pipiens",
    "Aedes albopictus",
    "Other",
  ],
  ["White", "Hispanic", "Black", "Asian", "Other"],
  ["Female", "Male"],
  ["Yes", "No"],
];
export const SAMPLE_LANDING = ".link-NGF5S";
export const META_DATA_DROP_DOWN_ = '[data-placement*="start"] [role="option"]';
export const INFECTION_INFO_DROPDOWN = [
  "Definite",
  "No Infection",
  "Suspected",
  "Unknown",
  "Water Control",
];
export const SEQUENCING_INFO_DROP_DOWN = [
  [
    "NEB Ultra II FS DNA",
    "NEB RNA Ultra II",
    "NEB Ultra II Directional RNA",
    "NEB Utra II DNA",
    "Nextera DNA",
    "Other",
  ],
  ["MiSeq", "NextSeq", "HiSeq", "NovaSeq", "Other"],
];

export const COLUMNS_LABEL = ".label-33v00";
export const FILTER_TAG = ".labelText-2faxp";
export const CANCEL_ICON = ".closeIcon-yEIIr";
export const ACCEPT_ALL_COOKIES = "Accept All Cookies";
export const TOTAL_READ_POPOUP_CONTENT = ".tooltip-1Y1xx";
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
      "%id:Average percent-identity of alignments to NCBI NT/NR. Learn more.",
    url: "Single-Sample-Report-Table#average-length",
  },

  "E value": {
    description:
      "E value:Average expect value (e-value) of alignments to NCBI NT/NR. Learn more.",
    url: "Single-Sample-Report-Table#e-value",
  },
};
export const LEARN_MORE_LINK = ".tooltip-1Y1xx .linkDefault-34rbs";
export const KLEBSIELLA = "Klebsiella";
export const KLEBSIELLA_GENUS = "Klebsiella (genus)";
export const ARCHAEA_FILTER = '[data-testid="dropdown-archaea"]';
export const BACTERIA_FILTER = '[data-testid="dropdown-bacteria"]';
export const EUKARYOTA_FILTER = '[data-testid="dropdown-eukaryota"]';
export const VIROIDS_FILTER = '[data-testid="dropdown-viroids"]';
export const VIRUSES_FILTER = '[data-testid="dropdown-viruses"]';
export const UNCATEGORIZED_FILTER = '[data-testid="dropdown-uncategorized"]';
export const CATEGORIES_FILTER = 'text="Categories"';
export const FILTERS_DROPDOWN =
  '[class="menu transition visible menu-3h-2s dropdownMenu-1gUyq"]    [role="option"]';
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
export const READ_SPECIFICITY_FILTERS = ["All", "Specific Only"];
export const ANNOTATION_FILTERS = ["Hit", "Not a hit", "Inconclusive"];

export const APPLY_BUTTON = ".button-PwU7o";
export const APPLY = 'text="Apply"';
export const THRESHOLD_FILTER = 'text="Threshold filters"';
export const SCORE = 'text="Score"';
export const READ_SPECIFICITY = 'text="Read Specificity:"';
export const ANNOTATION_TEXT = 'text="Annotation"';
export const FULL_LIST = 'text="full list"';
export const PATHOGEN_LIST_URL = "/pathogen_list";
