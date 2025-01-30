import { SEQUENCING_PLATFORMS, WORKFLOWS } from "@e2e/constants/common";
import { ProjectPage } from "@e2e/page-objects/project-page";
import { UploadPage } from "@e2e/page-objects/upload-page";
import { expect, test } from "@playwright/test";

const TEST_TIMEOUT = 60 * 1000 * 15;

/*
 * Sample upload (web) - SC2  Illumina
 * LINKS
 */
test.describe("Sample upload (web) - SC2  Illumina: Functional: P-1", () => {
  /*
   * Verify Sample upload process LINKS
   */
  test(`SNo SC2-2: Verify Sample upload process LINKS`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check ""SARS-CoV-2 Consensus Genome"" Analysis Type checkbox
    const project = await projectPage.getOrCreateProject("SNo_SC2-2");

    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.SC2);
    // #endregion 3. Select a project and check ""SARS-CoV-2 Consensus Genome"" Analysis Type checkbox

    // #region 4. Select ""Illumina"" radio button
    await uploadPage.clickSequencingPlatform(SEQUENCING_PLATFORMS.MNGS);
    // #endregion 4. Select ""Illumina"" radio button

    // #region 5. Cilck on Github ""here"" LINK
    let linkedPage = await uploadPage.clickGithubHereLink();

    // For Illumina option:
    // - Github ""here"" link opens Githbu new tab:
    // https://github.com/chanzuckerberg/czid-workflows/tree/main/workflows/consensus-genome
    expect(await linkedPage.url()).toEqual(
      "https://github.com/chanzuckerberg/czid-workflows/tree/main/workflows/consensus-genome",
    );
    await linkedPage.close();
    // #endregion 5. Cilck on Github ""here"" LINK

    // #region 6. Observe Pipeline Version
    let pipelineVersion = await uploadPage.getPipelineVersion();

    // - Pipeline version displays latest 3.X.X version
    expect(pipelineVersion).toMatch(/3.\d.\d/);
    // #endregion 6. Observe Pipeline Version

    // #region 7. Click on Learn More LINK
    linkedPage = await uploadPage.clickIlluminaLearnMoreLink();

    // - Learn More link opens Help Center new tab:
    // https://chanzuckerberg.zendesk.com/hc/en-us/articles/360059656311-Upload-Data-and-Assemble-SARS-CoV-2-Genomes-Using-the-Web-App
    expect(await linkedPage.url()).toEqual(
      "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360059656311-Upload-Data-and-Assemble-SARS-CoV-2-Genomes-Using-the-Web-App",
    );
    await linkedPage.close();
    // #endregion 7. Click on Learn More LINK

    // #region 8. Select ""Nanopore"" radio button
    await uploadPage.clickSequencingPlatform(WORKFLOWS.LMNGS);
    // #endregion 8. Select ""Nanopore"" radio button

    // #region 9. Click on Nanopore sequencing ""here"" LINK
    linkedPage = await uploadPage.clickArticNetworkLink();

    // For Nanopore option:
    // - Nanopore sequencing ""here"" link opens new tab:
    // https://artic.network/ncov-2019/ncov2019-bioinformatics-sop.html
    expect(await linkedPage.url()).toEqual(
      "https://artic.network/ncov-2019/ncov2019-bioinformatics-sop.html",
    );
    await linkedPage.close();
    // #endregion 9. Click on Nanopore sequencing ""here"" LINK

    // #region 10. Observe Pipeline Version
    pipelineVersion = await uploadPage.getPipelineVersion();

    // - Pipeline version displays latest 3.X.X version
    expect(pipelineVersion).toMatch(/3.\d.\d/);
    // #endregion 10. Observe Pipeline Version

    // #region 11. Click on Learn More LINK
    linkedPage = await uploadPage.clickNanoporeLearnMoreLink();

    // - Learn More link opens Help Center new tab:
    // https://chanzuckerberg.zendesk.com/hc/en-us/articles/360059656311-Upload-Data-and-Assemble-SARS-CoV-2-Genomes-Using-the-Web-App
    expect(await linkedPage.url()).toEqual(
      "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360059656311-Upload-Data-and-Assemble-SARS-CoV-2-Genomes-Using-the-Web-App",
    );
    await linkedPage.close();
    // #endregion 11. Click on Learn More LINK

    // #region 12. Hover over ""Used Clear Labs:"" information icon and click on Learn More LINK
    await uploadPage.hoverOverClearLabsInfoIcon();
    let columnTooltip = await uploadPage.getColumnTooltip();

    // For ""Used Clear Labs"" info icon
    // Information tooltip reads:
    // ""Pipeline will be adjusted to accomodate Clear Lab fastq files shich have undergone the length filtering and trimming steps. Learn More {LINK}""
    expect(columnTooltip).toEqual(
      "Pipeline will be adjusted to accomodate Clear Lab fastq files which have undergone the length filtering and trimming steps. Learn more.",
    );

    // - Learn more link opens ClearLabs new tab:
    // https://www.clearlabs.com/
    linkedPage = await uploadPage.clickClearHereLink();
    expect(await linkedPage.url()).toEqual("https://www.clearlabs.com/");
    await linkedPage.close();
    await uploadPage.pressEscape(); // closes tooltip
    // #endregion 12. Hover over ""Used Clear Labs:"" information icon and click on Learn More LINK

    // #region 13. Hover over ""Medaka Model:"" information icon and click on Learn More LINK
    await uploadPage.hoverOverMedakaModelInfoIcon();
    columnTooltip = await uploadPage.getColumnTooltip();

    // For ""Medaka Model"" info icon
    // Information tooltip reads:
    // ""For best results, specify the correct model. Where a version of Guppy has been used without a corresponding model, choose a model with the highest version equal to or less than the Guppy version. Learn more. {LINK}""
    expect(columnTooltip).toEqual(
      "For best results, specify the correct model. Where a version of Guppy has been used without a corresponding model, choose a model with the highest version equal to or less than the Guppy version. Learn more.",
    );

    // - Learn more link opens ClearLabs new tab:
    linkedPage = await uploadPage.clickMedakaModelHereLink();
    expect(await linkedPage.url()).toEqual(
      "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360059656311-Upload-Data-and-Assemble-SARS-CoV-2-Genomes-Using-the-Web-App",
    );
    // #endregion 13. Hover over ""Medaka Model:"" information icon and click on Learn More LINK
  });
});
