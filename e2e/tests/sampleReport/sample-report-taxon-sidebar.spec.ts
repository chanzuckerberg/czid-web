import { test } from "@playwright/test";
import {
  testHistogramAppears,
  testTaxonInfo,
  testTaxonLinks,
} from "../../utils/taxon-sidebar";

const sampleId = 25307;

// These tests currently verify the Taxon Sidebar on Sample Report
test.describe("Taxon Sidebar on Sample Report", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);

    await page.getByText("Sample Details").click();
    // choose Background
    await page.getByTestId("background-filter").click();

    await page.getByTestId("test-background-model-standard-dropdown").click();
    await page.getByTestId("expand-taxon-parent").nth(0).click();

    // click Taxon Name
    await page.getByText("Klebsiella pneumoniae").click();
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
    await testHistogramAppears(page, true);
  });

  test(`Should verify links on taxon sidebar`, async ({ page }) => {
    await testTaxonLinks(page);
  });
});
