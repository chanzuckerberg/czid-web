import { expect } from "@playwright/test";
import { PageObject } from "./page-object";

import { ProjectPage } from "./project-page";

const SAMPLES_IN_DOWNLOAD_DROPDOWN = "//div[text()='Samples in this Download']";
const SAMPLES_IN_DOWNLOAD_NAMES = "[class*='samplesList'] [class*='sampleName']";
const CLOSE_ICON = "[class*='closeIcon']";
const BACKGROUND_VALUE = "[data-testid='background-value']";
const INCLUDE_SAMPLE_METADATA = "//span[text()='Include sample metadata in this table']/preceding-sibling::input";
const METRIC_VALUE = "[data-testid='metric-value']";
const DOWNLOAD_TYPE_METADATA = (downloadId: string) => `[id='${downloadId}'][data-testid='download-details-link']`;
const DOWNLOAD_COMPLETE_BY_DOWNLOADID = (downloadId: string) => `//div[contains(@data-testid, 'complete')]/parent::div/following-sibling::div/span[@id='${downloadId}']`;
const DOWNLOAD_FILE_BY_DOWNLOADID = (downloadId: string) => `//div[@id='${downloadId}' and text()='Download File']`;
const DOWNLOAD_STATUS_BY_INDEX = (rowIndex: string) => `(//*[contains(@class, 'downloadStatus')])[${rowIndex}]`;
const BULK_DOWNLOAD_METRICS = {
  "mngs": "short-read-mngs",
  "ONT": "long-read-mngs",
  "amr": "amr",
  "viral-consensus-genome": "consensus-genome",
  "covid-consensus-genome": "consensus-genome",
};

export class DownloadsPage extends PageObject {

  // #region Navigate
  public async navigateToDownloads() {
    const url = `${process.env.BASEURL}/bulk_downloads`;
    await this.page.goto(url);
    await this.pause(1);
  }
  // #endregion Navigate

  // #region Api
  public async getBulkDownloadMetrics(workflow: string) {
    const response = await this.page.context().request.get(
      `${process.env.BASEURL}/bulk_downloads/metrics?workflow=${BULK_DOWNLOAD_METRICS[workflow]}`,
    );
    return response.json();
  }
  // #endregion Api

  // #region Click
  public async clickDownloadTypeDetails(downloadId: number) {
    const locatorString = DOWNLOAD_TYPE_METADATA(downloadId.toString());
    await this.page.locator(locatorString).waitFor();
    await this.page.locator(locatorString).click();
  }

  public async clickIncludeSampleMetadata() {
    await this.page.locator(INCLUDE_SAMPLE_METADATA).click();
  }

  public async clickSamplesInDownloadDropdown() {
    await this.page.locator(SAMPLES_IN_DOWNLOAD_DROPDOWN).click();
  }

  public async clickDownloadFile(downloadId: string) {
    const rowLocator = DOWNLOAD_FILE_BY_DOWNLOADID(downloadId);
    const downloadPromise = this.page.waitForEvent("download");
    await this.page.locator(rowLocator).click();
    return downloadPromise;
  }

  public async clickCloseIcon() {
    await this.page.locator(CLOSE_ICON).click();
  }
  // #endregion Click

  // #region Get
  public async getMicrobiomeDownloadMetrics() {
    return [
      { text: "NT rPM", value: "NT.rpm" },
      { text: "NT r (total reads)", value: "NT.r" },
      { text: "NR rPM", value: "NR.rpm" },
      { text: "NR r (total reads)", value: "NR.r" },
    ];
  }

  public async getMetricValue() {
    return this.page.locator(METRIC_VALUE).textContent();
  }

  public async getBackgroundValue() {
    return this.page.locator(BACKGROUND_VALUE).textContent();
  }

  public async getDownloadTypeCount(downloadType: string) {
    const downloadTypes = await this.page.locator(DOWNLOAD_TYPE_METADATA(downloadType)).all();
    return downloadTypes.length;
  }

  public async getSamplesInDownloadNames() {
    await this.page.locator(SAMPLES_IN_DOWNLOAD_NAMES).first().waitFor();
    return this.page.locator(SAMPLES_IN_DOWNLOAD_NAMES).allTextContents();
  }

  public async getDownloadStatus(rowIndex: string) {
    return this.page.locator(DOWNLOAD_STATUS_BY_INDEX(rowIndex)).textContent();
  }
  // #endregion Get

  // #region Macro
  public async waitForDownloadComplete(downloadId: number, timeout = 30000) {
    const startTime = Date.now();

    let complete = false;
    while ((Date.now() - startTime) < timeout) {
      complete = await this.page.locator(DOWNLOAD_COMPLETE_BY_DOWNLOADID(downloadId.toString())).isVisible();
      if (!complete) {
        await this.navigateToDownloads();
        await this.pause(1);
        await this.page.locator("[class*='downloadCell']").first().waitFor();
      } else {
        break;
      }
    }
    return complete;
  }
  // #endregion Macro

  public async downloadSmokeTest(workflow: string, downloadType: string, timeout: number) {
    const projectPage = new ProjectPage(this.page);
    const project = await projectPage.getOrCreateProject(`automation_project_${workflow}`);

    // #region Go to the Samples tab
    await projectPage.navigateToSamples(project.id, workflow);
    // #endregion Go to the Samples tab

    // #region Choose samples
    if (downloadType === "Host Gene Counts") {
      await projectPage.fillSearchMyDataInput("Human");
      await projectPage.clickHostSearchResult("Human");
    }

    const completedRowIndexes = await projectPage.getCompletedRowIndexes();
    const maxFiles = 2;
    const samplesToDownload = completedRowIndexes.length > maxFiles ? Math.random() * maxFiles : completedRowIndexes.length;
    for (let i = 0; i < samplesToDownload; i++) {
      const rowIndex = completedRowIndexes[i];

      const sampleName = await projectPage.getSampleNameFromRow(rowIndex);
      await projectPage.clickSampleCheckbox(sampleName);
    }
    // #endregion Choose samples

    // #region Start the sample download
    let includeSampleMetadata = false;
    if (downloadType === "Consensus Genome Overview: Include sample metadata") {
      downloadType = downloadType.split(":")[0];
      includeSampleMetadata = true;
    }

    await projectPage.clickDownloadButton();
    await projectPage.clickDownloadType(downloadType);

    let expectedFileExtention = "tar.gz";
    let background = null;
    let bulkDownloadMetric = null;
    if (workflow === "mngs" && downloadType === "Sample Taxon Reports") {
      background = await projectPage.pickBackground();
    }
    else if (downloadType === "Combined Sample Taxon Results") {
      const bulkDownloadMetrics = await this.getBulkDownloadMetrics(workflow);
      bulkDownloadMetric = bulkDownloadMetrics[Math.floor(Math.random() * bulkDownloadMetrics.length)];

      await projectPage.clickFilterDropdown();
      await projectPage.clickMetricOption(bulkDownloadMetric.text);

      const backgroundFilter = await projectPage.isBackgroundFilterVisible();
      if (backgroundFilter) {
        background = await projectPage.pickBackground();
      }
    }
    else if (downloadType === "Combined Microbiome File") {
      expectedFileExtention = "biom";
      const downloadMetrics = await this.getMicrobiomeDownloadMetrics();
      bulkDownloadMetric = downloadMetrics[Math.floor(Math.random() * downloadMetrics.length)];

      await projectPage.clickDownloadMetricDropdown();
      await projectPage.clickMetricOption(bulkDownloadMetric.text);
    }
    else if (downloadType === "Reads (Non-host)") {
      await projectPage.clickTaxonFilterDropdown();
      await projectPage.clickTaxonDropdownOptions("All taxa");

      const fileFormats = [".fastq", ".fasta"];
      const fileFormat = fileFormats[Math.floor(Math.random() * fileFormats.length)];
      await projectPage.clickFileFormatDropdown();
      await projectPage.clickFileFormatOption(fileFormat);
    }
    else if (downloadType === "Contigs (Non-host)") {
      await projectPage.clickTaxonFilterDropdown();
      await projectPage.clickTaxonDropdownOptions("All taxa");
    }
    else if (downloadType === "Consensus Genome") {
      await projectPage.clickFilterDropdown();
      const option = ["Separate Files", "Single File (Concatenated)"][Math.floor(Math.random() * 2)];
      if (option === "Single File (Concatenated)") {
        expectedFileExtention = "fa";
      }
      await projectPage.clickFilterOption(option);
    }
    else if ((downloadType === "Consensus Genome Overview") && includeSampleMetadata) {
      await this.clickIncludeSampleMetadata();
    }

    const downloadId = await projectPage.clickStartGeneratingDownloadButton();
    // #endregion Start the sample download

    // #region Verify the download alert message
    const alertMessages = await projectPage.getAlertMessages();
    expect(alertMessages).toEqual([
        "We've received your download request and are busy preparing your data. To check the status of your download, visit the Downloads page.Dismiss",
      ],
    );
    // #endregion Verify the download alert message

    // #region Go to the downloads page and wait for the sample download to be ready
    await this.navigateToDownloads();
    const downloadComplete = await this.waitForDownloadComplete(downloadId, timeout);
    expect(downloadComplete).toBeTruthy();
    // #endregion Go to the downloads page and wait for the sample download to be ready

    // #region Validate additional download type information
    if (workflow === "mngs" && downloadType === "Sample Taxon Reports") {
      await this.clickDownloadTypeDetails(downloadId);
      expect(await this.getBackgroundValue()).toEqual(background.name);
      await this.clickCloseIcon();
    }
    else if (downloadType === "Combined Sample Taxon Results") {
      await this.clickDownloadTypeDetails(downloadId);
      expect(await this.getMetricValue()).toEqual(bulkDownloadMetric.text);
      await this.clickCloseIcon();
    }
    // #endregion Validate additional download type information

    // #region Verify the expected file was downloaded
    await this.waitForDownloadComplete(downloadId, timeout);
    const download = await this.clickDownloadFile(downloadId);

    expect(`${downloadType}.${expectedFileExtention}`).toMatch(download.suggestedFilename());
    // #endregion Verify the expected file was downloaded
  };
}