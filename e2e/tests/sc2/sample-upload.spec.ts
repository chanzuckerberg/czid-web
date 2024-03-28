import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import { SAMPLE_1_PAIRED_R1, SAMPLE_1_PAIRED_R2 } from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage } from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import { kebabCase } from "lodash";
import { ProjectPage } from "../../page-objects/project-page";

const SAMPLE_FILES = [SAMPLE_1_PAIRED_R1, SAMPLE_1_PAIRED_R2];
const SAMPLE_1_PAIRED = "Sample_1_Paired";
const SAMPLE_NAMES = [SAMPLE_1_PAIRED];
const UPLOAD_COMPLETE_LITERAL = "Uploads completed!";
const WAIT_FOR_PIPELINE = true;

// AUTOMATION COMMENT:
// We need to run this Illumina TC with different Wetlab Protocol:
const WET_LABS = ["ARTIC v4/ARTIC v4.1", "ARTIC v5.3.2", "ARTIC v3",
"ARTIC v3 - Short Amplicons (275 bp)", "MSSPE", "Combined MSSPE & ARTIC v3",
"SNAP", "AmpliSeq", "COVIDseq", "VarSkip", "Midnight", "Easyseq"];

let TEST_TIMEOUT = 60 * 1000 * 5;


/*
 * Sample upload (web)
 */
test.describe("Sample upload (web): Functional: P-0", () => {

  for (const wetLab of WET_LABS) {
    test(`SNo 1: SARS-CoV-2 Illumina sample web upload with wetlab ${wetLab}`, async ({ page }) => {
      test.setTimeout(TEST_TIMEOUT);

      // #region 1. Login to CZ ID staging
      const projectPage = new ProjectPage(page);
      await projectPage.navigateToMyData();
      // #endregion 1. Login to CZ ID staging

      // #region 2. Click on Upload
      await projectPage.clickUploadHeaderLink();
      // #endregion 2. Click on Upload

      // #region 3. Select a project and check "SARS-CoV-2 Consensus Genome" Analysis Type checkbox
      const project = await projectPage.getOrCreateProject(`Wetlab_${kebabCase(wetLab)}`);

      const uploadPage = new UploadPage(page);
      await uploadPage.selectProject(project.name);
      await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.SC2);
      // #endregion 3. Select a project and check "SARS-CoV-2 Consensus Genome" Analysis Type checkbox

      // #region 4. Select "Illumina" radio button
      await uploadPage.clickSequencingPlatform(SEQUENCING_PLATFORMS.MNGS);
      // #endregion 4. Select "Illumina" radio button

      // #region 5. Select "ARTIC v3" Wetlab Protocol from dropdown list
      await uploadPage.setWetLabFilter(wetLab);
      // #endregion 5. Select "ARTIC v3" Wetlab Protocol from dropdown list

      // #region 6. Select Sample files and click on Continue (see Data section)
      await uploadPage.uploadSampleFiles(SAMPLE_FILES);
      await uploadPage.clickContinue();
      // #endregion 6. Select Sample files and click on Continue (see Data section)

      // #region 7. Enter required Metadata and click on Continue
      let inputs = await uploadPage.getRandomizedSampleInputs(SAMPLE_FILES, SAMPLE_NAMES);
      inputs = await uploadPage.setManualInputs(inputs);
      await uploadPage.clickContinue();
      // #endregion 7. Enter required Metadata and click on Continue

      // #region 8. Check on Terms and Privacy policies checkbox and click Start Upload
      await uploadPage.clickTermsAgreementCheckbox();
      await uploadPage.clickStartUploadButton();
      await uploadPage.waitForUploadComplete();

      // Uploading screen displays with:
      // - Upload progress bar(s) completed
      // - Sent to Pipeline status displayed
      // - Uploads completed! message displayed
      // - Go to Project button enabled / displayed
      let sampleNames = Object.keys(inputs);
      for (const sampleName of sampleNames) {
        const hostSentToPipeline = await uploadPage.waitForSampleSentToPipeline(sampleName);
        expect(hostSentToPipeline).toBeTruthy();

        const hostUploadProgress = await uploadPage.getSampleUploadProgress(sampleName);
        expect(hostUploadProgress).toEqual(100);
      }
      const uploadWindowTitle = await uploadPage.getUploadWindowTitle();
      expect(uploadWindowTitle).toEqual(UPLOAD_COMPLETE_LITERAL);

      const goToProjectButtonEnabled = await uploadPage.isGoToProjectButtonEnabled();
      expect(goToProjectButtonEnabled).toBeTruthy();
      // #endregion 8. Check on Terms and Privacy policies checkbox and click Start Upload

      // #region 9. Click on Go to Project in Uploads completed! page
      await uploadPage.clickGoToProjectButton();
      // #endregion 9. Click on Go to Project in Uploads completed! page

      // #region 10. Click on Sample row and observe
      const samplesPage = new SamplesPage(page);

      await projectPage.scrollDownToSample(sampleNames[0]);
      await projectPage.clickSample(sampleNames[0]);

      // - Sample report displays "In Progress. Your Consensus Genome is being generated!" until completion
      const sampleStatusMessage = await samplesPage.getSampleStatusMessage("IN PROGRESS");

      const expectedMessage = "IN PROGRESSYour Consensus Genome is being generated!Learn about Consensus Genomes";
      expect(sampleStatusMessage).toEqual(expectedMessage);
      // #endregion 10. Click on Sample row and observe

      // #region 11. Go back to project and observe Sample status until it Completes
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);

      // At Project Sample view list:
      // - Sample statuses go from Created (grey) - Running (grey) - Complete (green)
      let samplesTable = await projectPage.getSamplesTableOrderedByName();
      for (const sampleName of sampleNames) {
        expect(samplesTable[sampleName]["Sample"][1]).toEqual("RUNNING");
      }

      if (WAIT_FOR_PIPELINE) {
        TEST_TIMEOUT = 60 * 1000 * 60;
        test.setTimeout(TEST_TIMEOUT);
        await projectPage.waitForSampleComplete(project.id, WORKFLOWS.WGS, sampleNames[sampleNames.length -1]);
        await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
        await projectPage.waitForSampleComplete(project.id, WORKFLOWS.WGS, sampleNames[0]);
      } else {
        sampleNames = await projectPage.selectCompletedSamples(sampleNames.length);
      }

      samplesTable = await projectPage.getSamplesTableOrderedByName();
      for (const sampleName of sampleNames) {
        expect(samplesTable[sampleName]["Sample"][1]).toEqual("COMPLETE");
      }
      // #endregion 11. Go back to project and observe Sample status until it Completes

      // #region 12. Hover over Reference Accession value in Sample View list

      // - Reference Accession reads:
      // MN908947.3 - Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome
      // Severe acute respiratory syndrome coronavirus 2
      const expectedReferenceAccession = [
        "MN908947.3 - Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
        "Severe acute respiratory syndrome coronavirus 2",
      ];
      for (const sampleName of sampleNames) {
        expect(samplesTable[sampleName]["Reference Accession"]).toEqual(expectedReferenceAccession);
      }
      // #endregion 12. Hover over Reference Accession value in Sample View list

      // #region 13. Click on (+) icon in Sample List column labels and add
      const plusColumns = ["Sequencing Platform", "Wetlab Protocol", "Medaka Model"];
      await projectPage.selectPlusColumnOptions(plusColumns);
      // #endregion 13. Click on (+) icon in Sample List column labels and add

      // #region 14. Observe new metadata column info added
      samplesTable = await projectPage.getSamplesTableOrderedByName();

      // - Sequencing Platform metadata reads: Illumina
      // - Wetlab Protocol reads: ARTIC
      // - Medaka Model reads: [empty]
      let expectedWetlab = wetLab;
      if (wetLab === "ARTIC v3") {
        expectedWetlab = "ARTIC";
      } else if (wetLab === "Combined MSSPE & ARTIC v3") {
        expectedWetlab = "Combined MSSPE ARTIC";
      } else if (wetLab === "ARTIC v3 - Short Amplicons (275 bp)") {
        expectedWetlab = "ARTIC Short Amplicons";
      } else if (wetLab === "ARTIC v4/ARTIC v4.1") {
        expectedWetlab = "ARTIC v4";
      } else if (wetLab === "ARTIC v5.3.2") {
        expectedWetlab = "ARTIC v5";
      }
      for (const sampleName of sampleNames) {
        const actualWetLab = samplesTable[sampleName]["Wetlab Protocol"];
        const expectedMatch = new RegExp(expectedWetlab, "i");
        expect(actualWetLab).toMatch(expectedMatch);
        expect(samplesTable[sampleName]["Medaka Model"]).toEqual("");
      }
      // #endregion 14. Observe new metadata column info added
    });
  }
});
