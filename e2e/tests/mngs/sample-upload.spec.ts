import { SEQUENCING_PLATFORMS, WORKFLOWS } from "@e2e/constants/common";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";
import { UploadPage } from "@e2e/page-objects/upload-page";
import {
  SAMPLE_FILE_CT20K,
  SAMPLE_FILE_NO_HOST_1,
  SAMPLE_FILE_NO_HOST_2,
} from "@e2e/constants/sample";

const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const UPLOAD_COMPLETE_LITERAL = "Uploads completed!";
const IN_PROGRESS = "IN PROGRESS";
const IN_PROGRESS_MESSAGE =
  "IN PROGRESSRunning Host FilteringView Pipeline Visualization";
const BASESPACE_PROJECT_NAME = "Mark Test Project";

const TEST_TIMEOUT = 60 * 1000 * 60;
const UPLOAD_TIMEOUT = 60 * 1000 * 5;

/*
 * mNGS IP: Sample upload (web) Functional: P-0
 */
test.describe("mNGS IP: Functional: P-0", () => {
  test.beforeEach(async () => {
    test.setTimeout(TEST_TIMEOUT);
  });

  /*
   * Sample upload (web) - short mNGS Local file
   */
  test(`mNGS-1: short mNGS Illumina sample web upload`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select an existing project (or create a new one)  and check ""Metagenomics"" Analysis Type checkbox
    const project = await projectPage.getOrCreateProject(`short_mNGS_Illumina`);

    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.MNGS);
    // #endregion 3. Select an existing project (or create a new one)  and check ""Metagenomics"" Analysis Type checkbox

    // #region 4. Select ""Illumina"" radio button
    await uploadPage.clickSequencingPlatform(SEQUENCING_PLATFORMS.MNGS);
    // #endregion 4. Select ""Illumina"" radio button

    // #region 5. Select Sample files and click on Continue (see Data section)
    // "mNGS Illumina sample:
    // https://drive.google.com/drive/folders/17DCk9tIpXSGe5lFWTiQ4s07fGQLdsjL5?usp=drive_link"
    const MNGS_ILLUMINA_SAMPLE_FILES = [
      "mngs_illumina/RR004_water_2_S23A_L001_R1_001.fastq",
      "mngs_illumina/RR004_water_2_S23A_L002_R1_001.fastq",
      "mngs_illumina/RR004_water_2_S23A_L003_R1_001.fastq",
      "mngs_illumina/RR004_water_2_S23A_L004_R1_001.fastq",
      "mngs_illumina/RR004_water_2_S23A_L001_R2_001.fastq",
      "mngs_illumina/RR004_water_2_S23A_L002_R2_001.fastq",
      "mngs_illumina/RR004_water_2_S23A_L003_R2_001.fastq",
      "mngs_illumina/RR004_water_2_S23A_L004_R2_001.fastq",
    ];
    await uploadPage.uploadSampleFiles(
      MNGS_ILLUMINA_SAMPLE_FILES,
      true,
      UPLOAD_TIMEOUT * 2,
    ); // Increase timeout for all files to complete upload
    await uploadPage.clickContinue();
    // #endregion 5. Select Sample files and click on Continue (see Data section)

    // #region 6. Enter required Metadata and click on Continue
    const sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(
      MNGS_ILLUMINA_SAMPLE_FILES,
      sampleNames,
    );
    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();
    // #endregion 6. Enter required Metadata and click on Continue

    // #region 7. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForUploadComplete();

    // Uploading screen displays with:
    // - Upload progress bar(s) completed
    // - Sent to Pipeline status displayed
    // - Uploads completed! message displayed
    // - Go to Project button enabled / displayed
    for (const sampleName of sampleNames) {
      const hostSentToPipeline = await uploadPage.waitForSampleSentToPipeline(
        sampleName,
      );
      expect(hostSentToPipeline).toBeTruthy();

      const hostUploadProgress = await uploadPage.getSampleUploadProgress(
        sampleName,
      );
      expect(hostUploadProgress).toEqual(100);
    }
    const uploadWindowTitle = await uploadPage.getUploadWindowTitle();
    expect(uploadWindowTitle).toEqual(UPLOAD_COMPLETE_LITERAL);

    const goToProjectButtonEnabled =
      await uploadPage.isGoToProjectButtonEnabled();
    expect(goToProjectButtonEnabled).toBeTruthy();
    // #endregion 7. Check on Terms and Privacy policies checkbox and click Start Upload

    // #region 8. Click on Go to Project in Uploads completed! page
    await uploadPage.clickGoToProjectButton();
    // #endregion 8. Click on Go to Project in Uploads completed! page

    // #region 9. Click on Sample row and observe
    const samplesPage = new SamplesPage(page);

    await projectPage.scrollDownToSample(sampleNames[0]);
    await projectPage.clickSample(sampleNames[0]);

    // - Sample report displays ""In Progress"" until completion
    const sampleStatusMessage = await samplesPage.getSampleStatusMessage(
      IN_PROGRESS,
    );

    expect(sampleStatusMessage).toEqual(IN_PROGRESS_MESSAGE);
    // #endregion 9. Click on Sample row and observe

    // #region 10. Go back to project and observe Sample status until it Completes
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);

    // At Project Sample view list:
    // - Sample statuses go from Host Filtering (grey) - Alignment (grey)  - Post Processing (grey) - Complete (green)"
    let samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      const sampleStatus = samplesTable[sampleName]["Sample"][1];
      expect(["RUNNING", "HOST FILTERING"]).toContain(sampleStatus);
    }

    await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
    for (const sampleName of sampleNames) {
      await projectPage.waitForSampleComplete(
        project.id,
        WORKFLOWS.WGS,
        sampleName,
      );
    }

    samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      expect(samplesTable[sampleName]["Sample"][1]).toEqual("COMPLETE");
    }
    // #endregion 10. Go back to project and observe Sample status until it Completes
  });

  /*
   * Sample upload (web) - short mNGS Basespace
   */
  test(`mNGS-2: short mNGS Illumina sample Basespace upload`, async ({
    page,
  }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select an existing project (or create a new one)  and check ""Metagenomics"" Analysis Type checkbox
    const project = await projectPage.getOrCreateProject(`short_mNGS_Illumina`);

    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.MNGS);
    // #endregion 3. Select an existing project (or create a new one)  and check ""Metagenomics"" Analysis Type checkbox

    // #region 4. Select ""Illumina"" radio button
    await uploadPage.clickSequencingPlatform(SEQUENCING_PLATFORMS.MNGS);
    // #endregion 4. Select ""Illumina"" radio button

    // #region 5. Click on Connect to Basespace button
    await uploadPage.clickBasespaceButton();
    const illuminaPage = await uploadPage.clickConnectToBasespaceButton();
    // #endregion 5. Click on Connect to Basespace button

    // #region 6. Login with Illumina site credentials

    // Illmina login pops up in separate window
    await illuminaPage.authorize();
    // #endregion 6. Login with Illumina site credentials

    // #region 7. Select a project option at Select Basespace Project dropdown list and click Connect to Project
    await uploadPage.selectBasespaceProject(BASESPACE_PROJECT_NAME);
    await uploadPage.clickConnectToProject();
    // #endregion 7. Select a project option at Select Basespace Project dropdown list and click Connect to Project

    // #region 8. Select some Sample files and click on Authorize
    const selectedSamples = await uploadPage.getSelectedSamples();
    await uploadPage.clickSamples(selectedSamples.slice(1));
    // #endregion 8. Select some Sample files and click on Authorize

    // #region 9. Click Cloase on Authorization window
    await uploadPage.clickAuthorizeIllumina();
    // #endregion 9. Click Cloase on Authorization window

    // #region 10. Enter required Metadata and click on Continue
    const sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(
      WGS_SAMPLE_FILES,
      sampleNames,
    );
    await uploadPage.setManualInputs(inputs);

    await uploadPage.clickContinue();
    await uploadPage.pause(10); // stablizes test
    // #endregion 10. Enter required Metadata and click on Continue

    // #region 11. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    // #endregion 11. Check on Terms and Privacy policies checkbox and click Start Upload

    // #region 12. Click on Go to Project in [X] Samples successfully created! window
    await uploadPage.waitForBasespaceUploadComplete(UPLOAD_TIMEOUT);

    const goToProjectButtonEnabled =
      await uploadPage.isGoToProjectButtonEnabled();
    expect(goToProjectButtonEnabled).toBeTruthy();
    await uploadPage.clickGoToProjectButton();
    // #endregion 12. Click on Go to Project in [X] Samples successfully created! window

    // #region 13. Click on Sample row and observe
    // At Project Sample view list:
    let samplesTable = await projectPage.getSamplesTableOrderedByName();

    // - Sample report displays ""In Progress"" until completion
    for (const sampleName of sampleNames) {
      const sampleStatus = samplesTable[sampleName]["Sample"][1];
      expect([
        "RUNNING",
        "HOST FILTERING",
        "IN PROGRESS",
        "QUEUED FOR PROCESSING",
      ]).toContain(sampleStatus);
    }
    // #endregion 13. Click on Sample row and observe

    // #region 14. Go back to project and observe Sample status until it Completes
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);

    const samplesPage = new SamplesPage(page);
    await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
    for (const sampleName of sampleNames) {
      await projectPage.waitForSampleComplete(
        project.id,
        WORKFLOWS.WGS,
        sampleName,
      );
    }

    // - Sample statuses go from Queued for Processing (grey) -  Host Filtering (grey) - Alignment (grey)  - Post Processing (grey) - Complete (green)"
    samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      expect(samplesTable[sampleName]["Sample"][1]).toEqual("COMPLETE");
    }
    // #endregion 14. Go back to project and observe Sample status until it Completes
  });

  /*
   * Sample upload (web) - long mNGS Local file
   */
  test(`mNGS-3: long mNGS Illumina sample Basespace upload`, async ({
    page,
  }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select an existing project (or create a new one)  and check ""Metagenomics"" Analysis Type checkbox
    const project = await projectPage.getOrCreateProject(`short_mNGS_Nanopore`);

    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.MNGS);
    // #endregion 3. Select an existing project (or create a new one)  and check ""Metagenomics"" Analysis Type checkbox

    // #region 4. Select ""Nanopore"" radio button
    await uploadPage.clickSequencingPlatform(WORKFLOWS.LMNGS);
    await uploadPage.clickGuppyBasecallerSettingDropDown();
    await uploadPage.clickGuppyBasecallerSettingOption("fast");
    // #endregion 4. Select ""Nanopore"" radio button

    // #region 5. Select Sample files and click on Continue (see Data section)

    // "long mNGS Nanopore sample:
    // https://drive.google.com/file/d/1oSg7OPly6WnOEfh0YqP-Pr-YnMlLg9ft/view?usp=drive_link
    await uploadPage.uploadSampleFiles(
      [SAMPLE_FILE_CT20K],
      true,
      UPLOAD_TIMEOUT,
    );
    await uploadPage.clickContinue();
    // #endregion 5. Select Sample files and click on Continue (see Data section)

    // #region 6. Enter required Metadata and click on Continue
    const sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(
      [SAMPLE_FILE_CT20K],
      sampleNames,
    );
    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();

    // #endregion 6. Enter required Metadata and click on Continue

    // #region 7. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForUploadComplete();

    // Uploading screen displays with:
    // - Upload progress bar(s) completed
    // - Sent to Pipeline status displayed
    // - Uploads completed! message displayed
    // - Go to Project button enabled / displayed
    for (const sampleName of sampleNames) {
      const hostSentToPipeline = await uploadPage.waitForSampleSentToPipeline(
        sampleName,
      );
      expect(hostSentToPipeline).toBeTruthy();

      const hostUploadProgress = await uploadPage.getSampleUploadProgress(
        sampleName,
      );
      expect(hostUploadProgress).toEqual(100);
    }
    const uploadWindowTitle = await uploadPage.getUploadWindowTitle();
    expect(uploadWindowTitle).toEqual(UPLOAD_COMPLETE_LITERAL);

    const goToProjectButtonEnabled =
      await uploadPage.isGoToProjectButtonEnabled();
    expect(goToProjectButtonEnabled).toBeTruthy();
    // #endregion 7. Check on Terms and Privacy policies checkbox and click Start Upload

    // #region 8. Click on Go to Project in Uploads completed! page
    await uploadPage.clickGoToProjectButton();
    // #endregion 8. Click on Go to Project in Uploads completed! page

    // #region 9. Click on Sample row and observe
    const samplesPage = new SamplesPage(page);

    await projectPage.scrollDownToSample(sampleNames[0]);
    await projectPage.clickSample(sampleNames[0]);

    // - Sample report displays ""In Progress"" until completion
    const sampleStatusMessage = await samplesPage.getSampleStatusMessage(
      IN_PROGRESS,
    );

    expect(sampleStatusMessage).toEqual(
      "IN PROGRESSRunning Pipeline StepsView Pipeline Visualization",
    );
    // #endregion 9. Click on Sample row and observe

    // #region 10. Go back to project and observe Sample status until it Completes
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);

    // At Project Sample view list:
    // - Sample statuses go from Host Filtering (grey) - Alignment (grey)  - Post Processing (grey) - Complete (green)"
    let samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      const sampleStatus = samplesTable[sampleName]["Sample"][1];
      expect(["RUNNING", "HOST FILTERING"]).toContain(sampleStatus);
    }

    await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
    for (const sampleName of sampleNames) {
      await projectPage.waitForSampleComplete(
        project.id,
        WORKFLOWS.WGS,
        sampleName,
      );
    }

    samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      expect(samplesTable[sampleName]["Sample"][1]).toEqual("COMPLETE");
    }
    // #endregion 10. Go back to project and observe Sample status until it Completes
  });
});
