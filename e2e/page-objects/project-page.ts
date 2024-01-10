import { expect } from "@playwright/test";
import { HeatmapPage } from "./heatmap-page";
import { PageObject } from "./page-object";

const HEATMAP_BUTTON = "[class*='actions'] [role='listbox'] [class*='action']:not([data-testid])";
const TAXON_HEATMAP = "[href*='/heatmap']";
const SAMPLE_CHECKBOX_BY_SAMPLE_NAME = (sampleName: string) => `//div[text()='${sampleName}']/ancestor::div[@aria-rowindex]//div[contains(@class, 'checkbox')]`;
const DELETE_BUTTON_TESTID = "bulk-delete-trigger";
const ROW_CHECKBOXES = "[data-testid='row-select-checkbox'] input[type='checkbox']";
const COMPLETED_ROWS = "//div[contains(@class, 'sampleStatus') and contains(@data-testid, 'complete')]//ancestor::div[@aria-rowindex]";
const ROWS = "//div[contains(@class, 'sampleStatus')]//ancestor::div[@aria-rowindex]";
const SAMPLE_NAME_BY_INDEX = (index: number) => `//div[contains(@class, "sampleStatus")]//ancestor::div[@aria-rowindex="${index}"]//div[contains(@class, "sampleName-")]`;
const DELETE_CONFIRMATION_BUTTON = "//button[text()='Delete']";
const ALERT_MESSAGE = "[class*='MuiAlert-message']";
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

  // #region Click
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
    const completedSampleLocator = SAMPLE_CHECKBOX_BY_SAMPLE_NAME(sampleName);
    await this.page.locator(completedSampleLocator).scrollIntoViewIfNeeded();
    await this.page.locator(completedSampleLocator).click();
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

  public async validateSampleNotPresent(sampleName: string) {
    const isPresent = await this.page.locator(SAMPLE_CHECKBOX_BY_SAMPLE_NAME(sampleName)).isVisible();
    expect(isPresent).toBeFalsy();
  }
}