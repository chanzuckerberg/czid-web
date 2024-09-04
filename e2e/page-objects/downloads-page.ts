import { expect } from "@playwright/test";
import { PageObject } from "./page-object";

import { ProjectPage } from "./project-page";

const SAMPLE_METADATA = "Sample Metadata";
const SAMPLES_IN_DOWNLOAD_DROPDOWN = "//div[text()='Samples in this Download']";
const SAMPLES_IN_DOWNLOAD_NAMES = "[class*='samplesList'] [class*='sampleName']";
const CLOSE_ICON = "[class*='closeIcon']";
const BACKGROUND_VALUE = "[data-testid='background-value']";
const METRIC_VALUE = "[data-testid='metric-value']";
const ADVANCED_DOWNLOAD_TAB = "[data-testid='advanced-download']";
const CLIPBOARD_ICON = "[class*='command']";
const DOWNLOAD_DETAILS = (downloadId: string) => `[id='${downloadId}'][data-testid='download-details-link']`;
const DOWNLOAD_COMPLETE_BY_DOWNLOADID = (downloadId: string) => `//div[contains(@data-testid, 'complete')]/parent::div/following-sibling::div/span[@id='${downloadId}']`;
const DOWNLOAD_FILE_BY_DOWNLOADID = (downloadId: string) => `//div[@id='${downloadId}' and text()='Download File']`;
const DOWNLOAD_DATE_BY_DOWNLOADID = (downloadId: string) => `//div[@id='${downloadId}']/ancestor::div[contains(@class, '__Table__row tableRow-')]//div[@data-testid='date-created']`;
const DOWNLOAD_NAME_BY_DOWNLOADID = (downloadId: string) => `//div[@id='${downloadId}']/ancestor::div[contains(@class, '__Table__row tableRow-')]//div[@data-testid='download-name']`;
const DOWNLOAD_COUNT_BY_DOWNLOADID = (downloadId: string) => `//div[@id='${downloadId}']/ancestor::div[contains(@class, '__Table__row tableRow-')]//div[@aria-colindex='3']/div`;
const DOWNLOAD_STATUS_BY_DOWNLOADID = (downloadId: string) => `//div[contains(@class, 'downloadStatus')]/parent::div/following-sibling::div/span[@id='${downloadId}']`;
const DOWNLOAD_STATUS_BY_INDEX = (rowIndex: string) => `(//*[contains(@class, 'downloadStatus')])[${rowIndex}]`;
const BULK_DOWNLOAD_METRICS = {
  "mngs": "short-read-mngs",
  "ONT": "long-read-mngs",
  "amr": "amr",
  "viral-consensus-genome": "consensus-genome",
  "covid-consensus-genome": "consensus-genome",
};

export const COMBINED_MICROBIOME_FILE_NAME = "Combined Microbiome File.biom";

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
  public async clickClipboardIcon() {
    await this.page.locator(CLIPBOARD_ICON).click();
    return this.page.evaluate(() => navigator.clipboard.readText());
  }

  public async clickAdvancedDownloadTab() {
    await this.page.locator(ADVANCED_DOWNLOAD_TAB).click();
  }

  public async clickDownloadDetails(downloadId: number) {
    const locatorString = DOWNLOAD_DETAILS(downloadId.toString());
    await this.page.locator(locatorString).waitFor();
    await this.page.locator(locatorString).click();
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
  public async getDownloadCount(downloadId: string) {
    return (await this.page.locator(DOWNLOAD_COUNT_BY_DOWNLOADID(downloadId)).textContent()).split(" ")[0];
  }

  public async getDownloadName(downloadId: string) {
    return this.page.locator(DOWNLOAD_NAME_BY_DOWNLOADID(downloadId)).textContent();
  }

  public async getDownloadDate(downloadId: string) {
    return this.page.locator(DOWNLOAD_DATE_BY_DOWNLOADID(downloadId)).textContent();
  }

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
    const downloadTypes = await this.page.locator(DOWNLOAD_DETAILS(downloadType)).all();
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
        await this.pause(7); // typically takes 3-5 secs to load
        await this.page.locator("[class*='downloadCell']").first().waitFor();
      } else {
        break;
      }
    }
    return complete;
  }

  public async isDownloadVisible(downloadId: number) {
    await this.page.locator(DOWNLOAD_STATUS_BY_DOWNLOADID(downloadId.toString())).isVisible();
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

    const numberOfSamplesToDownload = Math.floor(Math.random() * 2) + 1;
    await projectPage.selectCompletedSamples(numberOfSamplesToDownload);
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
      await projectPage.clickIncludeSampleMetadata();
    }

    if (downloadType.includes("Consensus Genome Overview") || (downloadType === SAMPLE_METADATA) ){
      // Verify that the download completes immediately
      expectedFileExtention = "csv";
      const fileName = downloadType === SAMPLE_METADATA ? "sample_metadata" : "consensus_genome_overview";
      const download = await projectPage.clickDownloadButtonForImmediateDownload();
      expect(`${fileName}.${expectedFileExtention}`).toMatch(download.suggestedFilename());
      return;
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
      await this.clickDownloadDetails(downloadId);
      expect(await this.getBackgroundValue()).toEqual(background.name);
      await this.clickCloseIcon();
    }
    else if (downloadType === "Combined Sample Taxon Results") {
      await this.clickDownloadDetails(downloadId);
      expect(await this.getMetricValue()).toEqual(bulkDownloadMetric.text);
      await this.clickCloseIcon();
    }
    // #endregion Validate additional download type information

    // #region Verify the expected file was downloaded
    await this.waitForDownloadComplete(downloadId, timeout);
    const download = await this.clickDownloadFile(downloadId);

    let expectedFileName = `${downloadType}.${expectedFileExtention}`;
    if ((downloadType === "Intermediate Output Files") && await this.isFeatureFlagUser()) {
      expectedFileName = "result.zip"; // TODO: Remove when consistent between FF on and off
    }

    expect(download.suggestedFilename()).toMatch(expectedFileName);
    // #endregion Verify the expected file was downloaded
  };

  public async downloadCombinedMicrobiomeFileDownload(biomDownloadId, testTimeout = 120000) {
    // #region Open Downloads page, wait for the download to complete, and download file
    await this.navigateToDownloads();
    await this.waitForDownloadComplete(biomDownloadId, testTimeout);
    const download = await this.clickDownloadFile(biomDownloadId);
    const downloadPath = await download.path();
    const downloadFileName = download.suggestedFilename();
    // #endregion Open Downloads page and wait for the download to complete, and download file

    // #region Verify download file name and return file path
    expect(downloadFileName).toEqual(COMBINED_MICROBIOME_FILE_NAME);

    return downloadPath;
    // #endregion Verify download file name and return file path
  }
}
