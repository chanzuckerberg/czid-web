import { WORKFLOWS } from "@e2e/constants/common";
import { test } from "@playwright/test";
import { SamplesPage } from "../../page-objects/samples-page";

let taxon = null;
let sample = null;
let samplesPage = null;

test.describe("Coverage Viz Smoke Tests", () => {

  test.beforeEach(async ({ page }) => {
    // #region Get a random completed sample
    samplesPage = new SamplesPage(page);
    sample = await samplesPage.getRandomCompletedSample(`automation_project_${WORKFLOWS.LMNGS}`);
    // #endregion Get a random completed sample

    // #region Go to the sample report page
    await samplesPage.navigate(sample.id);

    await samplesPage.clickExpandAll();
    // #endregion Go to the sample report page

    // #region Pick a random taxon
    const taxons = await samplesPage.getTaxonsFromReport(
      await samplesPage.getReportV2(sample.id));
    taxon = taxons[Math.floor(Math.random() * taxons.length)];
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
