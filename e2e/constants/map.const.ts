export const BUTTONS = ".action-2Pccm button";
export const SIDE_HEADERS = ".title-JNudy";
export const SIDE_LABELS = ".rowLabel-3_lq2";
export const SAMPLES_COLUMN = ".listElement-3bAja:visible";
export const OVERALL_AREA = ".statsDt-1b-F6";
export const MENU_ITEM_PUBLIC = "menu-item-public";
export const SEARCH_PUBLIC = "Search Public...";
export const PROJECTS = "Projects";
export const SAMPLES = "Samples";
export const BAR_LABEL = ".barLabel-1JhFz a";
export const DATE_CREATED = ".dateHistogram-2Eix-";
export const DATE_LABEL = ".label-zMCsY";
export const FILTER_TAG = ".labelText-2faxp";
export const CANCEL_ICON = ".closeIcon-yEIIr";
export const METAGENOMICS = "Metagenomics";
export const OVERALL = "Overall";
export const DATE_CREATED_S = "Date created";
export const AVG_READS_PER_SAMPLE = "Avg. reads per sample";
export const AVG_READS_FILTER_PER_SAMPLE =
  "Avg. reads passing filters per sample";
export const VISIBLE = "visible";
export const ACCEPT_ALL_COOKIES = "Accept All Cookies";
export const MENU_ICON = ".menuItem-25eT6";
export const MAP_VIEW = ".overlays";
export const MAP_INFO_ICON = ".infoIcon-3BQyQ";
export const SIDE_LABEL_VALUE = ".statsDd-24NuT";
export const NUMBER_OF_SAMPLE = ".tabCounter-LfG85";
export const CHECK_ALL =
  "div[role='columnheader'] span[class='checkmark-11_FV']";
export const SAMPLE_HEADER_MAP = ".label-33v00";
export const MAP_ADD_ICON = ".plusIcon-1OBta";
export const MAP_HEADERS = ".tabLabel-VhGh0";
export const MAP_CHECKBOX = ".checkmark-11_FV";
export const PLQC = "Plqc";
export const HELP_OUT =
  "text='Help out by adding more location data to your samples.'";
export const HOVER_TEXT = ".boldText-32btR";
export const SIDE_BAR = ".bar-3UrET";
export const SIDE_BAR_HEADER = ".title-3Oy38";
export const MAP_VIEW_STRING = "Map_view";
export const SAMPLE_AMOUNT = ".filteredCount-3bajD";
export const SAMPLE_COUNT = ".statsRow-189e2";
export const HEADER_READS = ".title-1C3ZM";
export const LEARN_MORE = "a[class='linkDefault-34rbs']";
export const BAR_CHARTS = ".bar-0";
export const DATA = {
  Total_read: {
    url: "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#Total-Reads",
    header: "Do my samples have enough total reads?",
    pop_up:
      "Total Reads:The total number of single-end reads uploaded. Each end of the paired-end reads count as one read. Learn more.",
  },
  Quality_read: {
    url: "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#Passed-QC",
    header: "Do my samples have enough quality reads?",
    pop_up:
      "Passed QC:The percentage of reads that came out of PriceSeq, step (3) of the host filtration and QC steps, compared to what went in to Trimmomatic, step (2). Learn more.",
  },
  Duplicate_read: {
    url: "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#DCR-(duplicate-compression-ratio)",
    header: "Are there too many duplicate reads in my library?",
    pop_up:
      "DCR:Duplicate Compression Ratio is the ratio of the total number of sequences present prior to running czid-dedup (duplicate identification) vs the number of unique sequences. Learn more.",
  },
  Insert_length: {
    url: "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#Mean-Insert-Size",
    header: "Do my samples have sufficient insert lengths?",
    pop_up:
      "Mean Insert Size:The average length of the nucleotide sequence that is inserted between the adapters. Learn more.",
  },
};
export const SAMPLE_COUNT_INFO_ICON = ".statsRow-189e2 .infoIcon-pU_hl";
export const SAMPLE_INFORMATION_POPUP = ".tooltip-1Y1xx";
export const READS_POPUP =
  "Reads Lost:Reads filtered during each step of the pipeline. The full length of the bar represents the Total Reads. Passed Filters represent the reads that passed quality control and filtering steps. Learn more.";
export const READ_URL =
  "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#Reads-Lost";
export const TOTAL_READ_INFO_ICON = ".infoIcon-pU_hl";
export const TOTAL_READ_POPOUP_CONTENT = ".tooltip-1Y1xx";
export const BARS = "rect";
export const BAR_POPUP = ".label-3JH6J";
export const LEARN_MORE_TEXT = 'text="Learn more."';
export const PIPELINE_CHART_HEADER =
  "How were my samples processed through the pipeline?";
