import { test } from "@playwright/test";
import { testHistogramAppears, testTaxonInfo, testTaxonLinks } from "../../utils/taxon-sidebar";

const sampleId1 = 25747;
const sampleId2 = 25746;

// These tests currently verify the Taxon Sidebar on Heatmap
test.describe("Taxon Sidebar on Heatmap", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/visualizations/heatmap?sampleIds[]=${sampleId1}&sampleIds[]=${sampleId2}`);
    // click Taxon Name
    await page.getByTestId("row-label").getByText("Klebsiella pneumoniae").click();
  });

  test(`Should verify taxon info`, async ({ page }) => {
    await testTaxonInfo(page, {
      taxonName: "Klebsiella pneumoniae",
      taxonId: "573",
      taxonDescription: "Klebsiella pneumoniae is a Gram-negative, non-motile,",
      parentDescription:
        "Klebsiella is a genus of nonmotile, Gram-negative, oxidase-negative, rod-shaped bacteria with a prominent polysaccharide-based capsule.",
    });
  });

  test(`Should verify histogram on Taxon sidebar`, async ({ page }) => {
    await testHistogramAppears(page, false);
  });

  test(`Should verify links on taxon sidebar`, async ({ page }) => {
    await testTaxonLinks(page);
  });
});