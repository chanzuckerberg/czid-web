import * as fs from "fs/promises";
import * as path from "path";
import { WORKFLOWS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_NO_HOST_1,
  SAMPLE_FILE_NO_HOST_2,
} from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import AdmZip = require("adm-zip");
import moment = require("moment-timezone");
import * as tar from "tar";
import { ProjectPage } from "../../page-objects/project-page";

const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const NO_HOST_1 = "wgs_SARS_CoV2_no_host";
const NO_HOST_2 = "wgs_SARS_CoV2_no_host";
const WGS_SAMPLE_NAMES = [NO_HOST_1, NO_HOST_2];
const CONSENSUS_GENOME = "Consensus Genome";
const DATE_FORMAT = "YYYY-MM-DD";
const CONSENSUS_GENOME_OVERVIEW = "Consensus Genome Overview";
const UID_REGEX = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

const timeout = 60 * 1000 * 5;

/*
 * WGS - Downloads
 */
test.describe("WGS - Downloads | Functional: P-0", () => {
  test.beforeEach(async () => {
    test.setTimeout(timeout);
  });

  test("SNo 12: Consensus Genome (consensus.fa) - Separate files", async ({
    page,
  }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();

    const isFFUser = await projectPage.isFeatureFlagUser();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.WGS}`,
    );
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Select 1 or more samples in Sample list view
    const oneOrMoreSamples = Math.floor(Math.random() * 3) + 1;
    let selectedSamples = await projectPage.selectCompletedSamples(
      oneOrMoreSamples,
    );
    selectedSamples = selectedSamples.sort();

    let samples = await new SamplesPage(page).getSamples(project.name, selectedSamples);
    samples = samples.sort((a, b) => a.id - b.id);
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
    const today = moment().format(DATE_FORMAT);
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
    // #endregion 10. Click on Download File link and save the file (.tar.gz)

    // #region 11. Extract and open the fasta files (notepad suggested) and observe data displayed"
    if (!isFFUser) {
      expect(downloadFileName).toMatch(/\.tar\.gz$/);
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
    } else {
      expect(downloadFileName).toEqual("result.zip");

      const zip = new AdmZip(downloadPath);
      const zipContents = zip.getEntries();

      let zippedFileNames = [];
      for (const content of zipContents) {
        zippedFileNames.push(content.entryName);
      }
      zippedFileNames = zippedFileNames.sort();

      for (const i in selectedSamples) {
        // ({Sample_Name}_{UID}_consensus.fa) files format:
        expect(zippedFileNames[i]).toMatch(new RegExp(`${selectedSamples[i]}_${UID_REGEX}.fa`));

        const entry = zip.getEntry(zippedFileNames[i]);
        const lines = entry.getData().toString().split(/\r?\n/);

        // - First row displays ""> - {Sample name} in text format
        const fistLine = lines.shift();
        expect(fistLine).toMatch(`>${samples[i].name}`);

        const lastLine = lines[lines.length - 1];
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

  test("SNo 13: Consensus Genome (Consensus Genome.fa) - Single file (Concatenated)", async ({
    page,
  }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.WGS}`,
    );
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Select > 1 samples in Sample list view
    const moreThanOneSample = 3; // Math.floor(Math.random() * 3) + 2;
    let selectedSamples = await projectPage.selectCompletedSamples(
      moreThanOneSample,
    );
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
    const today = moment().format(DATE_FORMAT);
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
    const fileContent = await fs.readFile(downloadPath, { encoding: "utf-8" });
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
      expect(fistLine).toMatch(`>${selectedSamples[i]}`);

      const lastLine = lines[lines.length - 1];
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
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.WGS}`,
    );
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Select 1 or more samples in Sample list view
    const oneOrMoreSamples = Math.floor(Math.random() * 3) + 1;
    let selectedSamples = await projectPage.selectCompletedSamples(
      oneOrMoreSamples,
    );
    selectedSamples = selectedSamples.sort();
    // #endregion 3. Select 1 or more samples in Sample list view

    // #region 4. Click in Download button (cloud icon)
    await projectPage.clickDownloadButton();
    // #endregion 4. Click in Download button (cloud icon)

    // #region 5. Select Sample Metadata radio button
    await projectPage.clickDownloadType("Sample Metadata");
    // #endregion 5. Select Sample Metadata radio button

    // #region 6. Click Start Generating Download button
    const download =
      await projectPage.clickDownloadButtonForImmediateDownload();
    // #endregion 6. Click Start Generating Download button

    // #region 7. Verify that the download completes immediately
    // - DOWNLOAD FILE link works (file downloaded)
    const downloadPath = await download.path();

    // - sample_metadata.csv file contains Sample(s) selected
    const downloadFileName = download.suggestedFilename();
    expect(downloadFileName).toEqual("sample_metadata.csv");

    const fileContent = await fs.readFile(downloadPath, { encoding: "utf-8" });

    let lines = fileContent.split(/\r?\n/);

    const fistHeader = lines.shift().split(",")[0];
    expect(fistHeader).toEqual("sample_name");

    const lastLine = lines[lines.length - 1];
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
    // #endregion 7. Verify that the download completes immediately
  });

  test("SNo 15: Consensus Genome Overview (.csv)", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.WGS}`,
    );
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Select 1 or more samples in Sample list view
    const oneOrMoreSamples = Math.floor(Math.random() * 3) + 1;
    let selectedSamples = await projectPage.selectCompletedSamples(
      oneOrMoreSamples,
    );
    selectedSamples = selectedSamples.sort();
    // #endregion 3. Select 1 or more samples in Sample list view

    // #region 4. Click in Download button (cloud icon)
    await projectPage.clickDownloadButton();
    // #endregion 4. Click in Download button (cloud icon)

    // #region 5. Select Consensus Genome Overview radio button
    await projectPage.clickDownloadType(CONSENSUS_GENOME_OVERVIEW);
    // #endregion 5. Select Consensus Genome Overview radio button

    // #region 6. Click Start Generating Download button
    const download =
      await projectPage.clickDownloadButtonForImmediateDownload();
    // #endregion 6. Click Start Generating Download button

    // #region 7. Verify that the download completes immediately
    // - DOWNLOAD FILE link works (file downloaded)
    const downloadPath = await download.path();

    // - "consensus_genome_overview.csv" file contains Sample(s) selected
    const downloadFileName = download.suggestedFilename();
    expect(downloadFileName).toEqual("consensus_genome_overview.csv");

    const fileContent = await fs.readFile(downloadPath, { encoding: "utf-8" });
    let lines = fileContent.split(/\r?\n/);
    const fistHeader = lines.shift().split(",")[0];

    expect(fistHeader).toEqual("Sample Name");

    const lastLine = lines[lines.length - 1];
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
    // #endregion 7. Verify that the download completes immediately
  });

  test("SNo 16: Consensus Genome Overview (.csv) - Include sample metadata in this table", async ({
    page,
  }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.WGS}`,
    );
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Select 1 or more samples in Sample list view
    const oneOrMoreSamples = Math.floor(Math.random() * 3) + 1;
    let selectedSamples = await projectPage.selectCompletedSamples(
      oneOrMoreSamples,
    );
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
    const download =
      await projectPage.clickDownloadButtonForImmediateDownload();
    // #endregion 7. Click Start Generating Download button

    // #region 8. Verify that the download completes immediately
    // - DOWNLOAD FILE link works (file downloaded)
    const downloadPath = await download.path();

    // - "consensus_genome_overview.csv" file contains Sample(s) selected
    const downloadFileName = download.suggestedFilename();
    expect(downloadFileName).toEqual("consensus_genome_overview.csv");

    const fileContent = await fs.readFile(downloadPath, { encoding: "utf-8" });
    let lines = fileContent.split(/\r?\n/);
    const fistHeader = lines.shift().split(",")[0];

    expect(fistHeader).toEqual("Sample Name");

    const lastLine = lines[lines.length - 1];
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
    // #endregion 8. Verify that the download completes immediately
  });

  test("SNo 17: Intermediate Output Files", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();

    const isFFUser = await projectPage.isFeatureFlagUser();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.WGS}`,
    );
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Select 1 or more samples in Sample list view
    const oneOrMoreSamples = Math.floor(Math.random() * 3) + 1;
    let selectedSamples = await projectPage.selectCompletedSamples(
      oneOrMoreSamples,
    );
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
    const today = moment().format(DATE_FORMAT);
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

    if (!isFFUser) {
      expect(downloadFileName).toMatch(/\.tar\.gz$/);

      const downloadDirectory = path.dirname(downloadPath);
      const extractPath = path.join(downloadDirectory, `SNo17_${Date.now()}`);
      await fs.mkdir(extractPath, {recursive: true});
      await tar.x({
        file: downloadPath,
        cwd: extractPath,
      });
      const extractedContents = await fs.readdir(extractPath);

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
    } else {
      expect(downloadFileName).toEqual("result.zip");

      const zip = new AdmZip(downloadPath);
      const zipContents = zip.getEntries();

      const entries = [];
      const directories = [];
      for (const content of zipContents) {
        if (content.isDirectory) {
          const directoryName = content.entryName.split("/")[0];
          if (!directories.includes(directoryName)) {
            directories.push(directoryName);
          }
        } else {
          entries.push(content.entryName);
        }
      }
      directories.sort();

      // Each sample is zipped in it's own directory
      expect(selectedSamples.length).toEqual(directories.length);
      const expectedEntries = [];
      for (const i in selectedSamples) {

        // {Sample_Name}_{UID} directory format
        expect(directories[i]).toMatch(new RegExp(`${selectedSamples[i]}_${UID_REGEX}`));

        for (const expectedContent of expectedExtractedContents) {
          expectedEntries.push(`${directories[i]}/${expectedContent}`);
        }
      }

      // Verify the expected file are in the AdmZip entries
      expectedEntries.forEach(expectedFile => {
        expect(entries).toContain(expectedFile);
      });
    }
  });

  test("SNo 24: Download All - Sample report link", async ({ page }) => {
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject("SNo_WGS-22");
    await projectPage.deleteSamplesOlderThanGivenMonths(project, WORKFLOWS.WGS, 5);

    await setupSamples(
      page,
      project,
      WGS_SAMPLE_FILES,
      WGS_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      {
        hostOrganism: "Human",
        taxon: "Unknown",
        includeTrimPrimer: true,
        waitForPipeline: true
      },
    );

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select "x" project
    await projectPage.getProjectByName(project.name);
    // #endregion 2. At Project tab, select "x" project

    // #region 3. Select "Consensus Genomes" tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 3. Select "Consensus Genomes" tab

    // #region 4. Open ""no_host_1"" WGS sample report
    const sampleName = await projectPage.selectCompletedSamples(1);
    await projectPage.clickSample(sampleName[0]);
    const samplesPage = new SamplesPage(page);
    await samplesPage.clickConsensusGenomeTab();
    // #endregion 4. Open ""no_host_1"" WGS sample report

    // #region 5. Click on Download All button
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
      "no_host_2.fq.gz",
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
      `${sampleName}.muscle.out.fasta`,
    ];
    expectedContents = expectedContents.sort();
    expect(zippedFileNames).toEqual(expectedContents);
    // #endregion 7. Verify files included in the Zip package
  });
});
