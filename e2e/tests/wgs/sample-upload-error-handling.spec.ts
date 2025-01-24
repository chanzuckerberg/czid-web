import { WORKFLOWS } from "@e2e/constants/common";
import { UploadPage } from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

/*
 * WGS - Sample upload
 * Local file (error handling)
 */
test.describe("WGS - Sample upload: Error handling: Data Validation: P-0", () => {
  test("SNo 37: Viral Consensus Genome - Attempt to upload non-Illumina sample files", async ({
    page,
  }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select/create a project and check "Viral Consensus Genome" Analysis Type checkbox
    const project = await projectPage.getOrCreateProject("Test_SNo_37");
    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.WGS);
    // #endregion 3. Select/create a project and check "Viral Consensus Genome" Analysis Type checkbox

    // #region 4. Select "Unkown" Taxon Name option
    await uploadPage.setUploadTaxonFilter("Unknown");
    // #endregion 4. Select "Unkown" Taxon Name option

    // #region 5. Select and upload a Reference Sequence file (see Data section)
    await uploadPage.uploadRefSequence("consensus_TEST_SC2.fa"); // https://drive.google.com/drive/folders/1m3pRArWJSCjffMtm5oWD3EZ1OHKwmOu3?usp=sharing
    // #endregion 5. Select and upload a Reference Sequence file (see Data section)

    // #region 6. Select and upload a Trim Primers file (see Data section)
    await uploadPage.uploadTrimPrimer("Primer_K.bed"); // https://drive.google.com/drive/folders/1G1fKG_Q66Zb890E_2203FnmTWwO3SDXW?usp=sharing
    // #endregion 6. Select and upload a Trim Primers file (see Data section)

    // #region 7. Select sample Input Files and click on Continue (see Data section)
    const nonIlluminaSampleFile = "28A-idseq-mosq.2to4mil_subsample.fq.gz";
    await uploadPage.uploadSampleFiles([nonIlluminaSampleFile], false); // https://drive.google.com/drive/folders/1fFg-2W4x-RHZJZLW-N5H3vnRAa1Y6g6O?usp=sharing
    // #endregion 7. Select sample Input Files and click on Continue (see Data section)

    // #region 8. Observe and verify selected Sample row
    // Selected sample row displayed disabled, greyed out, and with red information icon that reads:
    await uploadPage.hoverOverFileErrorIcon();
    const columnTooltip = await uploadPage.getColumnTooltip();
    expect(columnTooltip).toEqual(
      "This file does not match the sequencing technology selected. Please make sure that you have selected the correct sequencing technology for this file.",
    );
    expect(await uploadPage.isSampleRowDisabled()).toBeTruthy();
    // #endregion 8. Observe and verify selected Sample row

    // #region 9. Observe and verify error messages
    // Yellow box error message reads:
    // 1 file will not be uploaded. You selected Illumina as the sequencing platform, but the file does not appear to be an Illumina output.
    const warnings = await uploadPage.getWarningTable();
    expect(warnings["message"]).toEqual(
      "1 file will not be uploaded. You selected Illumina as the sequencing platform, but the file does not appear to be an Illumina output.",
    );
    // File Name
    // {Sample file name}
    expect(warnings["files"].length).toEqual(1);
    expect(warnings["files"][0]["File Name"]).toEqual(nonIlluminaSampleFile);

    // Red box error message reads:
    // There are no valid samples available for upload. Please fix the errors or select more files. If needed, contact us at our Help Center for assistance.
    const errors = await uploadPage.getErrorTable();
    expect(errors["message"]).toEqual(
      "There are no valid samples available for upload. Please fix the errors or select more files. If needed, contact us at our Help Center for assistance.",
    );
    // File Name
    // {Sample file name}
    expect(errors["files"].length).toEqual(1);
    expect(errors["files"][0]["File Name"]).toEqual(nonIlluminaSampleFile);

    // Continue button is disabled
    expect(await uploadPage.isContinueButtonDisabled()).toBeTruthy();
    // #endregion 9. Observe and verify error messages
  });
});
