import { WORKFLOWS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_1_PAIRED_R1,
  SAMPLE_FILE_1_PAIRED_R2,
  SAMPLE_FILE_CT20K,
} from "@e2e/constants/sample";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

const CT20K_SAMPLE_FILES = [SAMPLE_FILE_CT20K];
const CT20K = "Ct20K";
const CT20K_SAMPLE_NAMES = [CT20K];

const SAMPLE_1_PAIRED_FILES = [
  SAMPLE_FILE_1_PAIRED_R1,
  SAMPLE_FILE_1_PAIRED_R2,
];
const SAMPLE_1_PAIRED = "Sample_1_Paired";
const SAMPLE_1_PAIRED_SAMPLE_NAMES = [SAMPLE_1_PAIRED];

const TEST_TIMEOUT = 60 * 1000 * 5;

/*
 * SC2 Sample view list
 * Icon actions
 */
test.describe("SC2 Sample view list: Functional: P-0", () => {
  /*
  Toggle SC2 / WGS selection
  Icons action
  */
  test(`SNo SC2-49: Toggle SC2 / WGS selection Icons action`, async ({
    page,
  }) => {
    // #region setup
    test.setTimeout(TEST_TIMEOUT);
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject("SNo_SC2-49");
    await setupSamples(
      page,
      project,
      SAMPLE_1_PAIRED_FILES,
      SAMPLE_1_PAIRED_SAMPLE_NAMES,
      WORKFLOWS.SC2,
    );
    await setupSamples(
      page,
      project,
      CT20K_SAMPLE_FILES,
      CT20K_SAMPLE_NAMES,
      WORKFLOWS.SC2,
      { sequencingPlatform: WORKFLOWS.LMNGS },
    );
    await setupSamples(
      page,
      project,
      SAMPLE_1_PAIRED_FILES,
      [`${SAMPLE_1_PAIRED}_1`],
      WORKFLOWS.WGS,
    );
    await setupSamples(
      page,
      project,
      SAMPLE_1_PAIRED_FILES,
      [`${SAMPLE_1_PAIRED}_2`],
      WORKFLOWS.WGS,
    );
    await setupSamples(
      page,
      project,
      SAMPLE_1_PAIRED_FILES,
      [`${SAMPLE_1_PAIRED}_3`],
      WORKFLOWS.WGS,
    );
    // #endregion setup

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Open [floo WGS1] Project
    await projectPage.fillSearchMyDataInput(project.name, {
      clickResult: true,
    });
    // #endregion 2. Open [floo WGS1] Project

    // #region 3. Navigate to Consensus Genome tab
    await projectPage.clickConsensusGenomeTab();
    // #endregion 3. Navigate to Consensus Genome tab

    // #region 4. Select SC2 samples - ""Ct20K"", ""Sample_1_Paired""
    await projectPage.clickSampleCheckbox(CT20K);
    await projectPage.clickSampleCheckbox(SAMPLE_1_PAIRED);
    // #endregion 4. Select SC2 samples - ""Ct20K"", ""Sample_1_Paired""

    // #region 5. Observe selection count and icons action (Download, Trash, (not Nextclade))
    // Nextclade button functionality tested in SNo 23
    let selectedSamples = await projectPage.getSelectedSamplesCount();
    // #endregion 5. Observe selection count and icons action (Download, Trash, (not Nextclade))

    // #region 6. Click on all icons separately

    // Step 5,6 expected: (2) Selected
    expect(selectedSamples).toEqual(2);

    // Download (enabled) - 2 consensus genomes selected
    let isDownloadButtonDisabled = await projectPage.isDownloadButtonDisabled();
    expect(isDownloadButtonDisabled).toBeFalsy();

    await projectPage.clickDownloadButton();
    let downloadTypeSelectedSamplesCount =
      await projectPage.getDownloadTypeSelectedSamplesCount();
    expect(downloadTypeSelectedSamplesCount).toEqual(2);
    await projectPage.clickCloseIcon();

    // Delete (enabled) - 2 consensus genomes runs
    let isDeleteButtonDisabled = await projectPage.isDeleteButtonDisabled();
    expect(isDeleteButtonDisabled).toBeFalsy();

    await projectPage.clickDeleteButton();
    let deleteSelectedSamplesCount =
      await projectPage.getDeleteSelectedSamplesCount();
    expect(deleteSelectedSamplesCount).toEqual(2);

    await projectPage.clickDeleteCancelButton();
    // #endregion 6. Click on all icons separately

    // #region 7. Click on ""Select All"" checkbox
    await projectPage.clickSelectAllSamples();
    // #endregion 7. Click on ""Select All"" checkbox

    // #region 8. Repeat steps 5-6

    // Step 8 expected: (5) Selected
    selectedSamples = await projectPage.getSelectedSamplesCount();
    expect(selectedSamples).toEqual(5);

    // Download (enabled) - 5 consensus genomes selected
    isDownloadButtonDisabled = await projectPage.isDownloadButtonDisabled();
    expect(isDownloadButtonDisabled).toBeFalsy();

    await projectPage.clickDownloadButton();
    downloadTypeSelectedSamplesCount =
      await projectPage.getDownloadTypeSelectedSamplesCount();
    expect(downloadTypeSelectedSamplesCount).toEqual(5);
    await projectPage.clickCloseIcon();

    // Delete (enabled) - 5 consensus genomes runs
    isDeleteButtonDisabled = await projectPage.isDeleteButtonDisabled();
    expect(isDeleteButtonDisabled).toBeFalsy();

    await projectPage.clickDeleteButton();
    deleteSelectedSamplesCount =
      await projectPage.getDeleteSelectedSamplesCount();
    expect(deleteSelectedSamplesCount).toEqual(5);

    await projectPage.clickDeleteCancelButton();
    // #endregion Step 8 expected: (5) Selected

    // #region 9. Unselect SC2 samples - ""Ct20K"", ""Sample_1_Paired""
    const unselect = true;
    await projectPage.clickSampleCheckbox(CT20K, unselect);
    await projectPage.clickSampleCheckbox(SAMPLE_1_PAIRED, unselect);
    // #endregion 9. Unselect SC2 samples - ""Ct20K"", ""Sample_1_Paired""

    // #region 10. Repeat steps 5-6
    selectedSamples = await projectPage.getSelectedSamplesCount();

    // Step 10 expected: (3) Selected
    expect(selectedSamples).toEqual(3);

    // Download (enabled) - 3 consensus genomes selected
    isDownloadButtonDisabled = await projectPage.isDownloadButtonDisabled();
    expect(isDownloadButtonDisabled).toBeFalsy();

    await projectPage.clickDownloadButton();
    downloadTypeSelectedSamplesCount =
      await projectPage.getDownloadTypeSelectedSamplesCount();
    expect(downloadTypeSelectedSamplesCount).toEqual(3);
    await projectPage.clickCloseIcon();

    // Delete (enabled) - 3 consensus genomes runs
    isDeleteButtonDisabled = await projectPage.isDeleteButtonDisabled();
    expect(isDeleteButtonDisabled).toBeFalsy();

    await projectPage.clickDeleteButton();
    deleteSelectedSamplesCount =
      await projectPage.getDeleteSelectedSamplesCount();
    expect(deleteSelectedSamplesCount).toEqual(3);
    // #endregion 10. Repeat steps 5-6
  });
});
