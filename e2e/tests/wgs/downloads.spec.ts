import * as fs from "fs/promises";
import * as path from "path";
import { WORKFLOWS } from "@e2e/constants/common";
import { SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2 } from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage } from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import AdmZip = require("adm-zip");
import moment = require("moment-timezone");
import * as tar from "tar";
import { ProjectPage } from "../../page-objects/project-page";

const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const NO_HOST_1 = "no_host_1";
const NO_HOST_2 = "no_host_2";
const WGS_SAMPLE_NAMES = [NO_HOST_1, NO_HOST_2];
const CONSENSUS_GENOME = "Consensus Genome";
const TIME_ZONE = "America/Los_Angeles";
const DATE_FORMAT = "YYYY-MM-DD";
const CONSENSUS_GENOME_OVERVIEW = "Consensus Genome Overview";

let project = null;
let projectPage = null;
const timeout = 60 * 1000 * 5;

/*
 * WGS - Downloads
 */
test.describe("WGS - Downloads | Functional: P-0", () => {

  test.beforeEach(async () => {
    test.setTimeout(timeout);
  });

  test("SNo 12: Consensus Genome (consensus.fa) - Separate files", async ({ page }) => {
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

    // #region 5. Select Consensus Genome radio button
    await projectPage.clickDownloadType(CONSENSUS_GENOME);
    // #endregion 5. Select Consensus Genome radio button

    // #region 6. Select Separate Files download format
    await projectPage.clickFilterDropdown();
    await projectPage.clickFilterOption("Separate Files");
    // #endregion 6. Select Separate Files download format

    // #region 7. Click Start Generating Download button
    const downloadId = await projectPage.clickStartGeneratingDownloadButton();
    // #endregion 7. Click Start Generating Download button

    // #region 8. Go to Downloads section (User menu)
    const downloadsPage = await projectPage.clickDownloadsLink();
    // #endregion 8. Go to Downloads section (User menu)

    // #region 9. Observe Download list latest record details
    // - Download file status as COMPLETE
    await downloadsPage.waitForDownloadComplete(downloadId, timeout);
    // #endregion 9. Observe Download list latest record details

    // #region 10. Click on Download File link and save the file (.tar.gz)
    // - DOWNLOAD FILE link works (file downloaded)
    const download = await downloadsPage.clickDownloadFile(downloadId);
    const downloadPath = await download.path();

    // - "CONSENSUS_GENOME" name displayed
    const downloadName = await downloadsPage.getDownloadName(downloadId);
    expect(downloadName).toEqual(CONSENSUS_GENOME);

    // - Download Date / Count is correct
    const downloadDate = await downloadsPage.getDownloadDate(downloadId);
    const today = moment().tz(TIME_ZONE).format(DATE_FORMAT);
    expect(downloadDate).toEqual(today);

    const downloadCount = await downloadsPage.getDownloadCount(downloadId);
    expect(downloadCount).toEqual(oneOrMoreSamples.toString());

    // - Download details displayed correctly
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickSamplesInDownloadDropdown();
    let samplesInDownload = await downloadsPage.getSamplesInDownloadNames();
    samplesInDownload = samplesInDownload.sort();
    expect(samplesInDownload).toEqual(selectedSamples);

    // - (.tar.gz) file contains Sample(s) selected
    const downloadFileName = download.suggestedFilename();
    expect(downloadFileName).toMatch(/\.tar\.gz$/);
    // #endregion 10. Click on Download File link and save the file (.tar.gz)

    // #region 11. Extract and open the fasta files (notepad suggested) and observe data displayed"
    const downloadDirectory = path.dirname(downloadPath);
    const extractPath = path.join(downloadDirectory, `SNo12_${Date.now()}`);
    await fs.mkdir(extractPath, {recursive: true});

    await tar.x({
      file: downloadPath,
      cwd: extractPath,
    });
    const extractedContents = await fs.readdir(extractPath);
    for (const contents of extractedContents) {

      const extractedDir = path.join(extractPath, contents);

      let files = await fs.readdir(extractedDir);
      files = files.sort();

      selectedSamples = selectedSamples.sort();

      for (const i in files) {
        const samplesPage = new SamplesPage(page);
        const samples = await samplesPage.getSamples(project.name, selectedSamples[i]);

        // ({Sample_Name}_{ID}_consensus.fa) files format:
        expect(files[i]).toEqual(`${selectedSamples[i]}_${samples[0].id}_consensus.fa`);

        const extractedFilePath = path.join(extractedDir, files[i]);
        const fileContent = await fs.readFile(extractedFilePath, {encoding: "utf-8"});
        const lines = fileContent.split(/\r?\n/);

        // - First row displays ""> - {Sample name} in text format
        const fistLine = lines.shift();
        expect(fistLine).toMatch(`>${samples[0].name}`);

        const lastLine = lines[lines.length-1];
        if (lastLine.trim() === "") {
          lines.pop(); // Remove the last empty line
        }
        // There should be at least 1 line, minus the first ">{ID}_{Description}" line and last empty line
        expect(lines.length).toBeGreaterThanOrEqual(1);

        // - Sequences displayed in ACGTN chain character format
        for (const line of lines) {
          expect(line).toMatch(/^[ACGTNRYKMSWBDHV]+$/); // https://en.wikipedia.org/wiki/FASTA_format
        }
      }
    }
    // #endregion 11. Extract and open the fasta files (notepad suggested) and observe data displayed"
  });

  test("SNo 13: Consensus Genome (Consensus Genome.fa) - Single file (Concatenated)", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.WGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Select > 1 samples in Sample list view
    const moreThanOneSample = 3; // Math.floor(Math.random() * 3) + 2;
    let selectedSamples = await projectPage.selectCompletedSamples(moreThanOneSample);
    selectedSamples = selectedSamples.sort();
    // #endregion 3. Select > 1 samples in Sample list view

    // #region 4. Click in Download button (cloud icon)
    await projectPage.clickDownloadButton();
    // #endregion 4. Click in Download button (cloud icon)

    // #region 5. Select Consensus Genome radio button
    await projectPage.clickDownloadType(CONSENSUS_GENOME);
    // #endregion 5. Select Consensus Genome radio button

    // #region 6. Select Single file (Concatenated) format
    await projectPage.clickFilterDropdown();
    await projectPage.clickFilterOption("Single file (Concatenated)");
    // #endregion 6. Select Single file (Concatenated) format

    // #region 7. Click Start Generating Download button
    const downloadId = await projectPage.clickStartGeneratingDownloadButton();
    // #endregion 7. Click Start Generating Download button

    // #region 8. Go to Downloads section (User menu)
    const downloadsPage = await projectPage.clickDownloadsLink();
    // #endregion 8. Go to Downloads section (User menu)

    // #region 9. Observe Download list latest record details
    // - Download file status as COMPLETE
    await downloadsPage.waitForDownloadComplete(downloadId, timeout);
    // #endregion 9. Observe Download list latest record details

    // #region 10. Click on Download File link and save the file (.fa)
    // - DOWLOAD FILE link works (file downloaded)
    const download = await downloadsPage.clickDownloadFile(downloadId);
    const downloadPath = await download.path();

    // - (.fa) file contains Sample(s) selected (concatenated)
    const downloadFileName = download.suggestedFilename();
    expect(downloadFileName).toMatch(/\.fa$/);

    // - "CONSENSUS_GENOME" name displayed
    const downloadName = await downloadsPage.getDownloadName(downloadId);
    expect(downloadName).toEqual(CONSENSUS_GENOME);

    // - Download Date / Count is correct
    const downloadDate = await downloadsPage.getDownloadDate(downloadId);
    const today = moment().tz(TIME_ZONE).format(DATE_FORMAT);
    expect(downloadDate).toEqual(today);
    const downloadCount = await downloadsPage.getDownloadCount(downloadId);
    expect(downloadCount).toEqual(moreThanOneSample.toString());

    // - Download details displayed correctly
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickSamplesInDownloadDropdown();
    let samplesInDownload = await downloadsPage.getSamplesInDownloadNames();
    samplesInDownload = samplesInDownload.sort();
    expect(samplesInDownload).toEqual(selectedSamples);
    // #endregion 10. Click on Download File link and save the file (.fa)

    // #region 11. Open the fasta file (notepad suggested) and observe data displayed
    const fileContent = await fs.readFile(downloadPath, {encoding: "utf-8"});
    const splitContents = fileContent.trim().split(/>/);
    let acgtnContents = [];
    for (const content of splitContents) {
      if (content.trim() !== "") {
        acgtnContents.push(`>${content}`);
      }
    }
    acgtnContents = acgtnContents.sort();

    // - [N] amount of sample names selected are included in CG.fa file starting with "">"" character
    expect(selectedSamples.length).toEqual(acgtnContents.length);

    for (const i in acgtnContents) {
      const lines = acgtnContents[i].split(/\r?\n/);

      // - First row displays ""> - {Sample name} in text format
      const fistLine = lines.shift();
      expect(fistLine).toMatch(`>${selectedSamples[i]}_`);

      const lastLine = lines[lines.length-1];
      if (lastLine.trim() === "") {
        lines.pop(); // Remove the last empty line
      }
      // There should be at least 1 line, minus the first ">{ID}_{Description}" line and last empty line
      expect(lines.length).toBeGreaterThanOrEqual(1);

      // - Sequences displayed in ACGTN chain character format
      for (const line of lines) {
        expect(line).toMatch(/^[ACGTNRYKMSWBDHV]+$/); // https://en.wikipedia.org/wiki/FASTA_format
      }
    }
    // #endregion 11. Open the fasta file (notepad suggested) and observe data displayed
  });

  test("SNo 14: Sample Metadata (sample_metadata.csv)", async ({ page }) => {
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
    // #endregion 8. Observe Download list latest record details

    // #region 9. Click on Download File link and save the file (.tar.gz)
    // - DOWNLOAD FILE link works (file downloaded)
    const download = await downloadsPage.clickDownloadFile(downloadId);
    const downloadPath = await download.path();

    // - ""Sample Metadata"" name displayed
    const downloadName = await downloadsPage.getDownloadName(downloadId);
    expect(downloadName).toEqual("Sample Metadata");

    // - Download Date / Count is correct
    const downloadDate = await downloadsPage.getDownloadDate(downloadId);
    const today = moment().tz(TIME_ZONE).format(DATE_FORMAT);
    expect(downloadDate).toEqual(today);
    const downloadCount = await downloadsPage.getDownloadCount(downloadId);
    expect(downloadCount).toEqual(oneOrMoreSamples.toString());

    // - Download details displayed correctly
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickSamplesInDownloadDropdown();
    let samplesInDownload = await downloadsPage.getSamplesInDownloadNames();
    samplesInDownload = samplesInDownload.sort();
    expect(samplesInDownload).toEqual(selectedSamples);

    // - (.tar.gz)  file contains Sample(s) selected
    const downloadFileName = download.suggestedFilename();
    expect(downloadFileName).toMatch(/\.tar\.gz$/);

    const downloadDirectory = path.dirname(downloadPath);
    const extractPath = path.join(downloadDirectory, `SNo14_${Date.now()}`);
    await fs.mkdir(extractPath, {recursive: true});
    await tar.x({
      file: downloadPath,
      cwd: extractPath,
    });
    const extractedContents = await fs.readdir(extractPath);

    for (const contents of extractedContents) {
      const extractedFile = path.join(extractPath, contents);
      const fileContent = await fs.readFile(extractedFile, {encoding: "utf-8"});

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
      expect(samplesInDownload).toEqual(selectedSamples);
    }
    // #endregion 9. Click on Download File link and save the file (.tar.gz)
  });

  // https://czi-sci.slack.com/archives/C05NKGCD2E8/p1708024084043239?thread_ts=1707760675.695619&cid=C05NKGCD2E8
  test.skip("SNo 15: Consensus Genome Overview (.csv)", async ({ page }) => {
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

    // #region 5. Select Consensus Genome Overview radio button
    await projectPage.clickDownloadType(CONSENSUS_GENOME_OVERVIEW);
    // #endregion 5. Select Consensus Genome Overview radio button

    // #region 6. Click Start Generating Download button
    const downloadId = await projectPage.clickStartGeneratingDownloadButton();
    // #endregion 6. Click Start Generating Download button

    // #region 7. Go to Downloads section (User menu)
    const downloadsPage = await projectPage.clickDownloadsLink();
    // #endregion 7. Go to Downloads section (User menu)

    // #region 8. Observe Download list latest record details
    // - Download file status as COMPLETE
    await downloadsPage.waitForDownloadComplete(downloadId, timeout);
    // #endregion 8. Observe Download list latest record details

    // #region 9. Click on Download File link and save the file (.tar.gz)
    // - DOWNLOAD FILE link works (file downloaded)
    const download = await downloadsPage.clickDownloadFile(downloadId);
    const downloadPath = await download.path();

    // - "CONSENSUS_GENOME_OVERVIEW" name displayed
    const downloadName = await downloadsPage.getDownloadName(downloadId);
    expect(downloadName).toEqual(CONSENSUS_GENOME_OVERVIEW);

    // - Download Date / Count is correct
    const downloadDate = await downloadsPage.getDownloadDate(downloadId);
    const today = moment().tz(TIME_ZONE).format(DATE_FORMAT);
    expect(downloadDate).toEqual(today);

    const downloadCount = await downloadsPage.getDownloadCount(downloadId);
    expect(downloadCount).toEqual(oneOrMoreSamples.toString());

    // - Download details displayed correctly
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickSamplesInDownloadDropdown();
    let samplesInDownload = await downloadsPage.getSamplesInDownloadNames();
    samplesInDownload = samplesInDownload.sort();
    expect(samplesInDownload).toEqual(selectedSamples);

    // - (.tar.gz)  file contains Sample(s) selected"
    const downloadFileName = download.suggestedFilename();
    expect(downloadFileName).toMatch(/\.tar\.gz$/);

    const downloadDirectory = path.dirname(downloadPath);
    const extractPath = path.join(downloadDirectory, `SNo15_${Date.now()}`);
    await fs.mkdir(extractPath, {recursive: true});
    await tar.x({
      file: downloadPath,
      cwd: extractPath,
    });
    const extractedContents = await fs.readdir(extractPath);

    for (const contents of extractedContents) {
      const extractedFile = path.join(extractPath, contents);
      const fileContent = await fs.readFile(extractedFile, {encoding: "utf-8"});

      let lines = fileContent.split(/\r?\n/);

      const fistHeader = lines.shift().split(",")[0];
      expect(fistHeader).toEqual("Sample Name");

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
      expect(samplesInDownload).toEqual(selectedSamples);
    }
    // #endregion 9. Click on Download File link and save the file (.tar.gz)
  });

  // https://czi-sci.slack.com/archives/C05NKGCD2E8/p1708024084043239?thread_ts=1707760675.695619&cid=C05NKGCD2E8
  test.skip("SNo 16: Consensus Genome Overview (.csv) - Include sample metadata in this table", async ({ page }) => {
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

    // #region 5. Select Consensus Genome Overview radio button
    await projectPage.clickDownloadType(CONSENSUS_GENOME_OVERVIEW);
    // #endregion 5. Select Consensus Genome Overview radio button

    // #region 6. Check on Include sample metadata in this table checkbox
    await projectPage.clickIncludeSampleMetadata();
    // #endregion 6. Check on Include sample metadata in this table checkbox

    // #region 7. Click Start Generating Download button
    const downloadId = await projectPage.clickStartGeneratingDownloadButton();
    // #endregion 7. Click Start Generating Download button

    // #region 8. Go to Downloads section (User menu)
    const downloadsPage = await projectPage.clickDownloadsLink();
    // #endregion 8. Go to Downloads section (User menu)

    // #region 9. Observe Download list latest record details
    // - Download file status as COMPLETE
    await downloadsPage.waitForDownloadComplete(downloadId, timeout);

    // - "CONSENSUS_GENOME_OVERVIEW" name displayed
    const downloadName = await downloadsPage.getDownloadName(downloadId);
    expect(downloadName).toEqual(CONSENSUS_GENOME_OVERVIEW);

    // - Download Date / Count is correct
    const downloadDate = await downloadsPage.getDownloadDate(downloadId);
    const today = moment().tz(TIME_ZONE).format(DATE_FORMAT);
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
    // #endregion 9. Observe Download list latest record details

    // #region 10. Click on Download File link and save the file (.tar.gz)
    // - DOWNLOAD FILE link works (file downloaded)
    const download = await downloadsPage.clickDownloadFile(downloadId);
    const downloadPath = await download.path();

    // - (.tar.gz)  file contains Sample(s) selected
    const downloadFileName = download.suggestedFilename();
    expect(downloadFileName).toMatch(/\.tar\.gz$/);

    const downloadDirectory = path.dirname(downloadPath);
    const extractPath = path.join(downloadDirectory, `SNo16_${Date.now()}`);
    await fs.mkdir(extractPath, {recursive: true});
    await tar.x({
      file: downloadPath,
      cwd: extractPath,
    });
    const extractedContents = await fs.readdir(extractPath);

    for (const contents of extractedContents) {
      const extractedFile = path.join(extractPath, contents);
      const fileContent = await fs.readFile(extractedFile, {encoding: "utf-8"});

      let lines = fileContent.split(/\r?\n/);

      const fistHeader = lines.shift().split(",")[0];
      expect(fistHeader).toEqual("Sample Name");

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
      expect(samplesInDownload).toEqual(selectedSamples);
    }
    // #endregion 10. Click on Download File link and save the file (.tar.gz)
  });

  test("SNo 17: Intermediate Output Files", async ({ page }) => {
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
    // #endregion 8. Observe Download list latest record details

    // 9. Click on Download File link and save the file (.tar.gz)
    // - DOWNLOAD FILE link works (file downloaded)
    const download = await downloadsPage.clickDownloadFile(downloadId);
    const downloadPath = await download.path();

    // - ""Intermediate Output Files"" name displayed
    const downloadName = await downloadsPage.getDownloadName(downloadId);
    expect(downloadName).toEqual("Intermediate Output Files");

    // - Download Date / Count is correct
    const downloadDate = await downloadsPage.getDownloadDate(downloadId);
    const today = moment().tz(TIME_ZONE).format(DATE_FORMAT);
    expect(downloadDate).toEqual(today);

    const downloadCount = await downloadsPage.getDownloadCount(downloadId);
    expect(downloadCount).toEqual(oneOrMoreSamples.toString());

    // - Download details displayed correctly
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickSamplesInDownloadDropdown();
    let samplesInDownload = await downloadsPage.getSamplesInDownloadNames();
    samplesInDownload = samplesInDownload.sort();
    expect(samplesInDownload).toEqual(selectedSamples);

    // - (.tar.gz)  file contains Intermediate output files from Sample(s) selected
    const downloadFileName = download.suggestedFilename();
    expect(downloadFileName).toMatch(/\.tar\.gz$/);

    const downloadDirectory = path.dirname(downloadPath);
    const extractPath = path.join(downloadDirectory, `SNo17_${Date.now()}`);
    await fs.mkdir(extractPath, {recursive: true});
    await tar.x({
      file: downloadPath,
      cwd: extractPath,
    });
    const extractedContents = await fs.readdir(extractPath);

    const expectedExtractedContents = [
      "aligned_reads.bam",
      "consensus.fa",
      "depths.png",
      "ercc_stats.txt",
      "no_host_1.fq.gz",
      "no_host_2.fq.gz",
      "primertrimmed.bam",
      "primertrimmed.bam.bai",
      "report.tsv",
      "report.txt",
      "samtools_depth.txt",
      "stats.json",
      "variants.vcf.gz",
    ];
    for (const contents of extractedContents) {
      const extractedDir = path.join(extractPath, contents);

      let directories = await fs.readdir(extractedDir);
      directories = directories.sort();

      for (const i in directories) {
        const samplesPage = new SamplesPage(page);
        const samples = await samplesPage.getSamples(project.name, selectedSamples[i]);

        // {Sample_Name}_{ID}_ files format:
        expect(directories).toContain(`${selectedSamples[i]}_${samples[0].id}_`);

        const extractedDirPath = path.join(extractedDir, directories[i]);
        let extractedFiles = await fs.readdir(extractedDirPath);
        extractedFiles = extractedFiles.sort();
        for (const expectedFile of expectedExtractedContents) {
          expect(extractedFiles).toContain(expectedFile);
        }
      }
    }
  });

  test("SNo 24: Download All - Sample report link", async ({ page }) => {
    await runPipelineIfNeeded(page, "Test_SNo_24", "Human", "Unknown");

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select "x" project
    await projectPage.getProjectByName(project.name);
    // #endregion 2. At Project tab, select "x" project

    // #region 3. Select "Consensus Genomes" tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 3. Select "Consensus Genomes" tab

    // #region 4. Open ""no_host_1"" WGS sample report
    await projectPage.clickSample(NO_HOST_1);
    // #endregion 4. Open ""no_host_1"" WGS sample report

    // #region 5. Click on Download All button
    const samplesPage = new SamplesPage(page);

    // - Download All button works ((.zip) file downloaded)
    const download = await samplesPage.clickDownloadAllButton();
    // #endregion 5. Click on Download All button

    // #region 6. Save (.zip) file and open its content
    const downloadPath = await download.path();

    const zip = await new AdmZip(downloadPath);
    const zipContents = await zip.getEntries();
    // #endregion 6. Save (.zip) file and open its content

    // #region 7. Verify files included in the Zip package
    let zippedFileNames = [];
    for (const content of zipContents) {
      zippedFileNames.push(await content.entryName);
    }
    zippedFileNames = zippedFileNames.sort();

    // - (.zip) file contains Analysis output files
    let expectedContents = [
      "no_host_1.fq.gz",
      "Primer_K.bed",
      "consensus_TEST_SC2.fa",
      "consensus.fa",
      "depths.png",
      "primertrimmed.bam",
      "primertrimmed.bam.bai",
      "report.txt",
      "report.tsv",
      "aligned_reads.bam",
      "ercc_stats.txt",
      "stats.json",
      "samtools_depth.txt",
      "variants.vcf.gz",
      "no_host_1.muscle.out.fasta",
    ];
    expectedContents = expectedContents.sort();
    expect(zippedFileNames).toEqual(expectedContents);
    // #endregion 7. Verify files included in the Zip package
  });
});

async function runPipelineIfNeeded(page: any, projectName: string, hostOrganism: string, taxon: string) {
  projectPage = new ProjectPage(page);
  project = await projectPage.getOrCreateProject(projectName);
  const samplesPage = new SamplesPage(page);

  let samples = [];
  let ranPipeline = false;
  const noHostSample1 = await samplesPage.getSamples(project.name, WGS_SAMPLE_NAMES[0]);
  const noHostSample2 = await samplesPage.getSamples(project.name, WGS_SAMPLE_NAMES[1]);
  if (noHostSample1.length <= 0 && noHostSample2.length <= 0) {
    test.setTimeout(60 * 1000 * 20); // Inclease the test runtime to let the piepline run

    const uploadPage = new UploadPage(page);
    const inputs = await uploadPage.getRandomizedSampleInputs(WGS_SAMPLE_FILES, WGS_SAMPLE_NAMES);
    for (const sampleName of WGS_SAMPLE_NAMES) {
      inputs[sampleName].hostOrganism = hostOrganism;
    }
    await uploadPage.e2eCSVSampleUpload(WGS_SAMPLE_FILES, project, WORKFLOWS.WGS, inputs, true, taxon);
    samples = await samplesPage.getSamples(project.name, WGS_SAMPLE_NAMES[1]);
    ranPipeline = true;
  }

  if (ranPipeline) {
    await samplesPage.waitForReportComplete(samples[0].id); // Wait for the last report to finish
  }
}
