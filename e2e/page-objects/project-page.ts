import { ANTIMICROBIAL_RESISTANCE } from './../constants/common';
import { DOWNLOAD_ICON } from "@e2e/constants/common";
import { expect } from "@playwright/test";
import { DownloadsPage } from "./downloads-page";
import { HeatmapPage } from "./heatmap-page";
import { NextcladePage } from "./nextclade-page";
import { PageObject } from "./page-object";
import { SamplesPage } from "./samples-page";

const LOADING = "[class*='loading']";
const TABLE_GRID = ".ReactVirtualized__Grid__innerScrollContainer";
const POPUPTEXT = "[class*='popupText']";
const CLOSE_ICON = "[class*='closeIcon']";
const SELECT_ALL_SAMPLES = "//*[@type='checkbox'][@value='all']/parent::*";
const SELECTED_SAMPLES_COUNTER = "[class*='counterContainer']";
const SAMPLE_SEARCH = (sampleId: number, projectId: number) =>
  `[project_id="${projectId}"][sample_id="${sampleId}"]`;
const TIMEFRAME_FILTER = "[data-testid='timeframe']";
const TIMEFRAME_OPTIONS =
  "//*[text()='Select Timeframe']/parent::*//*[@role='option']";
const VISIBILITY_FILTER = "[data-testid='visibility']";
const VISIBILITY_OPTIONS =
  "//*[text()='Select Visibility']/parent::*//*[@role='option']";
const SAMPLE_TYPE_FILTER = "[data-testid='sample-type']";
const SAMPLE_TYPE_OPTIONS =
  "//*[text()='Select Sample Type']/parent::*//*[@role='option']";
const SELECT_SAMPLE_TYPE = "//*[text()='Select Sample Type']/parent::*//input";
const HOST_FILTER = "[data-testid='host']";
const HOST_OPTIONS = "//*[text()='Select Host']/parent::*//*[@role='option']";
const SELECT_HOST = "//*[text()='Select Host']/parent::*//input";
const LOCATION_FILTER = "[data-testid='location']";
const SELECT_LOCATION = "[data-testid='select-location'] input";
const LOCATION_OPTIONS =
  "//*[@data-testid='select-location']/parent::*/following-sibling::*/*[@role='option']";
const DISABLED_TOOLTIP = "[class*='disabledTooltip']";
const ANNOTATION_FILTER = "//*[@data-testid='annotation']/ancestor::button";
const TAXON_FILTER = "[data-testid='taxon-filter']";
const CHOOSE_TAXON = "//*[text()='Taxon Filter']/following-sibling::button";
const TOOLTIP_INPUT = "[role='tooltip'] input";
const TOOLTIP_OPTIONS =
  "[role='presentation'] [role='listbox'] [role='option']";
const APPLY_BUTTON = "[data-testid='apply']";
const ARIA_ROWINDEX = "aria-rowindex";
const UPLOAD_HEADER_LINK = "[data-testid='menu-item-upload']";
const PUBLIC_HEADER_LINK = "[data-testid='menu-item-public']";
const SAMPLES_TAB = "button[data-testid='samples']";
const SAMPLES_COUNT_TD_1 =
  "//div[@aria-rowindex='1']//div[@data-testid='sample-counts' and contains(text(), 'Sample')]";
const BACKGROUND_BUTTON =
  "[class*='actions'] div:not([role='listbox']) button[class='noStyleButton']";
const CREATE_BACKGROUND_NAME_INPUT =
  "//*[text()='Create a Background Model']/following-sibling::*//input[@type='text']";
const CREATE_BACKGROUND_DESCRIPTION_INPUT =
  "//*[text()='Create a Background Model']/following-sibling::*//textarea";
const CREATE_BACKGROUND_CORRECTION_DROPDOWN =
  "//*[text()='Create a Background Model']/following-sibling::*//*[@data-testid='filters']";
const CREATE_BACKGROUND_CORRECTION_OPTIONS =
  "[data-testid='dropdown-menu'] [class*='optionText']";
const CREATE_BACKGROUND_CREATE_BUTTON =
  "//*[text()='Create a Background Model']/following-sibling::*//*[text()='Create']";
const CREATE_BACKGROUND_NOTIFICATION =
  "//*[text()='Create a Background Model']/following-sibling::*//*[contains(@class, 'notification')]";
const CREATE_BACKGROUND_CLOSE_ICON =
  "//*[text()='Create a Background Model']/ancestor::*//*[contains(@class, 'closeIcon')]";
const HEATMAP_BUTTON =
  "[class*='actions'] [role='listbox'] [class*='action']:not([data-testid])";
const TAXON_HEATMAP = "[href*='/heatmap']";
const SAMPLE_CHECKBOX_BY_SAMPLE_NAME = (sampleName: string) =>
  `//div[text()='${sampleName}']/ancestor::div[@aria-rowindex]//div[contains(@class, 'checkbox')]`;
const SAMPLE_BY_SAMPLE_NAME = (sampleName: string) =>
  `//div[text()='${sampleName}']/ancestor::div[@aria-rowindex]`;
const DELETE_BUTTON_TESTID = "bulk-delete-trigger";
const DISMISS_BUTTON = "//*[translate(text(), 'D','d') = 'dismiss']";
const USER_DROPDOWN = "[class*='userDropdown']";
const USER_DROPDOWN_DOWNLOADS_LINK = "//a[text()='Downloads']";
const DOWNLOADS_LINK = "[class*='message'] [href='/bulk_downloads']";
const NEXTCLADE_TREE_BUTTON =
  "[class*='action'] > div:not([data-testid]) button svg";
const NEXTCLADE_OPTIONS = "[class*='treeTypeContainer'] [class*='name']";
const NEXTCLADE_TAGLINE =
  "[class*='modal'] [class*='nextcladeHeader'] [class*='tagline']";
const UPLOAD_A_TREE_INPUT =
  "[class*='treeTypeContainer'] input[accept='.json']";
const VIEW_QC_IN_NEXTCLADE = "//button[text()='View QC in Nextclade']";
const NEXTCLADE_CONFIRM_BUTTON = "//button[text()='Confirm']";
const DOWNLOAD_BUTTON_TESTID = "download-icon";
const DOWNLOAD_TYPES_LOCATOR =
  "[class*='downloadTypeContainer'] [class*='name']";
const DOWNLOAD_TYPES_TAGLINE =
  "[class*='modal'] [class*='header'] [class*='tagline']";
export const START_GENERATING_DOWNLOAD_BUTTON =
  "//button[text()='Start Generating Download']";
const TAXON_FILTER_DROPDOWN =
  "[class*='taxaWithHitsDropdown'] [data-testid='filters']";
const TAXON_DROPDOWN_OPTIONS =
  "[class*='portalDropdown'] [class*='item'] [class*='option']";
const FILTER_DROPDOWN =
  "[class*='downloadTypeContainer'] [data-testid='filter-value']";
const FILTER_DROPDOWN_OPTIONS =
  "[class*='portalDropdown'] [data-testid='dropdown-menu'] [role='option']";
const BACKGROUND_FILTER_DROPDOWN =
  "//div[contains(@class, 'downloadType')]//div[text()='Background' and contains(@class, 'label')]/following-sibling::div[contains(@class, 'dropdown')]";
const BACKGROUND_SEARCH_INPUT =
  "[class*='portalDropdown'] [data-testid='filter-search-bar'] input";
const BACKGROUND_SEARCH_RESULTS = "[class*=' option'] [class*='optionText']";
const BACKGROUND_FILTER_LABEL =
  "//div[contains(@class, 'downloadType')]//div[text()='Background' and contains(@class, 'label')]";
const SEARCH_MY_DATA_INPUT =
  "[class*='header'] [class*='category'][class*='search'] input";
const SEARCH_RESULTS = "[class='results'] [class='title']";
const HOST_SEARCH_RESULTS = "[category='host'] [class='title']";
const METAGENOMICS_TAB = "[data-testid='metagenomics']";
const CONSENSUS_GENOME_TAB = "[data-testid='consensus-genomes']";
const NANOPORE_TAB = "[data-testid='metagenomics---nanopore']";
const ANTIMICROBIAL_TAB = "[data-testid='antimicrobial-resistance']";
const PROJECT_SEARCH_RESULTS = "[category='Project'] [class='title']";

const INCLUDE_SAMPLE_METADATA =
  "//span[text()='Include sample metadata in this table']/preceding-sibling::input";

const SAMPLE_TABS_NAME = "Samples";
const ANTIMICROBIAL_RESISTANCE_TAB_NAME = ANTIMICROBIAL_RESISTANCE;

const SAMPLE_METEDATA = "Sample Metadata";
export const SAMPLE_OVERVIEW = "Samples Overview";
const SAMPLE_TAXON_REPORTS = "Sample Taxon Reports";
const COMBINED_SAMPLE_TAXON_RESULTS = "Combined Sample Taxon Results";
const ORIGINAL_INPUT_FILES = "Original Input Files";
const CONTIG_SUMMARY_REPORTS = "Contig Summary Reports";
const UNMAPPED_READS = "Unmapped Reads";
const COMBINED_MICROBIOME_FILE = "Combined Microbiome File";
const READS_NON_HOST = "Reads (Non-host)";
const CONTIGS_NON_HOST = "Contigs (Non-host)";

const VISUALIZATIONS_TAB = "[data-testid='visualizations']";
const VISUALIZATION_NAME_AND_STATUS = "[class*='vizNameAndStatus']";
const UPDATED_ON_COLUMN_HEADER = "[data-testid='updated-on-column-header']";

export const DOWNLOAD_TYPES = {
  mngs: [
    SAMPLE_METEDATA,
    SAMPLE_OVERVIEW,
    SAMPLE_TAXON_REPORTS,
    COMBINED_SAMPLE_TAXON_RESULTS,
    ORIGINAL_INPUT_FILES,
    CONTIG_SUMMARY_REPORTS,
    UNMAPPED_READS,
    "Host Gene Counts",
    COMBINED_MICROBIOME_FILE,
    READS_NON_HOST,
    CONTIGS_NON_HOST,
  ],
  ONT: [
    SAMPLE_METEDATA,
    SAMPLE_OVERVIEW,
    SAMPLE_TAXON_REPORTS,
    COMBINED_SAMPLE_TAXON_RESULTS,
    ORIGINAL_INPUT_FILES,
    CONTIG_SUMMARY_REPORTS,
    UNMAPPED_READS,
    READS_NON_HOST,
    CONTIGS_NON_HOST,
  ],
  amr: [
    SAMPLE_METEDATA,
    "Contigs",
    "Antimicrobial Resistance Results",
    "Combined AMR Results",
  ],
  "viral-consensus-genome": [
    SAMPLE_METEDATA,
    "Consensus Genome",
    "Consensus Genome Overview",
    "Consensus Genome Overview: Include sample metadata",
    "Intermediate Output Files",
  ],
};
const ROW_CHECKBOXES =
  "[data-testid='row-select-checkbox'] input[type='checkbox']";
const COMPLETED_ROWS =
  "//div[contains(@class, 'sampleStatus') and @data-testid='complete']//ancestor::div[@aria-rowindex]";
const ROWS =
  "//div[contains(@class, 'sampleStatus')]//ancestor::div[@aria-rowindex]";
const SAMPLE_NAME_BY_INDEX = (index: number) =>
  `//div[contains(@class, "sampleStatus")]//ancestor::div[@aria-rowindex="${index}"]//div[contains(@class, "sampleName-")]`;
const SAMPLE_NAMES = "[class*='sampleName-']";
const DELETE_CONFIRMATION_BUTTON = "//button[text()='Delete']";
const DELETE_CANCEL_BUTTON =
  "//*[@data-testid='bulk-delete-modal']//button[text()='Cancel']";
const DELETE_MODAL_TITLE =
  "[data-testid='bulk-delete-modal'] [class*='MuiDialog-container'] [class*='MuiDialogTitle']";
const ERROR_MESSAGE = "[class*='errorMessage']";
const ALERT_MESSAGE = "[role='alert'][class*='toast-body']";
const NOTIFICATION_MESSAGE = "[class*='notificationContainer']";
const WORKFLOW_PARAM = {
  ONT: "long-read-mngs",
  mngs: "short-read-mngs",
  "viral-consensus-genome": "consensus-genome",
  "covid-consensus-genome": "consensus-genome",
  amr: "amr",
};
export const RUN_TYPES = {
  ONT: "Nanopore",
  mngs: "Metagenomic",
  "viral-consensus-genome": "Consensus Genome",
  amr: "Antimicrobial Resistance",
};

const PLQC_READS_LOST_BARS = "//*[@data-testid='read-lost-bar']//*[contains(@class, 'barPiece') and not(@width='1')]";
const PLQC_MEAN_INSERT_SIZE_BARS = "//*[@data-testid='mean-insert-size-histogram']//*[contains(@class, 'bar')]//*[not(@height='0')]";
const PLQC_DUPLICATE_COMPRESSION_BARS = "[data-testid='duplicate-compression-histogram'] g[class*='bar']";
const PLQC_PASSED_QC_BARS = "[data-testid='passed-qc-histogram'] g[class*='bar']";
const PLQC_HOVER_TOOLTIP = "[data-testid='hover-tooltip'] [class*='dataRow'] div";
const PLQC_VIEW = "[data-testid='plqc-view']";
const PLQC_TOTAL_READ_HISTOGRAM_BARS = "[data-testid='total-read-histogram'] g[class*='bar']";
const COLUMN_PLUS_BUTTON = "[data-testid='plus-circle']";
const PLUS_OPTIONS =
  "[data-testid='plus-circle'] [role='option'] [data-testid*='dropdown']";
const CHECKED_PLUS_OPTION = (option: string) =>
  `//div[text()='${option}']/ancestor::div[@role='option']//div[@data-testid='checked']`;

export class ProjectPage extends PageObject {
  // #region Navigate
  public async navigateToMyData() {
    await this.page.goto(`${process.env.BASEURL}/my_data`);
  }

  public async navigateToSamples(
    projectId: number,
    workflow = "",
    domain = "public",
  ) {
    await this.pause(1);
    const workflowParam =
      workflow === "" ? workflow : `&workflow=${WORKFLOW_PARAM[workflow]}`;
    const url = `${process.env.BASEURL}/${domain}?projectId=${projectId}&currentTab=samples${workflowParam}`;
    await this.page.goto(url);

    // Wait for table to render with no more loading shimmers.
    await this.page.waitForSelector(
      TABLE_GRID,
    );
    await this.pause(2);
    await expect(this.page.locator(LOADING)).toHaveCount(0, {
      timeout: 30_000,
    });
  }
  // #endregion Navigate

  // #region Api
  public async getWorkflowRuns(projectId: number, workflow: string) {
    const response = await this.page
      .context()
      .request.get(`${process.env.BASEURL}/workflow_runs.json?projectId=${projectId}&mode=with_sample_info&workflow=${workflow}`);
    const responseJson = await response.json();
    return responseJson.workflow_runs;
  }

  public async getBackgrounds() {
    const response = await this.page
      .context()
      .request.get(`${process.env.BASEURL}/backgrounds.json`);
    const responseJson = await response.json();
    return responseJson.backgrounds;
  }

  public getProjectNameForUser(projectName: string) : string {
    const userName = process.env.CZID_USERNAME.split("@")[0];
    // Replace + in userName with - as automatically done by CZ ID for project names
    // Users sometimes use email+1@domain as a way to create unique usernames
    const sanitizedUserName = userName.replace("+", "-");
    return `${sanitizedUserName}_${projectName}`;
  }

  public async getOrCreateProject(projectName: string, publicAccess = 1) {
    let project = null;
    const userProjectName = this.getProjectNameForUser(projectName);
    const projects = await this.getProjects(userProjectName);
    project = await projects.filter(p => p.name === userProjectName)[0];
    if (project === null || project === undefined) {
      const payload = {
        project: {
          name: userProjectName,
          public_access: publicAccess, // Public
          description: "created by automation",
        },
      };
      await this.page
        .context()
        .request.post(`${process.env.BASEURL}/projects.json`, {
          data: payload,
        });
      project = await this.waitForProject(userProjectName);
      await this.pause(1);
      await this.page.reload();
    }
    return project;
  }

  public async waitForProject(projectName: string) {
    const startTime = Date.now();
    const timeout = 30000;
    while (Date.now() - startTime < timeout) {
      const projects = await this.getProjects(projectName);
      const filteredProjects = await projects.filter(
        p => p.name === projectName,
      );
      if (filteredProjects.length > 0) {
        return filteredProjects[0];
      }
      await this.pause(1);
    }
  }

  public async getProjects(searchTerm: string) {
    const response = await this.page
      .context()
      .request.get(`${process.env.BASEURL}/projects.json?search=${searchTerm}`);
    const responseJson = await response.json();
    return responseJson.projects;
  }

  public async getProjectByName(projectName: string) {
    const projects = await this.getProjects(projectName);
    // matches ${username}_automation_e2e_${workflow}
    return projects.length >= 1
      ? projects.filter(p => p.name === projectName)[0]
      : null;
  }

  public async getPublicProjects() {
    const response = await this.page
      .context()
      .request.get(`${process.env.BASEURL}/projects.json?domain=public`);
    const responseJson = await response.json();
    return responseJson.projects;
  }

  public async getLocationsExternalSearch(query: string) {
    const urlParams = new URLSearchParams();
    urlParams.append("query", query);

    const params =
      Array.from(urlParams.entries()).length > 0
        ? `?${urlParams.toString()}`
        : "";
    const requestUrl = `${process.env.BASEURL}/locations/external_search${params}`;
    const response = await this.page.context().request.get(requestUrl);
    return response.json();
  }

  public async getSearchSuggestions(
    query: string,
    categories = null,
    superkingdom = null,
    domain = null,
  ) {
    const urlParams = new URLSearchParams();
    if (categories !== null) {
      urlParams.append("categories[]", categories);
    }
    if (query !== null) {
      urlParams.append("query", query);
    }
    if (domain !== null) {
      urlParams.append("domain", domain);
    }
    if (superkingdom !== null) {
      urlParams.append("superkingdom", superkingdom);
    }

    const params =
      Array.from(urlParams.entries()).length > 0
        ? `?${urlParams.toString()}`
        : "";
    const requestUrl = `${process.env.BASEURL}/search_suggestions${params}`;
    const response = await this.page.context().request.get(requestUrl);
    return response.json();
  }
  // #endregion Api

  // #region bool
  public async isNextcladeTreeButtonDisabled() {
    return this.page.locator(NEXTCLADE_TREE_BUTTON).isDisabled();
  }

  public async isDownloadButtonDisabled() {
    return this.page.getByTestId(DOWNLOAD_ICON).isDisabled();
  }

  public async isDeleteButtonDisabled() {
    return this.page.getByTestId(DELETE_BUTTON_TESTID).isDisabled();
  }

  public async isAnnotationFilterDisabled() {
    return this.page.locator(ANNOTATION_FILTER).isDisabled();
  }
  // #endregion bool

  // #region hover
  public async hoverOverPLQCMeanInsertSizeBars(index = 0) {
    await this.page.locator(PLQC_MEAN_INSERT_SIZE_BARS).nth(index).waitFor();
    await this.page.locator(PLQC_MEAN_INSERT_SIZE_BARS).nth(index).hover();
  }

  public async hoverOverPLQCDuplicateCompressionBars(index = 0) {
    await this.page.locator(PLQC_DUPLICATE_COMPRESSION_BARS).nth(index).hover();
  }

  public async hoverOverPLQCPassedQCBars(index = 0) {
    await this.page.locator(PLQC_PASSED_QC_BARS).nth(index).hover();
  }

  public async hoverOverPLQCTotalReadHistogramBar(index = 0) {
    await this.page.locator(PLQC_TOTAL_READ_HISTOGRAM_BARS).nth(index).hover();
  }

  public async hoverOverAnnotationFilter() {
    await this.page.locator(ANNOTATION_FILTER).hover({ force: true });
  }
  // #endregion hover

  // #region fill
  public async fillBackgroundDescriptionInput(value: string) {
    await this.page.locator(CREATE_BACKGROUND_DESCRIPTION_INPUT).fill(value)
  }

  public async fillBackgroundNameInput(value: string) {
    await this.page.locator(CREATE_BACKGROUND_NAME_INPUT).fill(value)
  }

  public async fillTimeframeFilter(value: string) {
    await this.pause(1);
    await this.page.locator(TIMEFRAME_FILTER).click();

    await this.pause(1);
    await this.page
      .locator(TIMEFRAME_OPTIONS)
      .getByText(value, { exact: true })
      .click();
  }

  public async fillVisibilityFilter(value: string) {
    await this.pause(1);
    await this.page.locator(VISIBILITY_FILTER).click();
    await this.page
      .locator(VISIBILITY_OPTIONS)
      .getByText(value, { exact: true })
      .click();
  }

  public async fillSampleTypeFilter(values: Array<string>) {
    await this.pause(1);
    await this.page.locator(SAMPLE_TYPE_FILTER).click();
    for (const value of values) {
      await this.page.locator(SELECT_SAMPLE_TYPE).fill(value);
      await this.page
        .locator(SAMPLE_TYPE_OPTIONS)
        .getByText(value, { exact: true })
        .click();
    }
    await this.page.locator(SAMPLE_TYPE_FILTER).click();
  }

  public async fillHostFilter(values: Array<string>) {
    await this.pause(1);
    await this.page.locator(HOST_FILTER).waitFor();
    await this.page.locator(HOST_FILTER).click();
    for (const value of values) {
      await this.page.locator(SELECT_HOST).fill(value);
      await this.page
        .locator(HOST_OPTIONS)
        .getByText(value, { exact: true })
        .click();
    }
    await this.page.locator(HOST_FILTER).click();
  }

  public async fillLocationFilter(values: Array<string>) {
    await this.pause(1);
    await this.page.locator(LOCATION_FILTER).click();
    for (const value of values) {
      await this.page.locator(SELECT_LOCATION).fill(value);
      await this.page
        .locator(LOCATION_OPTIONS)
        .getByText(value, { exact: true })
        .click();
    }
    await this.page.locator(LOCATION_FILTER).click();
  }

  public async fillTaxonFilter(values: Array<string>) {
    await this.pause(1);
    await this.page.locator(TAXON_FILTER).click();
    await this.page.locator(CHOOSE_TAXON).click();

    for (const value of values) {
      await this.page.locator(TOOLTIP_INPUT).fill(value);
      await this.page.locator(TOOLTIP_OPTIONS).first().waitFor();
      await this.page
        .locator(TOOLTIP_OPTIONS)
        .getByText(value, { exact: true })
        .click();
    }

    await this.page.locator(CHOOSE_TAXON).click();
  }

  public async searchMyDataInputForSample(project: any, sample: any) {
    await this.page.locator(SEARCH_MY_DATA_INPUT).fill(sample.name);
    const resultLocator = SAMPLE_SEARCH(sample.id, project.id);
    await this.page.locator(resultLocator).click();
  }

  public async waitForTableLoad(timeout = 90_000) {
    // Wait for loading to complete
    await this.page.waitForSelector(
      TABLE_GRID,
    );
    await this.pause(2);
    await expect(this.page.locator(LOADING)).toHaveCount(0, {
      timeout: timeout,
    });
  }

  public async fillSearchMyDataInput(
    value: string,
    options?: { clickResult: boolean },
  ) {
    await this.page.locator(SEARCH_MY_DATA_INPUT).fill(value);
    await this.page.locator(SEARCH_RESULTS).first().waitFor();

    await this.pressEnter();

    if (options && options.clickResult === true) {
      await this.page
        .locator(SEARCH_RESULTS)
        .getByText(value, { exact: true })
        .first()
        .click();
    }
  }

  public async fillBackgroundSearchInput(value: string) {
    await this.page.locator(BACKGROUND_SEARCH_INPUT).fill(value);
  }
  // #endregion fill

  // #region Click
  public async clickCreateBackgroundCloseIcon() {
    await this.page.locator(CREATE_BACKGROUND_CLOSE_ICON).click();
  }

  public async clickBackgroundCreateButton() {
    await this.page.locator(CREATE_BACKGROUND_CREATE_BUTTON).click();
  }

  public async clickCorrectionMethodOption(option: string) {
    await this.page.locator(CREATE_BACKGROUND_CORRECTION_OPTIONS).getByText(option).click();
  }

  public async clickCorrectionMethodDropdown() {
    await this.page.locator(CREATE_BACKGROUND_CORRECTION_DROPDOWN).click();
    await this.page.locator(CREATE_BACKGROUND_CORRECTION_OPTIONS).waitFor({timeout: 5_000}).catch(() => null);
  }

  public async clickVisualization(value: any) {
    let locator = null;
    if (typeof value === typeof String) {
      locator = this.page.locator(VISUALIZATION_NAME_AND_STATUS).getByText(value);
    } else if (typeof value === typeof Number) {
      locator = this.page.locator(VISUALIZATION_NAME_AND_STATUS).nth(value)
    } else {
      locator = this.page.locator(VISUALIZATION_NAME_AND_STATUS).nth(0)
    }
    await locator.waitFor();

    await this.pause(1)
    locator.click();
    const heatmapPage = new HeatmapPage(this.page);

    await this.pause(3);
    return heatmapPage;
  }

  public async clickUpdatedOnColumnHeader() {
    await this.page.locator(UPDATED_ON_COLUMN_HEADER).hover();
    await this.page.locator(UPDATED_ON_COLUMN_HEADER).click();
  }

  public async clickPLQCView() {
    await this.page.locator(PLQC_VIEW).click();
  }

  public async clickCloseIcon() {
    await this.page.locator(CLOSE_ICON).click();
  }

  public async clickSelectAllSamples() {
    await this.page.locator(SELECT_ALL_SAMPLES).click();
  }

  public async clickDownloadButtonForImmediateDownload(timeout = 90_000) {
    const [download] = await Promise.all([
      this.page.waitForEvent("download", {timeout: timeout}),
      this.page.locator(START_GENERATING_DOWNLOAD_BUTTON).click(),
    ]).catch(() => [undefined]);
    expect(download).toBeDefined();
    return download;
  }

  public async clickApplyButton() {
    await this.page.locator(APPLY_BUTTON).click();
  }

  public async clickMetagenomicsTab() {
    await this.page.locator(METAGENOMICS_TAB).click();
  }

  public async clickConsensusGenomeTab() {
    await this.page.locator(CONSENSUS_GENOME_TAB).click();
  }

  public async clickVisualizationsTab() {
    await this.page.locator(VISUALIZATIONS_TAB).click();
  }

  public async clickNanoporeTab() {
    await this.page.locator(NANOPORE_TAB).click();
  }

  public async clickAntimicrobialTab() {
    await this.page.locator(ANTIMICROBIAL_TAB).click();
  }

  public async clickDownloadsLink() {
    await this.page.locator(DOWNLOADS_LINK).click();
    return new DownloadsPage(this.page);
  }

  public async clickPublicHeaderLink() {
    await this.page.locator(PUBLIC_HEADER_LINK).click();
  }

  public async clickUploadHeaderLink() {
    await this.page.locator(UPLOAD_HEADER_LINK).click();
  }

  public async clickColumnPlusOptoin(option: string) {
    await this.page.locator(PLUS_OPTIONS).getByText(option).first().click();
  }

  public async clickColumnPlusButton() {
    await this.page.locator(COLUMN_PLUS_BUTTON).click();
  }

  public async clickProjectSearchResult(value: string) {
    await this.page
      .locator(PROJECT_SEARCH_RESULTS)
      .getByText(value)
      .first()
      .click();
  }

  public async clickHostSearchResult(value: string) {
    await this.page
      .locator(HOST_SEARCH_RESULTS)
      .getByText(value)
      .first()
      .click();
  }

  public async clickTaxonDropdownOptions(value: string) {
    const options = this.page.locator(TAXON_DROPDOWN_OPTIONS);
    await options.getByText(value).waitFor();
    await options.getByText(value).hover();

    await options.getByText(value).click();
  }

  public async clickFileFormatOption(value: string) {
    await this.clickFilterOption(value);
  }

  public async clickMetricOption(value: string) {
    await this.clickFilterOption(value);
  }

  public async clickFilterOption(value: string) {
    const options = this.page.locator(FILTER_DROPDOWN_OPTIONS);
    await options.getByText(value).waitFor();
    await options.getByText(value).hover();

    await options.getByText(value).click();
  }

  public async clickIncludeSampleMetadata() {
    await this.page.locator(INCLUDE_SAMPLE_METADATA).click();
  }

  public async clickBackgroundSearchOption(value: string) {
    await this.page
      .locator(BACKGROUND_SEARCH_RESULTS)
      .last()
      .getByText(value)
      .click();
  }

  public async clickTaxonFilterDropdown() {
    await this.page.locator(TAXON_FILTER_DROPDOWN).click();
  }

  public async clickFileFormatDropdown() {
    await this.page.locator(FILTER_DROPDOWN).nth(1).click();
  }

  public async clickDownloadMetricDropdown() {
    await this.page.locator(FILTER_DROPDOWN).first().click();
  }

  public async clickFilterDropdown() {
    await this.page.locator(FILTER_DROPDOWN).click();
  }

  public async clickBackgroundFilterDropdown() {
    await this.page.locator(BACKGROUND_FILTER_DROPDOWN).click();
  }

  public async clickBackgroundButton() {
    await this.pause(1);
    await this.page.locator(BACKGROUND_BUTTON).click();
    await this.pause(1);
  }

  public async clickHeatmapButton() {
    await this.pause(1);
    await this.page.locator(HEATMAP_BUTTON).click();
    await this.pause(1);
  }

  public async clickTaxonHeatmap() {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      await this.page.locator(TAXON_HEATMAP).click(),
    ]);
    await newPage.waitForLoadState("load", {timeout: 10_000}).catch(() => null);
    const heatmapPage = new HeatmapPage(newPage);

    await this.pause(3);
    return heatmapPage;
  }

  public async clickSample(sampleName: string) {
    await this.page.locator(SAMPLE_BY_SAMPLE_NAME(sampleName)).first().click();
    return new SamplesPage(this.page);
  }

  public async clickSampleCheckbox(sampleName: string) {
    await this.page
      .locator(SAMPLE_CHECKBOX_BY_SAMPLE_NAME(sampleName))
      .first()
      .click();
  }

  public async clickDownloadType(downloadType: string) {
    await this.page
      .locator(DOWNLOAD_TYPES_LOCATOR)
      .getByText(downloadType)
      .first()
      .click();
  }

  public async clickNextcladeTreeButton() {
    const nextcladeTreeTooltip = await this.getNextcladeTreeTooltip();
    expect(nextcladeTreeTooltip).not.toMatch("Nexclade is temporarily unavailable");
    await this.page.locator(NEXTCLADE_TREE_BUTTON).click();
    await this.pause(1);
  }

  public async clickNextcladeDefaultTree() {
    await this.page
      .locator(NEXTCLADE_OPTIONS)
      .getByText("Nextclade Default Tree")
      .click();
  }

  public async clickUploadATree() {
    await this.page
      .locator(NEXTCLADE_OPTIONS)
      .getByText("Upload a Tree")
      .click();
  }

  public async clickViewQCInNextcladeButton() {
    await this.page.locator(VIEW_QC_IN_NEXTCLADE).click();
  }

  public async clickNextcladeConfirmButton() {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      await this.page.locator(NEXTCLADE_CONFIRM_BUTTON).click(),
    ]);
    await newPage.waitForLoadState();
    const nextcladePage = new NextcladePage(newPage);

    await this.pause(3);
    return nextcladePage;
  }

  public async clickDownloadButton() {
    await this.page.getByTestId(DOWNLOAD_BUTTON_TESTID).click();
    await this.pause(1);
  }

  public async clickStartGeneratingDownloadButton() {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        response =>
          (response.url().includes("bulk_downloads") &&
            response.request().method() === "POST") ||
          (response.url().includes("graphqlfed") &&
            response.request().method() === "POST"),
      ),
      this.page.locator(START_GENERATING_DOWNLOAD_BUTTON).click(),
    ]);
    const responseJson = await response.json();
    if (responseJson.data && responseJson.data.createAsyncBulkDownload) {
      // graphqlfed
      return responseJson.data.createAsyncBulkDownload.id;
    } else {
      // bulk_downloads
      return responseJson.id;
    }
  }

  public async clickDeleteButton() {
    await this.page.getByTestId(DELETE_BUTTON_TESTID).click();
  }

  public async clickDeleteCancelButton() {
    await this.page.locator(DELETE_CANCEL_BUTTON).waitFor({ state: "visible" });
    await this.page.locator(DELETE_CANCEL_BUTTON).click();
  }

  public async clickDeleteConfirmationButton() {
    await this.page
      .locator(DELETE_CONFIRMATION_BUTTON)
      .waitFor({ state: "visible" });
    await this.page.locator(DELETE_CONFIRMATION_BUTTON).click();
  }

  public async clickDismissButton() {
    await this.page.locator(DISMISS_BUTTON).click();
  }
  // #endregion Click

  // #region Get
  public async getCountForTabName(tabSelector: string, tabName: string) : Promise<number> {
    await this.page.locator(tabSelector).first().waitFor();
    const tabText = await this.page.locator(tabSelector).first().textContent();
    return parseInt(tabText.replace(tabName, ""));
  }

  public async getSamplesTabCount(): Promise<number> {
    // Removing await changes behavior, and this rule is deprecated in more recent verions of eslint
    // eslint-disable-next-line no-return-await
    return await this.getCountForTabName(SAMPLES_TAB, SAMPLE_TABS_NAME);
  }

  public async getAntimicrobialTabCount(): Promise<number> {
    // Removing await changes behavior, and this rule is deprecated in more recent verions of eslint
    // eslint-disable-next-line no-return-await
    return await this.getCountForTabName(ANTIMICROBIAL_TAB, ANTIMICROBIAL_RESISTANCE_TAB_NAME);
  }

  public async getCreateBackgroundNotification() {
    await this.page.locator(CREATE_BACKGROUND_NOTIFICATION).first().waitFor();
    return this.page.locator(CREATE_BACKGROUND_NOTIFICATION).first().textContent();
  }

  public async getReadsLostTable(samples = 4) {
    const readsLostBars = await this.page.locator(PLQC_READS_LOST_BARS).all();
    const tooltips: { [key: string]: string }[] = [];

    for (let i = 0; i < samples; i++) {
      tooltips.push({});
    }

    for (let i = 0; i < readsLostBars.length; i++) {
      const rowIndex = i % samples;
      await this.page.locator(PLQC_READS_LOST_BARS).nth(i).hover();
      const tooltipsForSample = Array.from(new Set(await this.getPLQCHoverTooltip()));

      const key = tooltipsForSample[0];
      const value = tooltipsForSample[1];
      tooltips[rowIndex][key.trim()] = value.trim();
    }
    return tooltips;
  }

  public async getSampleNames(timeout = 30000) {
    await this.page.locator(SAMPLE_NAMES).first().waitFor({timeout: timeout});
    return this.page.locator(SAMPLE_NAMES).allTextContents();
  }

  public async getPLQCHoverTooltip() {
    return this.page.locator(PLQC_HOVER_TOOLTIP).allTextContents();
  }

  public async getNextcladeTreeTooltip() {
    await this.page.locator(NEXTCLADE_TREE_BUTTON).focus();
    await this.page.locator(NEXTCLADE_TREE_BUTTON).hover({force: true});
    const popupTextElement = await this.page.locator(POPUPTEXT).waitFor({timeout: 1000}).catch(() => null);

    let popupText = "";
    if (popupTextElement !== null) {
      popupText = await this.page.locator(POPUPTEXT).textContent();
    }
    return popupText;
  }

  public async getDeleteSelectedSamplesCount() {
    const deleteTitle = await this.page.locator(DELETE_MODAL_TITLE).textContent();
    const selected = deleteTitle.replace(/[^0-9]/g, "");
    return parseInt(selected);
  }

  public async getDownloadTypeSelectedSamplesCount() {
    const nextcladeTaglineText = await this.page
      .locator(DOWNLOAD_TYPES_TAGLINE)
      .textContent();
    const selected = nextcladeTaglineText.replace(/[^0-9]/g, "");
    return parseInt(selected);
  }

  public async getNextcladeSelectedSamplesCount() {
    const nextcladeTaglineText = await this.page
      .locator(NEXTCLADE_TAGLINE)
      .textContent();
    const selected = nextcladeTaglineText.replace(/[^0-9]/g, "");
    return parseInt(selected);
  }

  public async getSelectedSamplesCount() {
    const counterText = await this.page
      .locator(SELECTED_SAMPLES_COUNTER)
      .textContent();
    const selected = counterText.replace(/[^0-9]/g, "");
    return parseInt(selected);
  }

  public async getTimeframeFilterOptions() {
    await this.page.locator(TIMEFRAME_FILTER).click();
    const options = this.page.locator(TIMEFRAME_OPTIONS).allTextContents();
    await this.page.locator(TIMEFRAME_FILTER).click();
    return options;
  }

  public async getLocationFilterOptions() {
    await this.page.locator(LOCATION_FILTER).click();
    const locationOptions = this.page
      .locator(LOCATION_OPTIONS)
      .allTextContents();
    await this.page.locator(LOCATION_FILTER).click();
    return locationOptions;
  }

  public async getDisabledTooltip() {
    return this.page.locator(DISABLED_TOOLTIP).textContent();
  }

  public async getSamplesCount() {
    await this.page.locator(SAMPLES_TAB).waitFor();
    await this.pause(1);
    const tabText = await this.page.locator(SAMPLES_TAB).textContent();
    return parseInt(tabText.replace("Samples", ""));
  }

  public async getConsensusGenomesCount() {
    await this.page
      .locator(CONSENSUS_GENOME_TAB, { hasNotText: "-" })
      .waitFor();
    const tabText = await this.page.locator(CONSENSUS_GENOME_TAB).textContent();
    return parseInt(tabText.replace("Consensus Genomes", ""));
  }

  public async getCompletedRowIndexes() {
    await this.scrollDownToElement(COMPLETED_ROWS, ROWS, ARIA_ROWINDEX);

    const rows = await this.page.locator(COMPLETED_ROWS).all();
    const indexes = [];
    for (const row of rows) {
      const rowIndex = await row.getAttribute(ARIA_ROWINDEX, {timeout: 4_000}).catch(() => null);
      if (rowIndex !== null) {
        indexes.push(+rowIndex);
      }
    }

    return indexes;
  }

  public async getSampleIdFromRow(index: number) {
    const row = this.page.locator(ROW_CHECKBOXES).nth(index);
    return row.getAttribute("value");
  }

  public async getSampleNameFromRow(index: number) {
    const row = this.page.locator(SAMPLE_NAME_BY_INDEX(index));
    return row.textContent();
  }

  public async getErrorMessages() {
    await this.page
      .locator(ERROR_MESSAGE)
      .first()
      .waitFor({ timeout: 10000 })
      .catch(() => null);
    return this.page.locator(ERROR_MESSAGE).allTextContents();
  }

  public async getAlertMessages() {
    await this.page
      .locator(ALERT_MESSAGE)
      .first()
      .waitFor({ state: "visible" });
    return this.page.locator(ALERT_MESSAGE).allTextContents();
  }

  public async getNotificationMessages() {
    const notificationLocator = this.page.locator(NOTIFICATION_MESSAGE).first();
    await notificationLocator.waitFor({ state: "visible" });
    if (notificationLocator.isVisible()) {
      await notificationLocator.locator("[class*='toggleContainer']").click();
    }
    return this.page.locator(NOTIFICATION_MESSAGE).allTextContents();
  }

  public async getVisualizationTable(timeout = 30_000) {
    await this.page.locator("[role='rowgroup'] [role='row']").first().waitFor({timeout: timeout});
    await expect(this.page.locator(LOADING).last()).toHaveCount(0, {
      timeout: timeout,
    });
    return this.getTable(
      "[role='columnheader']",
      "[role='rowgroup'] [role='row']",
      "[role='gridcell']",
    );
  }

  public async getProjectsTable(timeout = 120000) {
    await this.page
      .locator(SAMPLES_COUNT_TD_1)
      .first()
      .waitFor({ timeout: timeout })
      .catch(() => null);
    return this.getTable(
      "[class*='dataContainer'] [class*='Table__headerColumn'] [class*='label']",
      "[class*='dataContainer'] [aria-label='row']",
      "//div[@role='gridcell']",
    );
  }

  public async getSamplesTable(timeout = 10000) {
    await this.page
      .locator(ROWS)
      .first()
      .waitFor({ timeout: timeout })
      .catch(() => null);
    return this.getTable(
      "[class*='dataContainer'] [class*='Table__headerColumn'] [class*='label']",
      "[class*='dataContainer'] [aria-label='row']",
      "//div[@role='gridcell' and not(@aria-colindex='1') and not(position() = last())]",
    );
  }

  public async getSamplesTableOrderedByName() {
    const samplesTable = await this.getSamplesTable();
    const samplesTableOrderByName = {};
    if (samplesTable.length > 0) {
      for (const row of samplesTable) {
        if (row["Sample"]) {
          samplesTableOrderByName[row["Sample"][0]] = row;
        }
      }
    }
    return samplesTableOrderByName;
  }

  public async getProjectsTableOrderedByName(timeout = 120000) {
    const projectsTable = await this.getProjectsTable(timeout);
    const projectsTableOrderByName = {};
    if (projectsTable.length > 0) {
      for (const row of projectsTable) {
        if (row["Project"]) {
          projectsTableOrderByName[row["Project"][0]] = row;
        }
      }
    }
    return projectsTableOrderByName;
  }
  // #endregion Get

  public async setUploadTreeInput(filePath: string) {
    await this.page.setInputFiles(UPLOAD_A_TREE_INPUT, filePath);
  }

  // #region Macro
  public async delete6MonthOldSamples(project: any, workflow: string) {
    await this.navigateToSamples(project.id, workflow);
    const sampleTable = await this.getSamplesTable();

    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

    const samplesToDelete = [];
    for (const sample of sampleTable) {
      if (new Date(sample["Created On"][0]) <= sixMonthsAgo) {
        samplesToDelete.push(sample["Sample"][0]);
      }
    }
    if (samplesToDelete.length > 0) {
      for (const sampleName of samplesToDelete) {
        await this.clickSampleCheckbox(sampleName);
      }
      await this.clickDeleteButton();
      await this.clickDeleteConfirmationButton();
    }
  }

  public async gotToDownloads() {
    await this.page.locator(USER_DROPDOWN).click();
    await this.page.locator(USER_DROPDOWN_DOWNLOADS_LINK).click();
    return new DownloadsPage(this.page);
  }

  public async waitForSamplesComplete(
    projectId: number,
    workflow: string,
    sampleNames: Array<string>,
    waitTime = 30 * 1000,
  ) {
    for (const sampleName of sampleNames) {
      await this.waitForSampleComplete(
        projectId,
        workflow,
        sampleName,
        waitTime,
      );
    }
  }

  public async waitForSampleComplete(
    projectId: number,
    workflow: string,
    sampleName: string,
    waitTime = 30 * 1000,
  ) {
    let sampleStatus = "";
    await this.navigateToSamples(projectId, workflow);
    let samplesTable = await this.getSamplesTableOrderedByName();
    if (Object.keys(samplesTable).length > 0 && samplesTable[sampleName]) {
      sampleStatus = samplesTable[sampleName]["Sample"][1];
    }
    const startTime = Date.now();

    while (Date.now() - startTime < waitTime) {
      if (sampleStatus.includes("COMPLETE")) {
        break;
      }
      await this.pause(10);

      await this.navigateToSamples(projectId, workflow);
      samplesTable = await this.getSamplesTableOrderedByName();
      if (Object.keys(samplesTable).length > 0 && samplesTable[sampleName]) {
        sampleStatus = samplesTable[sampleName]["Sample"][1];
      }
    }
  }

  public async scrollDownToSample(sampleName: string) {
    await this.scrollDownToElement(
      SAMPLE_BY_SAMPLE_NAME(sampleName),
      ROWS,
      ARIA_ROWINDEX,
    );
  }

  public async selectCompletedSamples(numberToSelect: number) {
    const selectedSampleNames = new Array<string>();
    const selectedRowIndexes = new Array<number>();

    await this.page.locator(ROWS).first().waitFor();
    await this.scrollDownToElement(COMPLETED_ROWS, ROWS, ARIA_ROWINDEX);

    for (let i = 0; i < numberToSelect; i++) {
      const completedRowIndexes = await this.getCompletedRowIndexes();
      if (numberToSelect <= completedRowIndexes.length) {
        const rowIndex = completedRowIndexes[i];

        if (!selectedRowIndexes.includes(rowIndex)) {
          const sampleName = await this.getSampleNameFromRow(rowIndex);
          await this.clickSampleCheckbox(sampleName);

          selectedRowIndexes.push(rowIndex);
          selectedSampleNames.push(sampleName);
        }
      }
    }
    await this.pause(2);
    return selectedSampleNames;
  }

  public async isPlusColumnOptionChecked(option: string) {
    const classAttribute = await this.page
      .locator(CHECKED_PLUS_OPTION(option))
      .first()
      .getAttribute("class");
    return classAttribute.includes("checked-");
  }

  public async selectPlusColumnOptions(options: Array<string>) {
    await this.clickColumnPlusButton();
    for (const columnName of options) {
      const checked = await this.isPlusColumnOptionChecked(columnName);
      if (!checked) {
        await this.clickColumnPlusOptoin(columnName);
      }
    }
    await this.pressEscape();
    await this.pause(1);
  }

  public async pickBackground(backgroundName = null) {
    await this.pause(3);

    let background = null;
    await this.clickBackgroundFilterDropdown();

    await this.page.locator(BACKGROUND_SEARCH_RESULTS).first().waitFor();
    const backgroundsFE = await this.page.locator(BACKGROUND_SEARCH_RESULTS).allTextContents();
    const backgrounds = await this.getBackgrounds();
    if (backgroundName === null) {
      backgroundName = backgroundsFE[Math.floor(Math.random() * backgroundsFE.length)];
    }
    background = backgrounds.filter(b => b.name === backgroundName)[0];

    await this.fillBackgroundSearchInput(background.name);
    await this.pause(3);
    await this.clickBackgroundSearchOption(background.name);
    return background;
  }

  public async validateSampleNotPresent(sampleName: string) {
    const isPresent = await this.page
      .locator(SAMPLE_CHECKBOX_BY_SAMPLE_NAME(sampleName))
      .isVisible();
    expect(isPresent).toBeFalsy();
  }

  public async isBackgroundFilterVisible() {
    return this.page.locator(BACKGROUND_FILTER_LABEL).isVisible();
  }
  // #endregion Macro
}
