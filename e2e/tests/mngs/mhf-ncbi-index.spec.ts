import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import { MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R1, MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R2, SAMPLE_FILE_NANOPORE } from "@e2e/constants/sample";

const MNGS_SAMPLE_FILES = [MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R1, MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R2];
const LMNGS_SAMPLE_FILES = [SAMPLE_FILE_NANOPORE];
const TEST_TIMEOUT = 60 * 1000 * 15;

test.describe("Functional: P-0: MHF NCBI Index", () => {

  /**
   * Existing short mNGS - PRE-MHF NCBI Index (old v2021)
   * mNGS-4: Existing short mNGS - PRE-MHF Project
   */
  test(`mNGS-4: Existing short mNGS - PRE-MHF Project`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Go to Discovery View > Public tab
    await projectPage.clickPublicHeaderLink();
    // #endregion 2. Go to Discovery View > Public tab

    // #region 3. Click on ""floo_pre_mhf_old_index"" project
    await projectPage.fillSearchMyDataInput("floo_pre_mhf_old_index", {clickResult: true});
    // #endregion 3. Click on ""floo_pre_mhf_old_index"" project

    // #region 4. Verify ""Metagenomics"" tab has existing sample counts
    await projectPage.clickMetagenomicsTab();
    // #endregion 4. Verify ""Metagenomics"" tab has existing sample counts

    // #region 5. Click on an existing sample record in ""Metagenomics"" tab
    const sampleNames = await projectPage.getSampleNames();
    const sampleName = sampleNames[Math.floor(Math.random() * sampleNames.length)]
    const samplePage = await projectPage.clickSample(sampleName);
    // #endregion 5. Click on an existing sample record in ""Metagenomics"" tab

    // #region 6. Verify Pipeline version and NCBI Index Date value
    const pipelineVersion = await samplePage.getPipelineVersion();
    const ncbiIndexDatevalue = await samplePage.getNCBIIndexDate();

    // Existing short mNGS sample:
    // - Illumina mNGS Pipeline v7.1 displayed
    expect(pipelineVersion).toEqual("Illumina mNGS Pipeline v7.1")
    // - NCBI Index version Date is 2021 (or older)
    expect(ncbiIndexDatevalue).toEqual("old-2021-01-22")
    // #endregion 6. Verify Pipeline version and NCBI Index Date value
  });

  /**
   * Existing long mNGS - PRE-MHF NCBI Index (old v2021)
   * mNGS-5: Existing long mNGS PRE-MHF Project
   */
  test(`mNGS-5: Existing long mNGS PRE-MHF Project`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Go to Discovery View > Public tab
    await projectPage.clickPublicHeaderLink();
    // #endregion 2. Go to Discovery View > Public tab

    // #region 3. Click on ""floo_pre_mhf_old_index"" project
    await projectPage.fillSearchMyDataInput("floo_pre_mhf_old_index", {clickResult: true});
    // #endregion 3. Click on ""floo_pre_mhf_old_index"" project

    // #region 4. Verify ""Metagenomics - Nanopore"" tab has existing sample counts
    await projectPage.clickNanoporeTab();
    // #endregion 4. Verify ""Metagenomics - Nanopore"" tab has existing sample counts

    // #region 5. Click on an existing sample record in ""Metagenomics - Nanopore"" tab
    const sampleNames = await projectPage.getSampleNames();
    const sampleName = sampleNames[Math.floor(Math.random() * sampleNames.length)]
    const samplePage = await projectPage.clickSample(sampleName);
    // #endregion 5. Click on an existing sample record in ""Metagenomics - Nanopore"" tab

    // #region 6. Verify NCBI Index Date value
    const ncbiIndexDatevalue = await samplePage.getNCBIIndexDate();

    // Existing long mNGS sample:
    // - NCBI Index version Date is 2021 (or older)
    expect(ncbiIndexDatevalue).toEqual("old-2021-01-22")
    // #endregion 6. Verify NCBI Index Date value
  });

  /**
   * Existing short mNGS - POST-MHF NCBI Index (old v2021)
   * mNGS-6: Existing short mNGS - POST-MHF Project
   */
  test(`mNGS-6: Existing short mNGS - POST-MHF Project`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Go to Discovery View > Public tab
    await projectPage.clickPublicHeaderLink();
    // #endregion 2. Go to Discovery View > Public tab

    // #region 3. Click on ""floo_post_mhf_old_index"" project
    await projectPage.fillSearchMyDataInput("floo_post_mhf_old_index", {clickResult: true});
    // #endregion 3. Click on ""floo_post_mhf_old_index"" project

    // #region 4. Verify ""Metagenomics"" tab has existing sample counts
    await projectPage.clickMetagenomicsTab();
    // #endregion 4. Verify ""Metagenomics"" tab has existing sample counts

    // #region 5. Click on an existing sample record in ""Metagenomics"" tab
    await projectPage.waitForTableLoad();
    const sampleNames = await projectPage.getSampleNames();
    const sampleName = sampleNames[Math.floor(Math.random() * sampleNames.length)]
    const samplePage = await projectPage.clickSample(sampleName);
    // #endregion 5. Click on an existing sample record in ""Metagenomics"" tab

    // #region 6. Verify Pipeline version and NCBI Index Date value
    const pipelineVersion = await samplePage.getPipelineVersion();
    const ncbiIndexDatevalue = await samplePage.getNCBIIndexDate();

    // Existing short mNGS sample:
    // - Illumina Sequencing Platform box displays latest 8.X.X pipeline version
    const expectedPipelineRegex = new RegExp(
      `Illumina mNGS Pipeline v8.\\d+.?\\d?`,
    );
    expect(pipelineVersion).toMatch(expectedPipelineRegex);
    // - NCBI Index version Date is old-2021 (or older)
    expect(ncbiIndexDatevalue).toEqual("old-2021-01-22")
    // Note: short mNGS pipeline version pinned to pipeline 8.X.X and old 2021 NCBI index for Post-MHF projects created newer than 4/1/2023 but older than 5/1/2024"
    // #endregion 6. Verify Pipeline version and NCBI Index Date value
  });

  /**
   * Existing long mNGS - POST-MHF NCBI Index (old v2021)
   * mNGS-7: Existing long mNGS - POST-MHF Project
   */
  test(`mNGS-7: Existing long mNGS - POST-MHF Project`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Go to Discovery View > Public tab
    await projectPage.clickPublicHeaderLink();
    // #endregion 2. Go to Discovery View > Public tab

    // #region 3. Click on ""floo_post_mhf_old_index"" project
    await projectPage.fillSearchMyDataInput("floo_post_mhf_old_index", {clickResult: true});
    // #endregion 3. Click on ""floo_post_mhf_old_index"" project

    // #region 4. Verify ""Metagenomics - Nanopore"" tab has existing sample counts
    await projectPage.clickNanoporeTab();
    // #endregion 4. Verify ""Metagenomics - Nanopore"" tab has existing sample counts

    // #region 5. Click on an existing sample record in ""Metagenomics - Nanopore"" tab
    const sampleNames = await projectPage.getSampleNames();
    const sampleName = sampleNames[Math.floor(Math.random() * sampleNames.length)]
    const samplePage = await projectPage.clickSample(sampleName);
    // #endregion 5. Click on an existing sample record in ""Metagenomics - Nanopore"" tab

    // #region 6. Verify Pipeline version and NCBI Index Date value
    const ncbiIndexDatevalue = await samplePage.getNCBIIndexDate();

    // Existing short mNGS sample:
    // - NCBI Index version Date is old-2021 (or older)
    expect(ncbiIndexDatevalue).toEqual("old-2021-01-22")

    // Note: Note: long mNGS pinned to old 2021 NCBI index for Post-MHF projects created newer than 4/1/2023 but older than 5/1/2024"
    // #endregion 6. Verify Pipeline version and NCBI Index Date value
  });

  /**
   * Existing short mNGS - Newest NCBI Index
   * mNGS-8: Existing short mNGS sample upload in Newest Project
   */
  test(`mNGS-8: Existing short mNGS sample upload in Newest Project`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject("ProjectCreatedNewerThan-05-01-2024");
    await setupSamples(
      page,
      project,
      MNGS_SAMPLE_FILES,
      ["mWGS_RNA_human-128-lung-rna_10p"],
      WORKFLOWS.MNGS,
      {
        runPipeline: false,
        hostOrganism: "Human",
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        waitForPipeline: true,
      },
    );

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Go to Discovery View > Public tab
    await projectPage.clickPublicHeaderLink();
    // #endregion 2. Go to Discovery View > Public tab

    // #region 3. Click on ANY project created newer than 5/1/2024
    await projectPage.navigateToSamples(project.id);
    // #endregion 3. Click on ANY project created newer than 5/1/2024

    // #region 4. Verify ""Metagenomics"" tab has existing sample counts
    await projectPage.clickMetagenomicsTab();
    // #endregion 4. Verify ""Metagenomics"" tab has existing sample counts

    // #region 5. Click on an existing sample record in ""Metagenomics"" tab
    const sampleNames = await projectPage.getSampleNames();
    const sampleName = sampleNames[Math.floor(Math.random() * sampleNames.length)]
    const samplePage = await projectPage.clickSample(sampleName);
    // #endregion 5. Click on an existing sample record in ""Metagenomics"" tab

    // #region 6. Verify Pipeline version and NCBI Index Date value
    const pipelineVersion = await samplePage.getPipelineVersion();
    const ncbiIndexDatevalue = await samplePage.getNCBIIndexDate();
    
    // Existing short mNGS sample:
    // - Illumina Sequencing Platform box displays latest 8.X.X pipeline version
    const expectedPipelineRegex = new RegExp(`Illumina mNGS Pipeline v8.\\d+.?\\d?`,);
    expect(pipelineVersion).toMatch(expectedPipelineRegex);
    // - NCBI Index version latest 2024(x) available
    expect(ncbiIndexDatevalue).toEqual("2024-02-06")
    // Note: short mNGS pipeline version pinned to latest pipeline 8.X.X and 2024(X) NCBI index for projects created newer than 5/1/2024"
    // #endregion 6. Verify Pipeline version and NCBI Index Date value
  });

  /**
   * Existing long mNGS - Newest NCBI Index
   * mNGS-9: Existing long mNGS sample upload in Newest Project
   */
  test(`mNGS-9: Existing long mNGS sample upload in Newest Project`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject("ProjectCreatedNewerThan-05-01-2024");
    await setupSamples(
      page,
      project,
      LMNGS_SAMPLE_FILES,
      ["28A-idseq-mosq.2to4mil_subsample"],
      WORKFLOWS.LMNGS,
      {
        runPipeline: false,
        hostOrganism: "Mosquito",
        sequencingPlatform: WORKFLOWS.LMNGS, // Nanopore
        guppyBasecaller: "hac",
        waitForPipeline: true,
      },
    );

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Go to Discovery View > Public tab
    await projectPage.clickPublicHeaderLink();
    // #endregion 2. Go to Discovery View > Public tab

    // #region 3. Click on ANY project created newer than 5/1/2024
    await projectPage.navigateToSamples(project.id);
    // #endregion 3. Click on ANY project created newer than 5/1/2024

    // #region 4. Verify ""Metagenomics - Nanopore"" tab has existing sample counts
    await projectPage.clickNanoporeTab();
    // #endregion 4. Verify ""Metagenomics - Nanopore"" tab has existing sample counts

    // #region 5. Click on an existing sample record in ""Metagenomics - Nanopore"" tab
    const sampleNames = await projectPage.getSampleNames();
    const sampleName = sampleNames[Math.floor(Math.random() * sampleNames.length)]
    const samplePage = await projectPage.clickSample(sampleName);
    // #endregion 5. Click on an existing sample record in ""Metagenomics - Nanopore"" tab

    // 6. Verify Pipeline version and NCBI Index Date value
    const ncbiIndexDatevalue = await samplePage.getNCBIIndexDate();
    const pipelineVersion = await samplePage.getPipelineVersion();

    const expectedPipelineRegex = new RegExp(`Nanopore mNGS Pipeline v0.\\d+.?\\d?`,);
    expect(pipelineVersion).toMatch(expectedPipelineRegex);

    // Existing short mNGS sample:
    // - NCBI Index version latest 2024(x) available
    expect(ncbiIndexDatevalue).toEqual("2024-02-06")
    // Note: long mNGS pinned to old 2021 NCBI index for Post-MHF projects created newer than 4/1/2023 but older than 5/1/2024"
  });
});
