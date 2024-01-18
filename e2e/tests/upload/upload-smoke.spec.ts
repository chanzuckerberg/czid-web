import { WORKFLOWS } from "@e2e/constants/common";
import { SAMPLE_FILE_R1, SAMPLE_FILE_R2, SAMPLE_FILE_CT, SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2 } from "@e2e/constants/sample";
import { test } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";
import { UploadPage } from "../../page-objects/upload-page";

let uploadPage = null;
let projectPage = null;
let project = null;
const createdBy = "automation";
const SAMPLE_FILES = [SAMPLE_FILE_R1, SAMPLE_FILE_R2];
const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const LMNGS_SAMPLE_FILES = [SAMPLE_FILE_CT];
const uploadWorkflows = [WORKFLOWS.MNGS, WORKFLOWS.LMNGS, WORKFLOWS.AMR, WORKFLOWS.WGS, WORKFLOWS.SC2];

test.describe("Upload Smoke Tests", () => {

  test.beforeEach(async ({ page }) => {
    uploadPage = new UploadPage(page);
    projectPage = new ProjectPage(page);
    await uploadPage.goto();
    await uploadPage.dismissCookieBanner();
  });

  // #region Verify Upload Sample for Workflows
  for (const workflow of uploadWorkflows) {
    test(`Smoke Test: Verify Upload Sample ${workflow}`, async () => {
      const sampleFiles = workflow === WORKFLOWS.LMNGS ? LMNGS_SAMPLE_FILES : SAMPLE_FILES;
      const sampleNames = workflow === WORKFLOWS.LMNGS ? ["Ct20K_VarSkip"] : ["RR004_water_2_S23A"];

      // Choose project
      project = await projectPage.getOrCreateProject(`automation_project`);
      await uploadPage.selectProject(project.name);

      // Set workflow
      await uploadPage.setWorkFlow(workflow);

      // Upload sample files
      await uploadPage.uploadSampleFiles(sampleFiles);

      // Verify the expected confirmation text is shown
      const expectedConfirmationText = `${sampleFiles.length} File${sampleFiles.length > 1 ? "s" : ""} Selected For Upload`;
      await uploadPage.validateSampleUploadConfirmation(expectedConfirmationText);

      // Verify the attached files
      await uploadPage.validateAttachedInputFiles(sampleFiles);

      // Verify the sample names
      await uploadPage.validateSampleNames(sampleNames);
    });
  };
  // #endregion Verify Upload Sample for Workflows

  // #region Verify Set Metadata for Samples Manually
  for (const workflow of uploadWorkflows) {
    test(`Smoke Test: Verify Set Metadata for Samples Manually ${workflow}`, async () => {
      let sampleFiles = null;
      if (workflow === WORKFLOWS.LMNGS) {
        sampleFiles = LMNGS_SAMPLE_FILES;
      } else if (workflow === WORKFLOWS.WGS) {
        test.setTimeout(180000); // viral-consensus-genome takes longer to upload
        sampleFiles = WGS_SAMPLE_FILES;
      } else {
        sampleFiles = SAMPLE_FILES;
      }

      // Choose project
      project = await projectPage.getOrCreateProject(`automation_project_${workflow}`);
      await uploadPage.selectProject(project.name);

      // Set workflow
      await uploadPage.setWorkFlow(workflow);

      // Upload sample files
      await uploadPage.uploadSampleFiles(sampleFiles);

      // TODO: Update to get all
      const sampleNames = await uploadPage.getSampleNames();

      // Continue
      await uploadPage.clickContinue();

      // Wait for the file data to be imported
      await uploadPage.validateUploadMetaDataVisible();

      // Manual Input
      const inputs = await uploadPage.getRandomizedSampleInputs(sampleFiles, sampleNames);
      await uploadPage.setManualInputs(inputs);

      // Validate the expected values were set
      await uploadPage.validateManualInputsValues(inputs);

      // Continue to Review to verify the manually set Sample Info
      await uploadPage.clickContinue();

      // Validate the manually set Sample Info
      await uploadPage.validateProjectInfo(project.name, createdBy);
      await uploadPage.validateAnalysisInfo(workflow);
      await uploadPage.validateSampleInfo(inputs);

      // Continue to Upload
      try {
        await uploadPage.clickTermsAgreementCheckbox();
        await uploadPage.clickStartUploadButton();
        await uploadPage.waitForUploadComplete();
        // eslint-disable-next-line no-empty
      } catch {
        // No action required
      }
    });
  };
  // #endregion Verify Set Metadata for Samples Manually

  // #region Verify Upload Metadata for Sample using CSV
  for (const workflow of uploadWorkflows) {
    test(`Smoke Test: Verify Upload Metadata for Sample using CSV ${workflow}`, async () => {
      let sampleFiles = null;
      if (workflow === WORKFLOWS.LMNGS) {
        sampleFiles = LMNGS_SAMPLE_FILES;
      } else if (workflow === WORKFLOWS.WGS) {
        test.setTimeout(180000); // viral-consensus-genome takes longer to upload
        sampleFiles = WGS_SAMPLE_FILES;
      } else {
        sampleFiles = SAMPLE_FILES;
      }

      // Choose project
      project = await projectPage.getOrCreateProject(`automation_project_${workflow}`);
      await uploadPage.selectProject(project.name);

      // Set workflow
      await uploadPage.setWorkFlow(workflow);


      // Upload sample files
      await uploadPage.uploadSampleFiles(sampleFiles);

      // Get the uploaded sample name and generate randomized inputs
      const sampleNames = await uploadPage.getSampleNames();
      const inputs = await uploadPage.getRandomizedSampleInputs(sampleFiles, sampleNames);

      // Continue
      await uploadPage.clickContinue();

      // Click CSV Upload
      await uploadPage.clickCSVUpload();

      const metadataFileName = "metadata_template.csv";
      await uploadPage.uploadCSVMetaData(metadataFileName, inputs);

      // Continue to Review to verify the CSV Sample Info
      await uploadPage.clickContinue();

      // Validate the Sample Info matched the CSV inputs
      await uploadPage.validateProjectInfo(project.name, createdBy);
      await uploadPage.validateAnalysisInfo(workflow);
      await uploadPage.validateSampleInfo(inputs);

      // Continue to Upload
      try {
        await uploadPage.clickTermsAgreementCheckbox();
        await uploadPage.clickStartUploadButton();
        await uploadPage.waitForUploadComplete();
        // eslint-disable-next-line no-empty
      } catch {
        // No action required
      }
    });
  };
  // #endregion Verify Upload Metadata for Sample using CSV
});
