import { expect } from "@playwright/test";
import { HeatmapPage } from "./heatmap-page";
import { PageObject } from "./page-object";

const HEATMAP_BUTTON = "[class*='actions'] [role='listbox'] [class*='action']:not([data-testid])";
const TAXON_HEATMAP = "[href*='/heatmap']";
const SAMPLE_CHECKBOX_BY_SAMPLE_NAME = (sampleName: string) => `//div[text()='${sampleName}']/ancestor::div[@aria-rowindex]//div[contains(@class, 'checkbox')]`;
const DELETE_BUTTON_TESTID = "bulk-delete-trigger";
const DOWNLOAD_BUTTON_TESTID = "download-icon";
const DOWNLOAD_TYPES_LOCATOR = "[class*='downloadTypeContainer'] [class*='name']";
const START_GENERATING_DOWNLOAD_BUTTON = "//button[text()='Start Generating Download']";
const TAXON_FILTER_DROPDOWN = "[class*='taxaWithHitsDropdown'] [data-testid='filters']";
const TAXON_DROPDOWN_OPTIONS = "[class*='portalDropdown'] [class*='item'] [class*='option']";
const FILTER_DROPDOWN = "[class*='downloadTypeContainer'] [data-testid='filter-value']";
const FILTER_DROPDOWN_OPTIONS = "[class*='portalDropdown'] [data-testid='dropdown-menu'] [role='option']";
const BACKGROUND_FILTER_DROPDOWN = "//div[contains(@class, 'downloadType')]//div[text()='Background' and contains(@class, 'label')]/following-sibling::div[contains(@class, 'dropdown')]";
const BACKGROUND_SEARCH_INPUT = "[class*='portalDropdown'] [data-testid='filter-search-bar'] input";
const BACKGROUND_SEARCH_RESULTS = "[class*='optionText']";
const BACKGROUND_FILTER_LABEL = "//div[contains(@class, 'downloadType')]//div[text()='Background' and contains(@class, 'label')]";
const SEARCH_MY_DATA_INPUT = "[class*='header'] [class*='category search'] input";
const HOST_SEARCH_RESULTS = "[category='host'] [class='title']";

const SAMPLE_METEDATA = "Sample Metadata";
const SAMPLE_OVERVIEW = "Samples Overview";
const SAMPLE_TAXON_REPORTS = "Sample Taxon Reports";
const COMBINED_SAMPLE_TAXON_RESULTS = "Combined Sample Taxon Results";
const ORIGINAL_INPUT_FILES = "Original Input Files";
const CONTIG_SUMMARY_REPORTS = "Contig Summary Reports";
const UNMAPPED_READS = "Unmapped Reads";
const COMBINED_MICROBIOME_FILE = "Combined Microbiome File";
const READS_NON_HOST = "Reads (Non-host)";
const CONTIGS_NON_HOST = "Contigs (Non-host)";

export const DOWNLOAD_TYPES = {
  "mngs": [
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
  "ONT": [
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
  "amr": [
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
const ROW_CHECKBOXES = "[data-testid='row-select-checkbox'] input[type='checkbox']";
const COMPLETED_ROWS = "//div[contains(@class, 'sampleStatus') and @data-testid='complete']//ancestor::div[@aria-rowindex]";
const ROWS = "//div[contains(@class, 'sampleStatus')]//ancestor::div[@aria-rowindex]";
const SAMPLE_NAME_BY_INDEX = (index: number) => `//div[contains(@class, "sampleStatus")]//ancestor::div[@aria-rowindex="${index}"]//div[contains(@class, "sampleName-")]`;
const DELETE_CONFIRMATION_BUTTON = "//button[text()='Delete']";
const ALERT_MESSAGE = "[role='alert'][class*='toast-body']";
const WORKFLOW_PARAM = {
  "ONT": "long-read-mngs",
  "mngs": "short-read-mngs",
  "viral-consensus-genome": "consensus-genome",
  "amr": "amr",
};
export const RUN_TYPES = {
  "ONT": "Nanopore",
  "mngs": "Metagenomic",
  "viral-consensus-genome": "Consensus Genome",
  "amr": "Antimicrobial Resistance",
};


export class ProjectPage extends PageObject {

  // #region Navigate
  public async navigateToSamples(projectId: number, workflow="", domain="public") {
    const workflowParam = workflow === "" ? workflow : `&workflow=${WORKFLOW_PARAM[workflow]}`;
    const url = `${process.env.BASEURL}/${domain}?projectId=${projectId}&currentTab=samples${workflowParam}`;
    await this.page.goto(url);
    await this.pause(1);
  }
  // #endregion Navigate

  // #region Api
  public async getBackgrounds() {
    const response = await this.page.context().request.get(
      `${process.env.BASEURL}/backgrounds.json`,
    );
    const responseJson = await response.json();
    return responseJson.backgrounds;
  }

  public async getOrCreateProject(projectName: string) {
    const userName = process.env.CZID_USERNAME.split("@")[0];
    const userProjectName = `${userName}_${projectName}`;
    const projects = await this.getProjects(userProjectName);
    let project = null;
    if (projects.length < 1) {
      const payload = {
        "project":{
          "name": userProjectName,
          "public_access": 1, // Public
          "description": "created by automation",
        },
      };
      await this.page.context().request.post(
        `${process.env.BASEURL}/projects.json`, {data: payload},
      );
      project = await this.waitForProject(userProjectName);
      await this.pause(1);
      await this.page.reload();
    } else {
      project = await projects.filter(p => p.name === userProjectName)[0];
    }
    return project;
  }

  public async waitForProject(projectName: string) {
    const startTime = Date.now();
    const timeout = 30000;
    while ((Date.now() - startTime) < timeout) {
      const projects = await this.getProjects(projectName);
      const filteredProjects = await projects.filter(p => p.name === projectName);
      if (filteredProjects.length > 0) {
        return filteredProjects[0];
      }
      await this.pause(1);
    }
  }

  public async getProjects(searchTerm: string) {
    const response = await this.page.context().request.get(
      `${process.env.BASEURL}/projects.json?search=${searchTerm}`,
    );
    const responseJson = await response.json();
    return responseJson.projects;
  }

  public async getProjectByName(projectName: string) {
    const projects = await this.getProjects(projectName);
    return projects.length >= 1 ? projects.filter(p => p.name === projectName)[0] : null;
  }

  public async getPublicProjects() {
    const response = await this.page.context().request.get(
      `${process.env.BASEURL}/projects.json?domain=public`,
    );
    const responseJson = await response.json();
    return responseJson.projects;
  }
  // #endregion Api

  // #region fill
  public async fillSearchMyDataInput(value: string) {
    await this.page.locator(SEARCH_MY_DATA_INPUT).fill(value);
    await this.pressEnter();
  }

  public async fillBackgroundSearchInput(value: string) {
    await this.page.locator(BACKGROUND_SEARCH_INPUT).fill(value);
  }
  // #endregion fill

  // #region Click
  public async clickHostSearchResult(value: string) {
    await this.page.locator(HOST_SEARCH_RESULTS).getByText(value).first().click();
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

  public async clickBackgroundSearchOption(value: string) {
    await this.page.locator(BACKGROUND_SEARCH_RESULTS).last().getByText(value).click();
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

  public async clickHeatmapButton() {
    await this.page.locator(HEATMAP_BUTTON).click();
  }

  public async clickTaxonHeatmap() {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      await this.page.locator(TAXON_HEATMAP).click(),
    ]);
    await newPage.waitForLoadState();
    return new HeatmapPage(newPage);
  }

  public async clickSampleCheckbox(sampleName: string) {
    await this.page.locator(SAMPLE_CHECKBOX_BY_SAMPLE_NAME(sampleName)).click();
  }

  public async clickDownloadType(downloadType: string) {
    await this.page.locator(DOWNLOAD_TYPES_LOCATOR).getByText(downloadType).first().click();
  }

  public async clickDownloadButton() {
    await this.page.getByTestId(DOWNLOAD_BUTTON_TESTID).click();
    await this.pause(1);
  }

  public async clickStartGeneratingDownloadButton() {
    const [response] = await Promise.all([
      this.page.waitForResponse(response =>
        response.url().includes("bulk_downloads") && response.request().method() === "POST",
      ),
      this.page.locator(START_GENERATING_DOWNLOAD_BUTTON).click(),
    ]);
    const responseJson = await response.json();
    return responseJson.id;
  }

  public async clickDeleteButton() {
    await this.page.getByTestId(DELETE_BUTTON_TESTID).click();
  }

  public async clickDeleteConfirmationButton() {
    await this.page.locator(DELETE_CONFIRMATION_BUTTON).waitFor({state: "visible"});
    await this.page.locator(DELETE_CONFIRMATION_BUTTON).click();
  }
  // #endregion Click

  // #region Get
  public async getCompletedRowIndexes() {
    await this.scrollDownToElement(COMPLETED_ROWS, ROWS, "aria-rowindex");

    const rows = await this.page.locator(COMPLETED_ROWS).all();
    const indexes = [];
    for (const row of rows) {
      const rowIndex = await row.getAttribute("aria-rowindex");
      indexes.push(+rowIndex);
    }

    return indexes;
  }

  public async getSampleIdFromRow(index: number) {
    const row = this.page.locator(ROW_CHECKBOXES).nth(index);
    return row.getAttribute("value");
  }

  public async getSampleNameFromRow(index: number) {
    const row = this.page.locator(SAMPLE_NAME_BY_INDEX(index));
    await row.scrollIntoViewIfNeeded();
    return row.textContent();
  }

  public async getAlertMessages() {
    await this.page.locator(ALERT_MESSAGE).first().waitFor({state: "visible"});
    return this.page.locator(ALERT_MESSAGE).allTextContents();
  }
  // #endregion Get

  public async pickBackground(backgroundName = null) {
    let background = null;
    const backgrounds = await this.getBackgrounds();
    if (backgroundName !== null) {
      background = backgrounds.filter(b => b.name === backgroundName)[0];
    } else {
      background = backgrounds[0];
    }

    await this.clickBackgroundFilterDropdown();
    await this.fillBackgroundSearchInput(background.name);
    await this.clickBackgroundSearchOption(background.name);
    return background;
  }

  public async validateSampleNotPresent(sampleName: string) {
    const isPresent = await this.page.locator(SAMPLE_CHECKBOX_BY_SAMPLE_NAME(sampleName)).isVisible();
    expect(isPresent).toBeFalsy();
  }

  public async isBackgroundFilterVisible() {
    return this.page.locator(BACKGROUND_FILTER_LABEL).isVisible();
  }

}