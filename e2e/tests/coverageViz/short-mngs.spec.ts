import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2 } from "@e2e/constants/sample";

const TEST_TIMEOUT = 60 * 1000 * 40;
const UPLOAD_TIMEOUT = 60 * 1000 * 5;

const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const NO_HOST = "wgs_SARS_CoV2_no_host";
const WGS_SAMPLE_NAMES = [NO_HOST];

test.describe("Functional: P-1: short mNGS - Coverage Visualization", () => {

  /**
   * Sample Report - Row actions 
   * short mNGS - Coverage Visualization- NewINDEX
   */
  test(`SNo 30: To verify New Index NCBI Refernece Coverage Vis functionality, NCBI reference IDs, contig files download in a sample report with the new index`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with short mNGS samples using a New Index date
    const project = await projectPage.getOrCreateProject("SNo-30_short-mNGS_NewIndex");
    await setupSamples(
      page,
      project,
      WGS_SAMPLE_FILES,
      WGS_SAMPLE_NAMES,
      WORKFLOWS.MNGS,
      {
        runPipeline: true,
        hostOrganism: "Human",
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        waitForPipeline: false,
      },
      UPLOAD_TIMEOUT
    );
    // #endregion 2. Pick a project with short mNGS samples using a New Index date

    // #region 3. Go to Metagenomics tab and click on an mNGS sample
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);

    const samplesTable = await projectPage.getSamplesTable();
    const samleRow = samplesTable.filter(
      sampleRow => 
        sampleRow.Sample[0].includes(NO_HOST) 
        && 
        sampleRow.Sample[1] ==="COMPLETE"
    )[0];
    test.skip(!samleRow, "No completed short mNGS CG samples (waitForPipeline)")
    const samleName = samleRow.Sample[0];
    const samplesPage = await projectPage.clickSample(samleName);

    const ncbiIndexDate = await samplesPage.getNCBIIndexDate();
    test.skip(ncbiIndexDate !== "2024-02-06", "No short mNGS - CG run - NewINDEX")
    // #endregion 3. Go to Metagenomics tab and click on an mNGS sample

    // #region 4. Expand genus / species list and hover over a species record
    await samplesPage.clickExpandAll();

    const reportTable = await samplesPage.getReportFilterTable()
    const sample = (await samplesPage.getSamples(project.name, [samleName]))[0]
    const taxons = await samplesPage.getTaxonsFromReport(
      await samplesPage.getReportV2(sample.id));
    const taxon = taxons.filter(taxon => reportTable[1].Taxon.includes(taxon.name) && taxon.name)[0]

    await samplesPage.hoverOverTaxon(taxon.name);
    await samplesPage.pause(2);
    // #endregion 4. Expand genus / species list and hover over a species record

    // #region 5. Click on Coverage Visualization icon
    await samplesPage.clickTaxonCoverageVisualisation(taxon.name);
    // #endregion 5. Click on Coverage Visualization icon

    // #region 7. Click on species title name chevron menu key and observe NCBI information
    const accessionLabel = await samplesPage.getAccessionLabel();
    expect(accessionLabel).toContain("Severe acute respiratory syndrome coronavirus");
    // #endregion 7. Click on species title name chevron menu key and observe NCBI information

    // #region 8. Hover over NCBI reference link and observe tootlip content
    await samplesPage.hoverOverNCBIReferenceLink()
    // #endregion 8. Hover over NCBI reference link and observe tootlip content

    // #region 9. Click on NCBI reference link
    const ncbiPage = await samplesPage.clickNCBIReferenceLink()
    // #endregion 9. Click on NCBI reference link

    // #region 10. Verify NCBI site reference ID and name
    const accessionLabelParts = accessionLabel.split(" ");
    const referenceID = accessionLabelParts[0]

    // CZID and NCBI site information matches:
    // - NCBI reference ID
    const genbankID = await ncbiPage.getGenbankID();
    expect(referenceID).toEqual(genbankID);

    // - Genus name
    const isolate = accessionLabel.split(' isolate ')[1].split(', ')[0]
    const genusNameParts = taxon.name.split(" ");

    const genBankText = await ncbiPage.getGenbankText();
    expect(genBankText).toContain(isolate)
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
    expect(contigFastaDownload.suggestedFilename()).toEqual(`${samleName}_tax_${taxon.id}_contigs.fasta`);
    // #endregion 14. Verify downloads of Contigs (.fasta) and Reads (.fasta) files
  });

  /**
   * Sample Report Downs - Row actions 
   * short mNGS - Coverage Visualization -  - OldIndex
   */
  test(`SNo 31: To verify Old Index NCBI Refernece Coverage Vis functionality, NCBI reference IDs, contig files download in a sample report`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with short mNGS samples using an Old Index date
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
    await setupSamples(
      page,
      project,
      WGS_SAMPLE_FILES,
      WGS_SAMPLE_NAMES,
      WORKFLOWS.MNGS,
      {
        runPipeline: true,
        hostOrganism: "Human",
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        waitForPipeline: false,
      },
      UPLOAD_TIMEOUT
    );
    // #endregion 2. Pick a project with short mNGS samples using an Old Index date

    // #region 3. Go to Metagenomics tab and click on an mNGS sample
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);

    const samplesTable = await projectPage.getSamplesTable();
    const samleRow = samplesTable.filter(
      sampleRow => 
        sampleRow.Sample[0].includes(NO_HOST) 
        && 
        sampleRow.Sample[1] ==="COMPLETE"
    )[0];
    test.skip(!samleRow, "No completed short mNGS CG samples (waitForPipeline)")
    const samleName = samleRow.Sample[0];
    const samplesPage = await projectPage.clickSample(samleName);

    const ncbiIndexDate = await samplesPage.getNCBIIndexDate();
    const NotOldIndex = ncbiIndexDate !== "2021-01-22"
    test.skip(NotOldIndex, "No short mNGS - CG run - OldIndex")
    // #endregion 3. Go to Metagenomics tab and click on an mNGS sample

    // #region 4. Expand genus / species list and hover over a species record
    await samplesPage.clickExpandAll();

    const reportTable = await samplesPage.getReportFilterTable()
    const sample = (await samplesPage.getSamples(project.name, [samleName]))[0]
    const taxons = await samplesPage.getTaxonsFromReport(
      await samplesPage.getReportV2(sample.id));
    const taxon = taxons.filter(taxon => reportTable[1].Taxon.includes(taxon.name) && taxon.name)[0]

    await samplesPage.hoverOverTaxon(taxon.name);
    await samplesPage.pause(2);
    // #endregion 4. Expand genus / species list and hover over a species record

    // #region 5. Click on Coverage Visualization icon
    await samplesPage.clickTaxonCoverageVisualisation(taxon.name);
    // #endregion 5. Click on Coverage Visualization icon

    // #region 7. Click on species title name chevron menu key and observe NCBI information
    const accessionLabel = await samplesPage.getAccessionLabel();
    expect(accessionLabel).toContain("Severe acute respiratory syndrome coronavirus");
    // #endregion 7. Click on species title name chevron menu key and observe NCBI information

    // #region 8. Hover over NCBI reference link and observe tootlip content
    await samplesPage.hoverOverNCBIReferenceLink()
    // #endregion 8. Hover over NCBI reference link and observe tootlip content

    // #region 9. Click on NCBI reference link
    const ncbiPage = await samplesPage.clickNCBIReferenceLink()
    // #endregion 9. Click on NCBI reference link

    // #region 10. Verify NCBI site reference ID and name
    const accessionLabelParts = accessionLabel.split(" ");
    const referenceID = accessionLabelParts[0]

    // CZID and NCBI site information matches:
    // - NCBI reference ID
    const genbankID = await ncbiPage.getGenbankID();
    expect(referenceID).toEqual(genbankID);

    // - Genus name
    const isolate = accessionLabel.split(' isolate ')[1].split(', ')[0]
    const genusNameParts = taxon.name.split(" ");

    const genBankText = await ncbiPage.getGenbankText();
    expect(genBankText).toContain(isolate)
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
    expect(contigFastaDownload.suggestedFilename()).toEqual(`${samleName}_tax_${taxon.id}_contigs.fasta`);
    // #endregion 14. Verify downloads of Contigs (.fasta) and Reads (.fasta) files
  });

});
