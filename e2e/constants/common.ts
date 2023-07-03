export const CZID = "CZ ID";
export const MY_DATA = "My Data";
export const UPLOAD = "Upload";
export const SEARCH_MY_DATA = "Search My Data...";
export const HREF = {
  MYDATA: "/my_data",
  PUBLIC: "/public",
  UPLOAD: "/samples/upload",
};
export const footer: Record<string, string> = {
  Github: "https://github.com/chanzuckerberg/czid-workflows",
  Careers: "https://boards.greenhouse.io/chanzuckerberginitiative/jobs/3293983",
  Resources: "http://help.czid.org",
};
export const tag =
  "Chan Zuckerberg ID: The free, cloud-based metagenomics platform for researchers";
export const VISUALIZATIONS = "Visualizations";
export const TAXON_FILTERS = "Taxon Filters";
export const BUTTONS = '[data-testid="sample-view-actions"]';
export const VIEW_ICON = 'data-testid="info-icon"';
export const PLUS_ICON = '[data-testid="plus-circle"]';
export const SIDE_HEADERS = '[data-testid*="-sidebar"]';
export const SAMPLES_COLUMN = '[data-testid*="dropdown-"]';
export const COLUMNS_LABEL = '[data-testid*="-column-header"]';
export const OVERALL_AREA = '[ data-testid="overall-content"]';
export const MENU_ITEM_PUBLIC = "menu-item-public";
export const SEARCH_PUBLIC = "Search Public...";
export const PROJECTS = "Projects";
export const SAMPLES = "Samples";
export const METADATA_FILTERS = "Metadata Filters";
export const BAR_LABEL = '[data-testid="date-histogram"]';
export const DATE_CREATED = '[data-testid="date-histogram"]';
export const DATE_LABEL = '[data-testid="date-histogram-first-date"]';
export const CONSENSUS_GENOMES = "Consensus Genomes";
export const FILTER_TAG = '[data-testid="filter-tag"]';
export const CANCEL_ICON = '[data-testid="x-close-icon"]';
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
export const ACCEPT_ALL_COOKIES = "Accept All Cookies";
export const SAMPLE_TYPE = "Sample Type";
export const NUMBER_OF_COLUMN = 2;
export const CHECKED_BOX = '[data-testid="checked"]';
export const EDIT = "Edit";
export const MYDATA = "my_data";
export const FILTERS = '[data-testid="content"] a';
export const HIDDEN = "hidden";
export const ENTER = "Enter";
export const PUBLIC_MENU_ITEM = "menu-item-public";
export const PROJECT_NAME_SELECTOR = '[data-testid="project-name"]';
export const PROJECT_COUNT = "project-count";
export const METADATA_COUNT_SELECTOR = '[data-testid="project-value"]';
export const RESULT_COUNT_SELECTOR = '[data-testid="project-count"]';
export const GO_TO_PROJECT = "Go to Project";
export const LOADED = "loaded";
export const CONTINUE = "Continue";
export const ANALYSIS_TYPE = "analysis-type";
export const COLLECTION_DATE = "Collection Date";
export const COLLECTION_LOCATION = "Collection Location";
export const COLUMN_SELECTOR = '[data-testid="checked"]';
export const UPLOAD_METADATA = "Upload Metadata";
export const HOST_SEX = "Host Sex";
export const KNOWN_ORGANISM = "Known Organism";
export const RNA_DNA = "RNA/DNA Input (ng)";
export const HOST_GENUS_SPECIES = "Host Genus Species";
export const ISOLATE = "Isolate";
export const DISEASES_CONDITIONS = "Diseases and Conditions";
export const CHECKBOX = 'input[type="checkbox"]';
export const START_UPLOAD = "Start Upload";
export const HOST_ORGANISM = "Host Organism";
export const FIXTURE_DIR = "./fixtures/samples";
export const SELECT_PROJECT = '[data-testid="select-project"]';
export const SEARCH = "Search";
export const TEST_PROJECTS: Record<string, string> = {
  DEV: "omar test",
  STAGING: "floo Neptunium",
  PROD: "floo Neptunium",
};
export const WORKFLOWS = {
  MNGS: "mngs",
  WGS: "viral-consensus-genome",
  AMR: "amr",
  SC2: "covid-consensus-genome",
} as const;
