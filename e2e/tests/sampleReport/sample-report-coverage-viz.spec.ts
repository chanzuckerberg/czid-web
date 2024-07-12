import { WORKFLOWS } from "@e2e/constants/common";
import { test } from "@playwright/test";
import { SamplesPage } from "../../page-objects/samples-page";
import { ProjectPage } from "../../page-objects/project-page";

let taxon = null;
let sample = null;
let samplesPage = null;

test.describe("Coverage Viz Smoke Tests", () => {

  test.beforeEach(async ({ page }) => {
    // #region Get a random completed sample
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.LMNGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.LMNGS);
    const samplesNames = Object.keys(await projectPage.getSamplesTableOrderedByName());

    samplesPage = new SamplesPage(page);
    let samples = await samplesPage.getCompletedSamples(project.name, samplesNames);
    samples = samples.filter(sample => sample.name.includes("28A-idseq-mosq.2to4mil_subsample"));
    sample = samples[Math.floor(Math.random() * samples.length)];
    // #endregion Get a random completed sample

    // #region Go to the sample report page
    await samplesPage.navigate(sample.id);

    await samplesPage.clickExpandAll();
    // #endregion Go to the sample report page

    // #region Pick a random taxon
    const reportTable = await samplesPage.getReportFilterTable()
    const taxons = await samplesPage.getTaxonsFromReport(
      await samplesPage.getReportV2(sample.id));
    taxon = taxons.filter(taxon => reportTable[0].Taxon.includes(taxon.name) && taxon.name)[0]
    // #endregion Pick a random taxon

    // #region Click "coverage visualisation" on a taxon
    await samplesPage.clickTaxonCoverageVisualisation(taxon.name);
    // #endregion Click "coverage visualisation" on a taxon
  });

  /**
   * Verify the popup for the coverage visualisation is visible after clicking the icon
   *
   * A popup showing the coverage visualisation for that specific organism should be showed
   */
  test(`Smoke Test: Verify the popup for the coverage visualisation is visible after clicking the icon`, async () => {
    await samplesPage.validateCoverageVisualisationVisible(taxon.name);
  });

  /**
   * Verify user is able to select the "BLAST" option
   *
   * A popup prompting user to select the Blast type should be shown
   */
  test(`Smoke Test: Verify user is able to select the "BLAST" option`, async () => {
    await samplesPage.clickBlastButton();
    await samplesPage.validateBlastSelectionModalVisible();
  });

  /**
   * Verify user is able to download "Contig Fasta"
   *
   * The appropriate fasta file should be downloaded
   */
  test(`Smoke Test: Verify user is able to download "Contig Fasta"`, async () => {
    await samplesPage.validateContigFastaDownload(sample, taxon);
  });
});
