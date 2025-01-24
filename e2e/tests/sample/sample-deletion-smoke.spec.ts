import { WORKFLOWS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_R1,
  SAMPLE_FILE_R2,
  SAMPLE_FILE_CT,
} from "@e2e/constants/sample";
import { test, expect } from "@playwright/test";
import { ProjectPage, RUN_TYPES } from "../../page-objects/project-page";
import { SamplesPage } from "../../page-objects/samples-page";
import { UploadPage } from "../../page-objects/upload-page";

const SAMPLE_FILES = [SAMPLE_FILE_R1, SAMPLE_FILE_R2];
const LMNGS_SAMPLE_FILES = [SAMPLE_FILE_CT];

const uploadWorkflows = [
  WORKFLOWS.MNGS,
  WORKFLOWS.LMNGS,
  WORKFLOWS.AMR,
  WORKFLOWS.WGS,
];

let samplesPage: SamplesPage;
let projectPage: ProjectPage;

const TEST_TIMEOUT = 60 * 1000 * 5;

test.describe("Sample Deletion", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    samplesPage = new SamplesPage(page);
    projectPage = new ProjectPage(page);
  });

  for (const workflow of uploadWorkflows) {
    /**
     * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-15
     * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-16
     * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-17
     * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-36
     */
    test(`Smoke Test: Delete ${workflow} sample`, async () => {
      const project = await projectPage.getOrCreateProject(
        `automation_project_${workflow}`,
      );

      // #region Try to seed some data for the workflow
      try {
        const sampleFiles =
          workflow === WORKFLOWS.LMNGS ? LMNGS_SAMPLE_FILES : SAMPLE_FILES;
        const uploadPage = new UploadPage(projectPage.page);
        await uploadPage.e2eCSVSampleUpload(sampleFiles, project, workflow);
      } catch {
        // No action required
      }
      // #endregion Try to seed some data for the workflow

      // #region Go to the Samples tab
      await projectPage.navigateToSamples(project.id, workflow);
      // #endregion Go to the Samples tab

      // #region Choose a sample
      const completedRowIndexes = await projectPage.getCompletedRowIndexes();
      const rowIndex = completedRowIndexes[0];

      const sampleName = await projectPage.getSampleNameFromRow(rowIndex);
      const samples = await samplesPage.getSamples(project.name, sampleName);
      const sample = samples[0];
      // #endregion Choose a sample

      // #region Delete the sample
      await projectPage.clickSampleCheckbox(sampleName);
      await projectPage.clickDeleteButton();
      await projectPage.clickDeleteConfirmationButton();
      // #endregion Delete the sample

      // #region Verify the expected alert message is displayed "{x} run was successfully deleted"
      const messages = await projectPage.getAlertMessages();

      expect(messages).toEqual([
        `1 ${RUN_TYPES[workflow]} run was successfully deleted.dismiss`,
      ]);
      // #endregion Verify the expected alert message is displayed "{x} run was successfully deleted"

      // #region Verify the sample is removed from the table
      await projectPage.validateSampleNotPresent(sampleName);
      // #endregion Verify the sample is removed from the table

      // #region Verify the sample report returns an error after deleting

      // Pause to allow deletion to complete, otherwise the subsequent API call
      // may cause an exception if the sample has not been fully deleted
      await samplesPage.pause(15);

      const sampleReportAfter = await samplesPage.getWaitForReportError(
        sample.id,
      );
      // After deletion, expected the sampe report to return an error
      expect(sampleReportAfter.error).toBeDefined();
      // #endregion Verify the sample report returns an error after deleting
    });
  }
});
