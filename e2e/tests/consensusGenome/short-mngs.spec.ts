import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R1, MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R2 } from "@e2e/constants/sample";

const TEST_TIMEOUT = 60 * 1000 * 40;
const UPLOAD_TIMEOUT = 60 * 1000 * 5;
const SHORT_MNGS_NAME = "mWGS_RNA_human-128-lung-rna_10p";
const MNGS_SAMPLE_FILES = [MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R1, MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R2];

test.describe("Functional P-1: short mNGS - CG run", () => {

  /**
   * Sample Report Downs - Row actions 
   * short mNGS - CG run - OldIndex
   */
  test(`SNo 34: CG run kick off from short mNGS - OldIndex`, async ({page}) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
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
      UPLOAD_TIMEOUT
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with short mNGS samples using an Old Index date
    await projectPage.navigateToMyData();
    // #endregion 2. Pick a project with short mNGS samples using an Old Index date

    // #region 3. Go to Metagenomics tab and click on an mNGS sample
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    const samplesTable = await projectPage.getSamplesTable();
    const samleRow = samplesTable.filter(
      sampleRow => 
        sampleRow.Sample[0].includes(SHORT_MNGS_NAME) 
        && 
        sampleRow.Sample[1] ==="COMPLETE"
    )[0];
    test.skip(!samleRow, "No completed short mNGS CG samples (waitForPipeline)")
    const sampleName = samleRow.Sample[0];

    const samplesPage = await projectPage.clickSample(sampleName);
    const ncbiIndexDate = await samplesPage.getNCBIIndexDate();

    const NotOldIndex = ncbiIndexDate !== "2021-01-22"
    test.skip(NotOldIndex, "No short mNGS - CG run - OldIndex")
    // #endregion 3. Go to Metagenomics tab and click on an mNGS sample

    // #region 4. Expand genus / species list and hover over a species record
    await samplesPage.clickExpandAll();

    const sample = (await samplesPage.getSamples(project.name, [sampleName]))[0]
    const taxons = await samplesPage.getTaxonsFromReport(
      await samplesPage.getReportV2(sample.id));
    let taxon = null
    for (const t of taxons) {
      if (t.name.includes("Human orthopneumovirus")) {
        taxon = t;
        break;
      }
    }
    await samplesPage.isTaxonVisible(taxon.name);

    await samplesPage.hoverOverTaxon(taxon.name);
    await samplesPage.pause(2);
    // #endregion 4. Expand genus / species list and hover over a species record

    // #region 5. Click on Consensus Genome icon
    await samplesPage.clickConsensusGenomeIcon(taxon.name);
    // #endregion 5. Click on Consensus Genome icon

    // #region 7. Pick a Reference Accession and click cn Create Consensus Genome
    const isCreateANewConsensusGenomeButtonVisible =
      await samplesPage.isCreateANewConsensusGenomeButtonVisible();
    if (isCreateANewConsensusGenomeButtonVisible) {
      await samplesPage.clickCreateANewConsensusGenome();
    }

    const referenceAccessions = await samplesPage.getReferenceAccessionOptions();
    const referenceAccession =
      referenceAccessions[
        Math.floor(Math.random() * referenceAccessions.length)
      ];

    await samplesPage.selectReferenceAccession(referenceAccession);
    // #endregion 7. Pick a Reference Accession and click cn Create Consensus Genome

    // #region 7a. Click on + Create a New Consensus Genome (if not first CG run)
    await samplesPage.clickCreateConsensusGenomeButton();
    // #endregion 7a. Click on + Create a New Consensus Genome (if not first CG run)

    // #region 8. Go to Consesnsu Genome tab and verify Consensus Genome run is created and completes
    await samplesPage.clickViewConsensusGenomeLink();
    await samplesPage.waitForNotInProgress();

    // CG run process starts and completes successfully
    const isMyConsensusGenomeComplete =
      await samplesPage.getIsMyConsensusGenomeCompleteTable();
    expect(isMyConsensusGenomeComplete).not.toEqual([]);
    // #endregion 8. Go to Consesnsu Genome tab and verify Consensus Genome run is created and completes
  })

  /**
   * Sample Report Downs - Row actions 
   * short mNGS - CG run - NewIndex
   */
  test(`SNo 35: CG run kick off from short mNGS - NewIndex`, async ({page}) => {
    test.setTimeout(TEST_TIMEOUT);
  
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(`SNo_35-CG-NewIndex_${WORKFLOWS.MNGS}`);
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
      UPLOAD_TIMEOUT
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with short mNGS samples using an Old Index date
    await projectPage.navigateToMyData();
    // #endregion 2. Pick a project with short mNGS samples using an Old Index date

    // #region 3. Go to Metagenomics tab and click on an mNGS sample
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    const samplesTable = await projectPage.getSamplesTable();
    const samleRow = samplesTable.filter(
      sampleRow => 
        sampleRow.Sample[0].includes(SHORT_MNGS_NAME) 
        && 
        sampleRow.Sample[1] ==="COMPLETE"
    )[0];
    test.skip(!samleRow, "No completed short mNGS CG samples (waitForPipeline)")
    const sampleName = samleRow.Sample[0];

    const samplesPage = await projectPage.clickSample(sampleName);
    const ncbiIndexDate = await samplesPage.getNCBIIndexDate();

    const NotNewIndex = ncbiIndexDate !== "2024-02-06"
    test.skip(NotNewIndex, "No short mNGS - CG run - NewIndex")
    // #endregion 3. Go to Metagenomics tab and click on an mNGS sample

    // #region 4. Expand genus / species list and hover over a species record
    await samplesPage.clickExpandAll();

    const sample = (await samplesPage.getSamples(project.name, [sampleName]))[0]
    const taxons = await samplesPage.getTaxonsFromReport(
      await samplesPage.getReportV2(sample.id));
    let taxon = null
    for (const t of taxons) {
      if (t.name.includes("Orthopneumovirus hominis")) {
        taxon = t;
        break;
      }
    }
    await samplesPage.isTaxonVisible(taxon.name);

    await samplesPage.hoverOverTaxon(taxon.name);
    await samplesPage.pause(2);
    // #endregion 4. Expand genus / species list and hover over a species record

    // #region 5. Click on Consensus Genome icon
    await samplesPage.clickConsensusGenomeIcon(taxon.name);
    // #endregion 5. Click on Consensus Genome icon

    // #region 7. Pick a Reference Accession and click cn Create Consensus Genome
    const isCreateANewConsensusGenomeButtonVisible =
      await samplesPage.isCreateANewConsensusGenomeButtonVisible();
      if (isCreateANewConsensusGenomeButtonVisible) {
      await samplesPage.clickCreateANewConsensusGenome();
    }

    const referenceAccessions = await samplesPage.getReferenceAccessionOptions();
    const referenceAccession =
      referenceAccessions[
        Math.floor(Math.random() * referenceAccessions.length)
      ];

    await samplesPage.selectReferenceAccession(referenceAccession);
    // #endregion 7. Pick a Reference Accession and click cn Create Consensus Genome

    // #region 7a. Click on + Create a New Consensus Genome (if not first CG run)
    await samplesPage.clickCreateConsensusGenomeButton();
    // #endregion 7a. Click on + Create a New Consensus Genome (if not first CG run)

    // #region 8. Go to Consesnsu Genome tab and verify Consensus Genome run is created and completes
    await samplesPage.clickViewConsensusGenomeLink();
    await samplesPage.waitForNotInProgress();

    // CG run process starts and completes successfully
    const isMyConsensusGenomeComplete =
      await samplesPage.getIsMyConsensusGenomeCompleteTable();
    expect(isMyConsensusGenomeComplete).not.toEqual([]);
    // #endregion 8. Go to Consesnsu Genome tab and verify Consensus Genome run is created and completes
  })
});
