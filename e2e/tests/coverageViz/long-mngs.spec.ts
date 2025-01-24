import { WORKFLOWS } from "@e2e/constants/common";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { HG002_LONG_READS_METAG } from "@e2e/constants/sample";

const TEST_TIMEOUT = 60 * 1000 * 40;
const UPLOAD_TIMEOUT = 60 * 1000 * 5;

const NANOPORE_SAMPLE_FILES = [HG002_LONG_READS_METAG];
const HG002_LONG_READS_METAG_NAME = "HG002_long_reads_metaG";
const NANOPORE_SAMPLE_NAMES = [HG002_LONG_READS_METAG_NAME];

test.describe("Functional: P-1: long mNGS - Coverage Visualization", () => {
  /**
   * Sample Report - Row actions
   * long mNGS - Coverage Visualization- NewINDEX
   */
  test(`SNo 32: To verify New Index NCBI Refernece Coverage Vis functionality, NCBI reference IDs, contig files download in a sample report`, async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with long mNGS samples using a New Index date
    const project = await projectPage.getOrCreateProject(
      "SNo-32_long-mNGS_NewIndex",
    );
    await setupSamples(
      page,
      project,
      NANOPORE_SAMPLE_FILES,
      NANOPORE_SAMPLE_NAMES,
      WORKFLOWS.LMNGS,
      {
        runPipeline: true,
        hostOrganism: "Human",
        sequencingPlatform: WORKFLOWS.LMNGS, // Nanopore
        waitForPipeline: false,
      },
      UPLOAD_TIMEOUT,
    );
    // #endregion 2. Pick a project with long mNGS samples using a New Index date

    // #region 3. Go to Metagenomics - Nanopore tab and click on an ONT sample
    await projectPage.navigateToSamples(project.id, WORKFLOWS.LMNGS);

    const samplesTable = await projectPage.getSamplesTable();
    const samleRow = samplesTable.filter(
      sampleRow =>
        sampleRow.Sample[0].includes(HG002_LONG_READS_METAG_NAME) &&
        sampleRow.Sample[1] === "COMPLETE",
    )[0];
    test.skip(!samleRow, "No completed long mNGS CG samples (waitForPipeline)");
    const samleName = samleRow.Sample[0];
    const samplesPage = await projectPage.clickSample(samleName);

    const ncbiIndexDate = await samplesPage.getNCBIIndexDate();
    test.skip(
      ncbiIndexDate !== "2024-02-06",
      "No long mNGS - CG run - NewINDEX",
    );
    // #endregion 3. Go to Metagenomics - Nanopore tab and click on an ONT sample

    // #region 4. Expand genus / species list and hover over a species record
    await samplesPage.clickExpandAll();

    const sample = (await samplesPage.getSamples(project.name, [samleName]))[0];
    const taxons = await samplesPage.getTaxonsFromReport(
      await samplesPage.getReportV2(sample.id),
    );
    const taxon = taxons.filter(
      taxon =>
        taxon.name && taxon.name.includes("Lymphocryptovirus humangamma4"),
    )[0];

    await samplesPage.hoverOverTaxon(taxon.name);
    await samplesPage.pause(2);
    // #endregion 4. Expand genus / species list and hover over a species record

    // #region 5. Click on Coverage Visualization icon
    await samplesPage.clickTaxonCoverageVisualisation(taxon.name);
    // #endregion 5. Click on Coverage Visualization icon

    // #region 7. Click on species title name chevron menu key and observe NCBI information
    const accessionLabel = await samplesPage.getAccessionLabel();
    expect(accessionLabel).toContain("M80517.1 - Epstein-Barr virus");
    // #endregion 7. Click on species title name chevron menu key and observe NCBI information

    // #region 8. Hover over NCBI reference link and observe tootlip content
    await samplesPage.hoverOverNCBIReferenceLink();
    // #endregion 8. Hover over NCBI reference link and observe tootlip content

    // #region 9. Click on NCBI reference link
    const ncbiPage = await samplesPage.clickNCBIReferenceLink();
    // #endregion 9. Click on NCBI reference link

    // #region 10. Verify NCBI site reference ID and name
    const accessionLabelParts = accessionLabel.split(" ");
    const referenceID = accessionLabelParts[0];

    // CZID and NCBI site information matches:
    // - NCBI reference ID
    const genbankID = await ncbiPage.getGenbankID();
    expect(referenceID).toEqual(genbankID);

    // - Genus name
    const genusNameParts = taxon.name.split(" ");
    const genBankText = await ncbiPage.getGenbankText();
    for (const genusName in genusNameParts) {
      expect(genBankText).toContain(genusName);
    }
    await ncbiPage.close();
    // #endregion 10. Verify NCBI site reference ID and name

    // #region 11. Click on NT Contigs bar (bottom and download contig fasta
    await samplesPage.clickNTContigsBar();
    const ntContigsDownload = await samplesPage.clickContigDownloadIcon();
    // #endregion 11. Click on NT Contigs bar (bottom and download contig fasta

    // #region 12. Click Download (cloud icon) and download contig fasta
    const contigFastaDownload = await samplesPage.clickContigFastaButton();
    // #endregion 12. Click Download (cloud icon) and download contig fasta

    // #region 13. Close Coverage Vis windows at click on downlad icon on the same species row
    await samplesPage.clickCloseIcon();
    // #endregion 13. Close Coverage Vis windows at click on downlad icon on the same species row

    // #region 14. Verify downloads of Contigs (.fasta) and Reads (.fasta) files

    // Contig FASTA file downloaded from Coverage Visualization window
    expect(ntContigsDownload.suggestedFilename()).toEqual("contigs.fasta");

    // Contigs and Reads (.fasta) files downloaded from row action
    expect(contigFastaDownload.suggestedFilename()).toEqual(
      `${samleName}_tax_${taxon.id}_contigs.fasta`,
    );
    // #endregion 14. Verify downloads of Contigs (.fasta) and Reads (.fasta) files
  });

  /**
   * Sample Report Downs - Row actions
   * long mNGS - Coverage Visualization -  - OldIndex
   */
  test(`SNo 33: To verify Old Index NCBI Refernece Coverage Vis functionality, NCBI reference IDs, contig files download in a sample report`, async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with long mNGS samples using an Old Index date
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}`,
    );
    await setupSamples(
      page,
      project,
      NANOPORE_SAMPLE_FILES,
      NANOPORE_SAMPLE_NAMES,
      WORKFLOWS.LMNGS,
      {
        runPipeline: true,
        hostOrganism: "Human",
        sequencingPlatform: WORKFLOWS.LMNGS, // Nanopore
        waitForPipeline: false,
      },
      UPLOAD_TIMEOUT,
    );
    // #endregion 2. Pick a project with long mNGS samples using an Old Index date

    // #region 3. Go to Metagenomics tab and click on an mNGS sample
    await projectPage.navigateToSamples(project.id, WORKFLOWS.LMNGS);

    const samplesTable = await projectPage.getSamplesTable();
    const samleRow = samplesTable.filter(
      sampleRow =>
        sampleRow.Sample[0].includes(HG002_LONG_READS_METAG_NAME) &&
        sampleRow.Sample[1] === "COMPLETE",
    )[0];
    test.skip(!samleRow, "No completed long mNGS CG samples (waitForPipeline)");
    const samleName = samleRow.Sample[0];
    const samplesPage = await projectPage.clickSample(samleName);

    const ncbiIndexDate = await samplesPage.getNCBIIndexDate();
    const NotOldIndex = ncbiIndexDate !== "2021-01-22";
    test.skip(NotOldIndex, "No long mNGS - CG run - OldIndex");
    // #endregion 3. Go to Metagenomics tab and click on an mNGS sample

    // #region 4. Expand genus / species list and hover over a species record
    await samplesPage.clickExpandAll();

    const sample = (await samplesPage.getSamples(project.name, [samleName]))[0];
    const taxons = await samplesPage.getTaxonsFromReport(
      await samplesPage.getReportV2(sample.id),
    );
    const taxon = taxons.filter(
      taxon => taxon.name && taxon.name.includes("Human gammaherpesvirus"),
    )[0];

    await samplesPage.hoverOverTaxon(taxon.name);
    await samplesPage.pause(2);
    // #endregion 4. Expand genus / species list and hover over a species record

    // #region 5. Click on Coverage Visualization icon
    await samplesPage.clickTaxonCoverageVisualisation(taxon.name);
    // #endregion 5. Click on Coverage Visualization icon

    // #region 7. Click on species title name chevron menu key and observe NCBI information
    const accessionLabel = await samplesPage.getAccessionLabel();
    expect(accessionLabel).toContain(
      "V01555.2 - Epstein-Barr virus (EBV) genome, strain B95-8",
    );
    // #endregion 7. Click on species title name chevron menu key and observe NCBI information

    // #region 8. Hover over NCBI reference link and observe tootlip content
    await samplesPage.hoverOverNCBIReferenceLink();
    // #endregion 8. Hover over NCBI reference link and observe tootlip content

    // #region 9. Click on NCBI reference link
    const ncbiPage = await samplesPage.clickNCBIReferenceLink();
    // #endregion 9. Click on NCBI reference link

    // #region 10. Verify NCBI site reference ID and name
    const accessionLabelParts = accessionLabel.split(" ");
    const referenceID = accessionLabelParts[0];

    // CZID and NCBI site information matches:
    // - NCBI reference ID
    const genbankID = await ncbiPage.getGenbankID();
    expect(referenceID).toEqual(genbankID);

    // - Genus name
    const genusNameParts = taxon.name.split(" ");
    const genBankText = await ncbiPage.getGenbankText();
    for (const genusName in genusNameParts) {
      expect(genBankText).toContain(genusName);
    }
    await ncbiPage.close();
    // #endregion 10. Verify NCBI site reference ID and name

    // #region 11. Click on NT Contigs bar (bottom and download contig fasta
    await samplesPage.clickNTContigsBar();
    const ntContigsDownload = await samplesPage.clickContigDownloadIcon();
    // #endregion 11. Click on NT Contigs bar (bottom and download contig fasta

    // #region 12. Click Download (cloud icon) and download contig fasta
    const contigFastaDownload = await samplesPage.clickContigFastaButton();
    // #endregion 12. Click Download (cloud icon) and download contig fasta

    // #region 13. Close Coverage Vis windows at click on downlad icon on the same species row
    await samplesPage.clickCloseIcon();
    // #endregion 13. Close Coverage Vis windows at click on downlad icon on the same species row

    // #region 14. Verify downloads of Contigs (.fasta) and Reads (.fasta) files

    // Contig FASTA file downloaded from Coverage Visualization window
    expect(ntContigsDownload.suggestedFilename()).toEqual("contigs.fasta");

    // Contigs and Reads (.fasta) files downloaded from row action
    expect(contigFastaDownload.suggestedFilename()).toEqual(
      `${samleName}_tax_${taxon.id}_contigs.fasta`,
    );
    // #endregion 14. Verify downloads of Contigs (.fasta) and Reads (.fasta) files
  });
});
