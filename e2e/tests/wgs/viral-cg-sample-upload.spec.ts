import { WORKFLOWS } from "@e2e/constants/common";
import { UploadPage } from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

/*
 * Viral CG (WGS) - Sample upload (web) Nanopore unavailable
 */
test.describe("Viral CG (WGS) - Sample upload (web): Nanopore unavailable: Functional: P-2", () => {
  test("SNo 9: mNGS - Nanopore (fast) + Viral Consensus Genome", async ({
    page,
  }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check ""Metagenomics"" analysis type checkbox
    const project = await projectPage.getOrCreateProject("Test_SNo_9");
    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.MNGS);
    // #endregion 3. Select a project and check ""Metagenomics"" analysis type checkbox

    // #region 4. Select ""Nanopore"" sequencing platform radio button
    await uploadPage.clickSequencingPlatform(WORKFLOWS.LMNGS); // Nanopore: ONT (long read mNGS)
    // #endregion 4. Select ""Nanopore"" sequencing platform radio button

    // #region 5. Select ""fast"" guppy basecaller setting option
    await uploadPage.clickGuppyBasecallerSettingDropDown();
    await uploadPage.clickGuppyBasecallerSettingOption("fast");
    // #endregion 5. Select ""fast"" guppy basecaller setting option

    // #region 6. Observe ""Viral Consensus Genome"" analysis type checkbox
    let isViralConsensusGenomeDisabled =
      await uploadPage.isSequencingTechnologyDisabled(WORKFLOWS.WGS);

    // Viral Consensus Genome analysis type option should be disabled
    expect(isViralConsensusGenomeDisabled).toBeTruthy();
    // #endregion 6. Observe ""Viral Consensus Genome"" analysis type checkbox

    // #region 7. Select ""hac"" guppy basecaller setting option
    await uploadPage.clickGuppyBasecallerSettingDropDown();
    await uploadPage.clickGuppyBasecallerSettingOption("hac");
    // #endregion 7. Select ""hac"" guppy basecaller setting option

    // #region 8. Observe ""Viral Consensus Genome"" analysis type checkbox
    isViralConsensusGenomeDisabled =
      await uploadPage.isSequencingTechnologyDisabled(WORKFLOWS.WGS);

    // Viral Consensus Genome analysis type option should be disabled
    expect(isViralConsensusGenomeDisabled).toBeTruthy();
    // #endregion 8. Observe ""Viral Consensus Genome"" analysis type checkbox

    // #region 9. Select ""super"" guppy basecaller setting option
    await uploadPage.clickGuppyBasecallerSettingDropDown();
    await uploadPage.clickGuppyBasecallerSettingOption("super");
    // #endregion 9. Select ""super"" guppy basecaller setting option

    // #region 10. Observe ""Viral Consensus Genome"" analysis type checkbox
    isViralConsensusGenomeDisabled =
      await uploadPage.isSequencingTechnologyDisabled(WORKFLOWS.WGS);

    // Viral Consensus Genome analysis type option should be disabled
    expect(isViralConsensusGenomeDisabled).toBeTruthy();
    // #endregion 10. Observe ""Viral Consensus Genome"" analysis type checkbox
  });
});
