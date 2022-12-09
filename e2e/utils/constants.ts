export const ENVIRONMENT = {
  DEV: "dev",
};

export const footer: Record<string, string> = {
  Github: "https://github.com/chanzuckerberg/czid-workflows",
  Careers: "https://boards.greenhouse.io/chanzuckerberginitiative/jobs/3293983",
  Resources: "http://help.czid.org",
};
export const HREF = {
  MYDATA: "/my_data",
  PUBLIC: "/public",
  UPLOAD: "/samples/upload",
};
export const API = {
  DIMENSION: "samples/dimensions.json",
  STATS: "samples/stats.json",
  PROJECT: "projects.json?domain=public&limit=50&listAllIds=true&offset=0",
  WORKFLOW:
    "workflow_runs.json?domain=public&listAllIds=true&mode=with_sample_info&limit=50&offset=0&workflow=consensus-genome",
  SAMPLE_LOCATION: "locations/sample_locations.json",
  VISUALIZATION: "visualizations.json",
  SAMPLE_URL:
    "my_data?currentDisplay=table&currentTab=samples&mapSidebarTab=samples&projectId=869&showFilters=true&workflow=amr",
};
export const tag =
  "Chan Zuckerberg ID: The free, cloud-based metagenomics platform for researchers";
export const CZID = "CZ ID";
export const MY_DATA = "My Data";
export const PUBLIC = "Public";
export const UPLOAD = "Upload";
export const INCON_BUTTON = "iconButton";
export const SEARCH_MY_DATA = "Search My Data...";
export const SEARCH_RESULT = "title";
export const PAGE_TITLE = "name-2XtnE";
export const TAXON_FILTER = "taxonFilterLabel-2GIb0";
export const ANNOTATION_FILTER = "filterLabel-1PFBn";
export const METADATA_FILTER = ".filterLabel-2d1-Y";
export const SAMPLE_TYPE_SELECTOR = ".tabLabel-3vqpD";
export const BUTTONS = ".action-2Pccm";
export const VIEW_ICON = ".icon-n-1j6";
export const PLUS_ICON = "plusIcon-1OBta";
export const SIDEBAR_HEADER = "title-3Oy38";
export const EDIT_BUTTON = "editLink-Nhfe2";
export const SIDE_HEADERS = ".title-JNudy";
export const SIDE_LABELS = ".rowLabel-3_lq2";
export const TAB_COUNTER = ".tabCounter-13Gqy";
export const SAMPLE_NUMBER = ".sampleName-1zqqT";
export const SAMPLES_COLUMN = ".listElement-3bAja:visible";
export const COLUMNS_LABEL = ".label-33v00";
export const INFO_ICON = ".statsTrigger-3JRfy";
export const OVERALL_AREA = ".statsDt-1b-F6";
export const SEARCH_PUBLIC = "Search Public...";
export const PROJECT_SELECTOR = "itemRightPane-2dZ6e";
export const PROJECTS = "Projects";
export const SAMPLES = "Samples";
export const VISUALIZATIONS = "Visualizations";
export const TAXON_FILTERS = "Taxon Filters";
export const METADATA_FILTERS = "Metadata Filters";
export const BAR_LABEL = ".barLabel-1JhFz";
export const DATE_CREATED = ".dateHistogram-2Eix-";
export const DATE_LABEL = ".label-zMCsY";
export const CONSENSUS_GENOMES = "Consensus Genomes";
export const FILTER_TAG = ".labelText-2faxp";
export const CANCEL_ICON = ".closeIcon-yEIIr";
export const ANNOTATION = "Annotation";
export const LOCATION = "Location";
export const TIMEFRAME = "Timeframe";
export const VISIBILITY = "Visibility";
export const HOST = "Host";
export const METAGENOMICS = "Metagenomics";
export const ANTIMICROBIAL_RESISTANCE = "Antimicrobial Resistance";
export const DESCRIPTION = "Description";
export const OVERALL = "Overall";
export const DATE_CREATED_S = "Date created";
export const METADATA = "Metadata";
export const AVG_READS_PER_SAMPLE = "Avg. reads per sample";
export const AVG_READS_FILTER_PER_SAMPLE =
  "Avg. reads passing filters per sample";
export const VISIBLE = "visible";
export const COLUMN_DROPDOWN = {
  Metagenomics: [
    "Created On",
    "Host",
    "Location",
    "Passed Filters",
    "Passed QC",
    "Total Reads",
    "DCR",
    "ERCC Reads",
    "Nucleotide Type",
    "Sample Type",
    "Water Control",
    "Notes",
    "Pipeline Version",
    "SubSampled Fraction",
    "Total Runtime",
    "Mean Insert Size",
    "Collection Date",
    "Collection Location v1",
    "Host Sex",
    "Known Organism",
    "Infection Class",
    "Host Age",
    "Host ID",
    "Host Race/Ethnicity",
    "Primary Diagnosis",
    "Antibiotic Administered",
    "Immunocompromised",
    "Detection Method",
    "Comorbidity",
    "Library Prep",
    "Sequencer",
    "RNA/DNA Input (ng)",
    "Host Genus Species",
    "s3_preload_result_path",
    "s3_preload_result_path",
  ],
};

export const SELECT_PROJECT = "Select project";
export const TAXON = "taxon";
export const BUTTON = "button";
export const COMBOBOX = "combobox";
export const KLEBSIELLA = "Klebsiella pneumoniae";
export const ADD_THRESHOLD = "+ ADD THRESHOLD";
export const NUMBERINPUT = 'input[type="number"]';
export const APPLY = "Apply";
export const CHOOSE_TAXON = "Choose Taxon";
export const SAMPLE_NAME_SELECTOR = ".sampleName-1zqqT";
export const SEARCH = "Search";
export const ESCAPE = "Escape";
export const CLOSE_ICON = ".closeIcon-yEIIr";
export const CLOSE_ICON_POLYGON = ".closeIcon-yEIIr > polygon";
export const LAST_MONTH = "Last Month";
export const LAST_THREE_MONTHS = "Last 3 Months";
export const LAST_SIX_MONTHS = "Last 6 Months";
export const LAST_WEEK = "Last Week";
export const PRIVATE = "Private";
export const TEXTBOX = "textbox";
export const OPTION = "option";
export const SAMPLE_TYPE = "Sample Type";
export const MENU_ITEM_PUBLIC = "menu-item-public";
export const ENTER = "Enter";
export const PUBLIC_MENU_ITEM = "menu-item-public";
export const PROJECT_NAME_SELECTOR = ".itemName-1WWBD";
export const PROJECT_COUNT = "project-count";
export const METADATA_COUNT_SELECTOR = ".statsDd-24NuT";
export const RESULT_COUNT_SELECTOR = ".filteredCount-3bajD";
export const ANALYSIS_TYPE = "analysis-type";
export const FIXTURE_DIR = "./fixtures/samples";
export const ACCEPT_ALL_COOKIES = "Accept All Cookies";
export const CONTINUE = "Continue";
export const UPLOAD_METADATA = "Upload Metadata";
export const TEXT_INPUT = 'input[type="text"]';
export const RADIO_INPUT = 'input[type="radio"]';
export const NUMBER_INPUT = 'input[type="number"]';
export const HOST_SEX = "Host Sex";
export const KNOWN_ORGANISM = "Known Organism";
export const INFACTION_CLASS = "Infection Class";
export const HOST_AGE = "Host Age";
export const DETECTION_METHOD = "Detection Method";
export const LIBRARY_PREP = "Library Prep";
export const SEQUENCER = "Sequencer";
export const RNA_DNA = "RNA/DNA Input (ng)";
export const HOST_GENUS_SPECIES = "Host Genus Species";
export const ISOLATE = "Isolate";
export const DISEASES_CONDITIONS = "Diseases and Conditions";
export const CHECKBOX = 'input[type="checkbox"]';
export const START_UPLOAD = "Start Upload";
export const HOST_ORGANISM = "Host Organism";
export const COLLECTION_DATE = "Collection Date";
export const COLLECTION_LOCATION = "Collection Location";
export const COLUMN_SELECTOR = ".listElement-3bAja";
export const GO_TO_PROJECT = "Go to Project";
export const LOADED = "loaded";
export const ACCEPT_UPLOAD_TERMS = ".label-wQ9z8";
