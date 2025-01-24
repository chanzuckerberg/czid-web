import { exec } from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { WORKFLOWS } from "@e2e/constants/common";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { test, expect } from "@playwright/test";
import moment = require("moment-timezone");
import { ProjectPage } from "../../page-objects/project-page";
const CONSENSUS_GENOME = "Consensus Genome";

const timeout = 60 * 1000 * 5;

/*
 * Viral CG (WGS) - Downloads (CURL)
 */
test.describe("Viral CG (WGS) - Downloads (CURL) | Functional: P-2", () => {
  test.beforeEach(async () => {
    test.setTimeout(timeout);
  });

  test("SNo 16: Consensus Genome (consensus.fa) - Separate files (CURL)", async ({
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
    let sampleNames = await projectPage.selectCompletedSamples(
      oneOrMoreSamples,
    );
    sampleNames = sampleNames.sort();

    const samplesPage = new SamplesPage(page);
    const samples = await samplesPage.getSamples(project.name, sampleNames);
    samples.sort();
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
    await downloadsPage.waitForDownloadComplete(downloadId, timeout);

    // - ""Consensus Genome"" name displayed
    const downloadName = await downloadsPage.getDownloadName(downloadId);
    expect(downloadName).toEqual(CONSENSUS_GENOME);

    // - Download Date / Count is correct
    const downloadDate = await downloadsPage.getDownloadDate(downloadId);
    const today = moment().format("YYYY-MM-DD");
    expect(downloadDate).toEqual(today);

    // - Download file status as COMPLETE
    await downloadsPage.waitForDownloadComplete(downloadId, timeout);

    // - Download details displayed correctly
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickSamplesInDownloadDropdown();
    let samplesInDownload = await downloadsPage.getSamplesInDownloadNames();
    samplesInDownload = samplesInDownload.sort();
    expect(samplesInDownload).toEqual(sampleNames);

    await downloadsPage.clickCloseIcon();
    // #endregion 9. Observe Download list latest record details

    // #region 10. Click on Details link and go to Advanced Download tab
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickAdvancedDownloadTab();
    // #endregion 10. Click on Details link and go to Advanced Download tab

    // #region 11. Click on clipboard icon
    const clipboardText = await downloadsPage.clickClipboardIcon();
    // #endregion 11. Click on clipboard icon

    // #region 12. Open a CMD/Terminal session and execute command in clipboard (remember storing folder path)
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "SNo_16_P2"));
    // #endregion 12. Open a CMD/Terminal session and execute command in clipboard (remember storing folder path)

    // #region 13. Open storing folder, open the fasta files (notepad suggested) and observe data displayed
    const isFFUser = await downloadsPage.isFeatureFlagUser();
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
        const contentInExtractedDir = await fs.readdir(extractedDir);

        for (const extractedContent of contentInExtractedDir.sort()) {
          const pathToExtractedContent = path.join(
            extractedDir,
            extractedContent,
          );

          // - (.tar.gz) file contains Sample(s) selected
          for (const i in sampleNames) {
            let extractedFilePath = "";
            if (!isFFUser) {
              const extrectedFiles = (
                await fs.readdir(pathToExtractedContent)
              ).sort();

              // ({Sample_Name}_{ID}_consensus.fa) files format:
              const expectedSampleFile = `${sampleNames[i]}_${samples[i].id}_consensus.fa`;
              expect(extrectedFiles[i]).toEqual(expectedSampleFile);

              // {pathTo}/{projectFolder}/{Sample_Name}_{ID}_consensus.fa
              extractedFilePath = path.join(
                pathToExtractedContent,
                extrectedFiles[i],
              );
            } else {
              // ({Sample_Name}_{UID}.fa) files format:
              const uid_regex =
                "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
              expect(extractedContent).toMatch(
                new RegExp(`^${sampleNames[i]}_${uid_regex}.fa`),
              );

              // {pathTo}/{Sample_Name}_{UID}.fa
              extractedFilePath = pathToExtractedContent;
            }

            const fileContent = await fs.readFile(extractedFilePath, {
              encoding: "utf-8",
            });

            const lines = fileContent.split(/\r?\n/);

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
      }
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
    // #endregion 13. Open storing folder, open the fasta files (notepad suggested) and observe data displayed
  });

  test("SNo 17: Consensus Genome (Consensus Genome.fa) - Single file (Concatenated) (CURL)", async ({
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

    // #region 3. Select >1 samples in Sample list view
    const oneOrMoreSamples = Math.floor(Math.random() * 3) + 1;
    let sampleNames = await projectPage.selectCompletedSamples(
      oneOrMoreSamples,
    );
    sampleNames = sampleNames.sort();

    const samplesPage = new SamplesPage(page);
    const samples = await samplesPage.getSamples(project.name, sampleNames);
    samples.sort();
    // #endregion 3. Select >1 samples in Sample list view

    // #region 4. Click in Download button (cloud icon)
    await projectPage.clickDownloadButton();
    // #endregion 4. Click in Download button (cloud icon)

    // #region 5. Select Consensus Genome radio button
    await projectPage.clickDownloadType(CONSENSUS_GENOME);
    // #endregion 5. Select Consensus Genome radio button

    // #region 6. Select Single file (Concatenated) download format
    await projectPage.clickFilterDropdown();
    await projectPage.clickFilterOption("Single file (Concatenated)");
    // #endregion 6. Select Single file (Concatenated) download format

    // #region 7. Click Start Generating Download button
    const downloadId = await projectPage.clickStartGeneratingDownloadButton();
    // #endregion 7. Click Start Generating Download button

    // #region 8. Go to Downloads section (User menu)
    const downloadsPage = await projectPage.clickDownloadsLink();
    // #endregion 8. Go to Downloads section (User menu)

    // #region 9. Observe Download list latest record details
    await downloadsPage.waitForDownloadComplete(downloadId, timeout);

    // - ""Consensus Genome"" name displayed
    const downloadName = await downloadsPage.getDownloadName(downloadId);
    expect(downloadName).toEqual(CONSENSUS_GENOME);

    // - Download Date / Count is correct
    const downloadDate = await downloadsPage.getDownloadDate(downloadId);
    const today = moment().format("YYYY-MM-DD");
    expect(downloadDate).toEqual(today);

    // - Download file status as COMPLETE
    await downloadsPage.waitForDownloadComplete(downloadId, timeout);

    // - Download details displayed correctly
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickSamplesInDownloadDropdown();
    let samplesInDownload = await downloadsPage.getSamplesInDownloadNames();
    samplesInDownload = samplesInDownload.sort();
    expect(samplesInDownload).toEqual(sampleNames);

    await downloadsPage.clickCloseIcon();
    // #endregion 9. Observe Download list latest record details

    // #region 10. Click on Details link and go to Advanced Download tab
    await downloadsPage.clickDownloadDetails(downloadId);
    await downloadsPage.clickAdvancedDownloadTab();
    // #endregion 10. Click on Details link and go to Advanced Download tab

    // #region 11. Click on clipboard icon
    const clipboardText = await downloadsPage.clickClipboardIcon();
    // #endregion 11. Click on clipboard icon

    // #region 12. Open a CMD/Terminal session and execute command in clipboard (remember storing folder path)
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "SNo_17_P2"));
    // #endregion 12. Open a CMD/Terminal session and execute command in clipboard (remember storing folder path)

    // #region 13. Open the fasta file (notepad suggested) and observe data displayed
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

      // - CURL command works (file(s) downloaded)
      expect(filesInTempDir.length).toEqual(1);

      // Per each ">" split the file into acgtnContents. Each section is a sample
      const fileContent = await fs.readFile(
        path.join(tempDir, filesInTempDir[0]),
        { encoding: "utf-8" },
      );
      const splitContents = fileContent.trim().split(/>/);
      let acgtnContents = [];
      for (const content of splitContents) {
        if (content.trim() !== "") {
          acgtnContents.push(`>${content}`);
        }
      }
      acgtnContents = acgtnContents.sort();

      // - [N] amount of sample names selected are included in CG.fa file starting with "">"" character
      expect(sampleNames.length).toEqual(acgtnContents.length);

      // - (.fa) file contains Sample(s) selected (concatenated)
      for (const i in acgtnContents) {
        const lines = acgtnContents[i].split(/\r?\n/);

        // - First row displays ""> - {Sample name} in text format
        const fistLine = lines.shift();
        expect(fistLine).toMatch(`>${sampleNames[i]}`);

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
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
    // #endregion 13. Open the fasta file (notepad suggested) and observe data displayed
  });
});
