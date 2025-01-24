import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import {
  MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R1,
  MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R2,
} from "@e2e/constants/sample";

const TEST_TIMEOUT = 60 * 1000 * 40;
const UPLOAD_TIMEOUT = 60 * 1000 * 5;
const SHORT_MNGS_NAME = "mWGS_RNA_human-128-lung-rna_10p";
const MNGS_SAMPLE_FILES = [
  MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R1,
  MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R2,
];

test.describe("Functional: P-1: short mNGS - BLASTN", () => {
  /**
   * Sample Report Downs - Row actions
   * short mNGS - BLASTN- NewINDEX
   */
  test(`SNo 22: To verify New Index BLASTN functionality sample report`, async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with short mNGS samples using a New Index date
    const project = await projectPage.getOrCreateProject(
      "SNo_22-NewIndex-BLASTN",
    );
    await setupSamples(
      page,
      project,
      MNGS_SAMPLE_FILES,
      [SHORT_MNGS_NAME],
      WORKFLOWS.MNGS,
      {
        runPipeline: true,
        hostOrganism: "Human",
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        waitForPipeline: false,
      },
      UPLOAD_TIMEOUT,
    );
    // #endregion 2. Pick a project with short mNGS samples using a New Index date

    // #region 3. Go to Metagenomics tab and click on an mNGS sample
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    const samplesTable = await projectPage.getSamplesTable();
    const samleRow = samplesTable.filter(
      sampleRow =>
        sampleRow.Sample[0].includes(SHORT_MNGS_NAME) &&
        sampleRow.Sample[1] === "COMPLETE",
    )[0];
    test.skip(
      !samleRow,
      "No completed short mNGS CG samples (waitForPipeline)",
    );
    const sampleName = samleRow.Sample[0];

    const samplesPage = await projectPage.clickSample(sampleName);
    const ncbiIndexDate = await samplesPage.getNCBIIndexDate();

    const NotNewIndex = ncbiIndexDate !== "2024-02-06";
    test.skip(NotNewIndex, "No short mNGS - CG run - NewIndex");
    // #endregion 3. Go to Metagenomics tab and click on an mNGS sample

    // #region 4. Expand genus / species list and hover over a species record
    await samplesPage.clickExpandAll();

    const reportTable = await samplesPage.getReportFilterTable();
    const sample = (
      await samplesPage.getSamples(project.name, [sampleName])
    )[0];
    const taxons = await samplesPage.getTaxonsFromReport(
      await samplesPage.getReportV2(sample.id),
    );
    const taxon = taxons.filter(
      taxon => reportTable[0].Taxon.includes(taxon.name) && taxon.name,
    )[0];

    await samplesPage.hoverOverTaxon(taxon.name);
    await samplesPage.pause(2);
    // #endregion 4. Expand genus / species list and hover over a species record

    // #region 5. Click on Magnifier BLAST icon
    await samplesPage.clickBlastHoverButton(taxon.id);
    await samplesPage.pause(2);
    // #endregion 5. Click on Magnifier BLAST icon

    // #region 7. Select BLASTN option and click on Continue
    await samplesPage.clickBlastOption("blastn");
    await samplesPage.pause(2);
    await samplesPage.clickContinue();
    await samplesPage.pause(2);
    // #endregion 7. Select BLASTN option and click on Continue

    // #region 8. Select a contig reads option and click on Continue (2 times if leaving CZID message prompts)
    await samplesPage.clickBlastContigCheckbox();
    await samplesPage.clickContinue();
    const blastNCBI = await samplesPage.clickBlastContinue();
    // #endregion 8. Select a contig reads option and click on Continue (2 times if leaving CZID message prompts)

    // #region 9. Verify BLASTN suite NCBI page report opens
    const ncbiQuery = await blastNCBI.getQueryValues();

    // CZID sends contigs selected and  NCBI BLASTN report site opens
    expect(ncbiQuery["merged_NT_NR"]).toContain(taxon.genus_tax_id);
    // #endregion 9. Verify BLASTN suite NCBI page report opens
  });

  /**
   * Sample Report Downs - Row actions
   * short mNGS - BLASTN- OldIndex
   */
  test(`SNo 24: To verify Old Index BLASTN functionality sample report`, async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with short mNGS samples using a Old Index date
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}`,
    );
    await setupSamples(
      page,
      project,
      MNGS_SAMPLE_FILES,
      [SHORT_MNGS_NAME],
      WORKFLOWS.MNGS,
      {
        runPipeline: true,
        hostOrganism: "Human",
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        waitForPipeline: false,
      },
      UPLOAD_TIMEOUT,
    );
    // #endregion 2. Pick a project with short mNGS samples using a Old Index date

    // #region 3. Go to Metagenomics tab and click on an mNGS sample
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    const samplesTable = await projectPage.getSamplesTable();
    const samleRow = samplesTable.filter(
      sampleRow =>
        sampleRow.Sample[0].includes(SHORT_MNGS_NAME) &&
        sampleRow.Sample[1] === "COMPLETE",
    )[0];
    test.skip(
      !samleRow,
      "No completed short mNGS CG samples (waitForPipeline)",
    );
    const sampleName = samleRow.Sample[0];

    const samplesPage = await projectPage.clickSample(sampleName);
    const ncbiIndexDate = await samplesPage.getNCBIIndexDate();

    test.skip(
      ncbiIndexDate !== "2021-01-22",
      "No short mNGS - CG run - OldIndex",
    );
    // #endregion 3. Go to Metagenomics tab and click on an mNGS sample

    // #region 4. Expand genus / species list and hover over a species record
    await samplesPage.clickExpandAll();

    const sample = (
      await samplesPage.getSamples(project.name, [sampleName])
    )[0];
    const taxons = await samplesPage.getTaxonsFromReport(
      await samplesPage.getReportV2(sample.id),
    );
    const taxon = taxons.filter(
      taxon => taxon.name && taxon.name.includes("Human orthopneumovirus"),
    )[0];
    await samplesPage.hoverOverTaxon(taxon.name);
    await samplesPage.pause(2);
    // #endregion 4. Expand genus / species list and hover over a species record

    // #region 5. Click on Magnifier BLAST icon
    await samplesPage.clickBlastHoverButton(taxon.id);
    await samplesPage.pause(2);
    // #endregion 5. Click on Magnifier BLAST icon

    // #region 7. Select BLASTN option and click on Continue
    await samplesPage.clickBlastOption("blastn");
    await samplesPage.pause(2);
    await samplesPage.clickContinue();
    await samplesPage.pause(2);
    // #endregion 7. Select BLASTN option and click on Continue

    // #region 8. Select a contig reads option and click on Continue (2 times if leaving CZID message prompts)
    await samplesPage.clickBlastContigCheckbox();
    await samplesPage.clickContinue();
    const blastNCBI = await samplesPage.clickBlastContinue();
    // #endregion 8. Select a contig reads option and click on Continue (2 times if leaving CZID message prompts)

    // #region 9. Verify BLASTN suite NCBI page report opens
    const ncbiQuery = await blastNCBI.getQueryValues();

    // CZID sends contigs selected and  NCBI BLASTN report site opens
    expect(ncbiQuery["merged_NT_NR"]).toContain(taxon.genus_tax_id);
    // #endregion 9. Verify BLASTN suite NCBI page report opens
  });
});
