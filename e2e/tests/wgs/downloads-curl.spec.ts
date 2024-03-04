import { exec } from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { WORKFLOWS } from "@e2e/constants/common";
import { test, expect } from "@playwright/test";
import moment = require("moment-timezone");
import { ProjectPage } from "../../page-objects/project-page";

const timeout = 60 * 1000 * 5;

/*
 * WGS - Downloads (CURL)
 */
test.describe("WGS - Downloads (CURL) | Functional: P-0", () => {

  test.beforeEach(async () => {
    test.setTimeout(timeout);
  });

  test("SNo 20: Sample Metadata (sample_metadata.csv) (CURL)", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.WGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Select 1 or more samples in Sample list view
    const oneOrMoreSamples = Math.floor(Math.random() * 3) + 1;
    let selectedSamples = await projectPage.selectCompletedSamples(oneOrMoreSamples);
    selectedSamples = selectedSamples.sort();
    // #endregion 3. Select 1 or more samples in Sample list view

    // #region 4. Click in Download button (cloud icon)
    await projectPage.clickDownloadButton();
    // #endregion 4. Click in Download button (cloud icon)

    // #region 5. Select Sample Metadata radio button
    await projectPage.clickDownloadType("Sample Metadata");
    // #endregion 5. Select Sample Metadata radio button

    // #region 6. Click Start Generating Download button
    const downloadId = await projectPage.clickStartGeneratingDownloadButton();
    // #endregion 6. Click Start Generating Download button

    // #region 7. Go to Downloads section (User menu)
    const downloadsPage = await projectPage.clickDownloadsLink();
    // #endregion 7. Go to Downloads section (User menu)

    // #region 8. Observe Download list latest record details
    // - Download file status as COMPLETE
    await downloadsPage.waitForDownloadComplete(downloadId, timeout);

    // - ""Sample Metadata"" name displayed
    const downloadName = await downloadsPage.getDownloadName(downloadId);
    expect(downloadName).toEqual("Sample Metadata");

    const downloadCount = await downloadsPage.getDownloadCount(downloadId);
    expect(downloadCount).toEqual(oneOrMoreSamples.toString());

    // - Download details displayed correctly
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickSamplesInDownloadDropdown();
    let samplesInDownload = await downloadsPage.getSamplesInDownloadNames();
    samplesInDownload = samplesInDownload.sort();
    expect(samplesInDownload).toEqual(selectedSamples);

    await downloadsPage.clickCloseIcon();
    // #endregion 8. Observe Download list latest record details

    // #region 9. Click on Details link and go to Advanced Download tab
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickAdvancedDownloadTab();
    // #endregion 9. Click on Details link and go to Advanced Download tab

    // #region 10. Click on clipboard icon
    const clipboardText = await downloadsPage.clickClipboardIcon();
    // #endregion 10. Click on clipboard icon

    // #region 11. Open a CMD/Terminal session and execute command in clipboard
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "SNo_20"));
    try {
      await new Promise((resolve, reject) => {
        exec(clipboardText, { cwd: tempDir }, (error, stdout) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(stdout);
        });
      });
      const filesInTempDir = await fs.readdir(tempDir);
      let downloadedTar = null;
      const extractedContents = [];
      for (const content of filesInTempDir) {
        if (content.endsWith(".tar.gz")) {
          downloadedTar = path.join(tempDir, content);
        } else {
          extractedContents.push(content);
        }
      }
      // - CURL command works (file(s) downloaded)
      expect(downloadedTar).not.toBeNull();
      expect(extractedContents.length).toBeGreaterThanOrEqual(1);

      for (const contents of extractedContents) {
        const extractedDir = path.join(tempDir, contents);
        const filesInExtractedDir = await fs.readdir(extractedDir);

        for (const extractedFile of filesInExtractedDir) {
          const pathToExtractedFile = path.join(extractedDir, extractedFile);
          const fileContent = await fs.readFile(pathToExtractedFile, {encoding: "utf-8"});

          let lines = fileContent.split(/\r?\n/);

          const fistHeader = lines.shift().split(",")[0];
          expect(fistHeader).toEqual("sample_name");

          const lastLine = lines[lines.length-1];
          if (lastLine.trim() === "") {
            lines.pop(); // Remove the last empty line
          }

          const samplesInDownload = [];
          lines = lines.sort();
          for (const i in lines) {
            const sampleName = lines[i].split(",")[0];
            samplesInDownload.push(sampleName);
          }
          // - (.tar.gz)  file contains Sample(s) selected"
          expect(samplesInDownload).toEqual(selectedSamples);
        }
      }
    } finally {
      await fs.rm(tempDir, {recursive: true, force: true});
    }
    // #endregion 11. Open a CMD/Terminal session and execute command in clipboard
  });

  test("SNo 23: Intermediate Output Files (CURL)", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.WGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Select 1 or more samples in Sample list view
    const oneOrMoreSamples = Math.floor(Math.random() * 3) + 1;
    let selectedSamples = await projectPage.selectCompletedSamples(oneOrMoreSamples);
    selectedSamples = selectedSamples.sort();
    // #endregion 3. Select 1 or more samples in Sample list view

    // #region 4. Click in Download button (cloud icon)
    await projectPage.clickDownloadButton();
    // #endregion 4. Click in Download button (cloud icon)

    // #region 5. Select Intermediate Output Files radio button
    await projectPage.clickDownloadType("Intermediate Output Files");
    // #endregion 5. Select Intermediate Output Files radio button

    // #region 6. Click Start Generating Download button
    const downloadId = await projectPage.clickStartGeneratingDownloadButton();
    // #endregion 6. Click Start Generating Download button

    // #region 7. Go to Downloads section (User menu)
    const downloadsPage = await projectPage.clickDownloadsLink();
    // #endregion 7. Go to Downloads section (User menu)

    // #region 8. Observe Download list latest record details
    // - Download file status as COMPLETE
    await downloadsPage.waitForDownloadComplete(downloadId, timeout);

    // - "Intermediate Output Files" name displayed
    const downloadName = await downloadsPage.getDownloadName(downloadId);
    expect(downloadName).toEqual("Intermediate Output Files");

    // - Download Date / Count is correct
    const downloadDate = await downloadsPage.getDownloadDate(downloadId);
    const today = moment().tz("America/Los_Angeles").format("YYYY-MM-DD");
    expect(downloadDate).toEqual(today);

    const downloadCount = await downloadsPage.getDownloadCount(downloadId);
    expect(downloadCount).toEqual(oneOrMoreSamples.toString());

    // - Download details displayed correctly
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickSamplesInDownloadDropdown();
    let samplesInDownload = await downloadsPage.getSamplesInDownloadNames();
    samplesInDownload = samplesInDownload.sort();
    expect(samplesInDownload).toEqual(selectedSamples);

    await downloadsPage.clickCloseIcon();
    // #endregion 8. Observe Download list latest record details

    // #region 9. Click on Details link and go to Advanced Download tab
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickAdvancedDownloadTab();
    // #endregion 9. Click on Details link and go to Advanced Download tab

    // #region 10. Click on clipboard icon
    const clipboardText = await downloadsPage.clickClipboardIcon();
    // #endregion 10. Click on clipboard icon

    // #region 11. Open a CMD/Terminal session and execute command in clipboard
    const expectedExtractedContents = [
      "aligned_reads.bam",
      "consensus.fa",
      "depths.png",
      "ercc_stats.txt",
      "report.tsv",
      "report.txt",
      "samtools_depth.txt",
      "stats.json",
      "variants.vcf.gz",
    ];
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "SNo_20"));
    try {
      await new Promise((resolve, reject) => {
        exec(clipboardText, { cwd: tempDir }, (error, stdout) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(stdout);
        });
      });
      const filesInTempDir = await fs.readdir(tempDir);
      let downloadedTar = null;
      const extractedContents = [];
      for (const content of filesInTempDir) {
        if (content.endsWith(".tar.gz")) {
          downloadedTar = path.join(tempDir, content);
        } else {
          extractedContents.push(content);
        }
      }
      expect(downloadedTar).not.toBeNull();
      expect(extractedContents.length).toBeGreaterThanOrEqual(1);

      for (const contents of extractedContents) {
        const extractedDir = path.join(tempDir, contents);
        const contentInExtractedDir = await fs.readdir(extractedDir);

        for (const extractedContent of contentInExtractedDir) {
          const pathToExtractedDir = path.join(extractedDir, extractedContent);

          let directoriesInExtractedDir = await fs.readdir(pathToExtractedDir);
          directoriesInExtractedDir = directoriesInExtractedDir.sort();

          for (const extractedDir of directoriesInExtractedDir) {
            const pathToNestedExtractedDir = path.join(pathToExtractedDir, extractedDir);
            const filesInNestedDir = await fs.readdir(pathToNestedExtractedDir);
            for (const expectedFile of expectedExtractedContents) {
              expect(filesInNestedDir).toContain(expectedFile);
            }
          }
        }
      }

    } finally {
      await fs.rm(tempDir, {recursive: true, force: true});
    }
    // #endregion 11. Open a CMD/Terminal session and execute command in clipboard
  });
});
