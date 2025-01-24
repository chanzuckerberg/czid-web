import { WORKFLOWS } from "@e2e/constants/common";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";
import { getAlphaNumericString } from "@e2e/utils/common";
import { UploadPage } from "@e2e/page-objects/upload-page";

const BASESPACE_PROJECT_NAME = "Mark Test Project";

const TEST_TIMEOUT = 60 * 1000 * 30;

test.describe("Functional: P-0: Create BG model", () => {
  test.beforeEach(async () => {
    test.setTimeout(TEST_TIMEOUT);
  });

  /**
   * Create BG model (standard)
   */
  test(`SNo 13: Create a New BG model (Standard)`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}`,
    );
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 1. Login to CZ ID staging

    // #region 2. Go to Samples tab and select some samples
    await projectPage.selectCompletedSamples(2);
    // #endregion 2. Go to Samples tab and select some samples

    // #region 3. Click on Backgroun Model icon
    await projectPage.clickBackgroundButton();
    // #endregion 3. Click on Backgroun Model icon

    // #region 4. Enter Name and Description
    const randomBackgroundName = `auto-${getAlphaNumericString(
      7,
    )}-${new Date()}`;
    await projectPage.fillBackgroundNameInput(randomBackgroundName);
    const randomBackgroundDescription = `auto-description-${getAlphaNumericString(
      7,
    )}-${new Date()}`;
    await projectPage.fillBackgroundDescriptionInput(
      randomBackgroundDescription,
    );
    // #endregion 4. Enter Name and Description

    // #region 5. Pick ""Standard"" option in Applied Correction Method and click Create
    await projectPage.clickCorrectionMethodDropdown();
    await projectPage.clickCorrectionMethodOption("Standard");
    await projectPage.clickBackgroundCreateButton();
    // #endregion 5. Pick ""Standard"" option in Applied Correction Method and click Create

    // #region 6. Observe bottom of BG Model window
    const createBackgroundNotification =
      await projectPage.getCreateBackgroundNotification();

    // - Background successful message displayed at botom of BG Model window:
    // ""Your Background Model is being created and will be visible on the report page once statistics have been computed.""
    expect(createBackgroundNotification).toEqual(
      "Your Background Model is being created and will be visible on the report page once statistics have been computed.",
    );
    // #endregion 6. Observe bottom of BG Model window

    // #region 7. Close BG model windows and open a sample report
    await projectPage.clickCreateBackgroundCloseIcon();
    // #endregion 7. Close BG model windows and open a sample report

    // #region 8. Click on Background dropdown filter and observe My Backgrounds section
    await projectPage.clickHeatmapButton();
    const heatmapPage = await projectPage.clickTaxonHeatmap();
    await heatmapPage.setBackground(randomBackgroundName);

    // BG model available to be selected in Sample report at My Backgrounds section and it's marked as ""Standard"""
    const selectedBackground = await heatmapPage.getSelectedBackground();
    expect(selectedBackground).toEqual(randomBackgroundName);
    // #endregion 8. Click on Background dropdown filter and observe My Backgrounds section
  });

  /**
   * Create BG (normalized)
   */
  test(`SNo 14: Create a New BG model (Normalized)`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    const project = await projectPage.getOrCreateProject(
      "SNo-14-normalized-bg",
    );

    const uploadPage = new UploadPage(page);
    await uploadPage.uploadBasespaceSample(
      project.name,
      BASESPACE_PROJECT_NAME,
      WORKFLOWS.MNGS,
    );
    await uploadPage.uploadBasespaceSample(
      project.name,
      BASESPACE_PROJECT_NAME,
      WORKFLOWS.MNGS,
    );

    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 1. Login to CZ ID staging

    // #region 2. Go to Samples tab and select some samples
    await projectPage.selectCompletedSamples(2);
    // #endregion 2. Go to Samples tab and select some samples

    // #region 3. Click on Backgroun Model icon
    await projectPage.clickBackgroundButton();
    // #endregion 3. Click on Backgroun Model icon

    // #region 4. Enter Name and Description
    const randomBackgroundName = `auto-${getAlphaNumericString(
      7,
    )}-${new Date()}`;
    await projectPage.fillBackgroundNameInput(randomBackgroundName);
    const randomBackgroundDescription = `auto-description-${getAlphaNumericString(
      7,
    )}-${new Date()}`;
    await projectPage.fillBackgroundDescriptionInput(
      randomBackgroundDescription,
    );
    // #endregion 4. Enter Name and Description

    // #region 5. Pick ""Normalized by Input Mass"" option in Applied Correction Method and click Create
    await projectPage.clickCorrectionMethodDropdown();
    await projectPage.clickCorrectionMethodOption("Normalized by input mass");
    await projectPage.clickBackgroundCreateButton();
    // #endregion 5. Pick ""Normalized by Input Mass"" option in Applied Correction Method and click Create

    // #region 6. Observe bottom of BG Model window
    const createBackgroundNotification =
      await projectPage.getCreateBackgroundNotification();

    // - Background successful message displayed at botom of BG Model window:
    // ""Your Background Model is being created and will be visible on the report page once statistics have been computed.""
    expect(createBackgroundNotification).toEqual(
      "Your Background Model is being created and will be visible on the report page once statistics have been computed.",
    );
    // #endregion 6. Observe bottom of BG Model window

    // #region 7. Close BG model windows and open a sample report
    await projectPage.clickCreateBackgroundCloseIcon();
    // #endregion 7. Close BG model windows and open a sample report

    // #region 8. Click on Background dropdown filter and observe My Backgrounds section
    await projectPage.clickHeatmapButton();
    const heatmapPage = await projectPage.clickTaxonHeatmap();
    await heatmapPage.setBackground(randomBackgroundName);

    // BG model available to be selected in Sample report at My Backgrounds section and it's marked as ""Normalized by input mass""
    const selectedBackground = await heatmapPage.getSelectedBackground();
    expect(selectedBackground).toEqual(randomBackgroundName);
    // #endregion 8. Click on Background dropdown filter and observe My Backgrounds section
  });
});
