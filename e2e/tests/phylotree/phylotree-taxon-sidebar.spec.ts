import {
  testHistogramAppears,
  testTaxonInfo,
  testTaxonLinks,
} from "@e2e/utils/taxon-sidebar";
import { test } from "@playwright/test";

const phyloTreeId = 244;

// These tests currently verify the Taxon Sidebar on Phylotree Page
test.describe("Taxon Sidebar on Phylotree Page", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/phylo_tree_ngs/${phyloTreeId}`);

    // click Taxon Name
    await page.getByText("Betacoronavirus 1").click();
  });

  test(`Should verify taxon info`, async ({ page }) => {
    await testTaxonInfo(page, {
      taxonName: "Betacoronavirus 1",
      taxonId: "694003",
      taxonDescription:
        "Human coronavirus OC43 is an enveloped, positive-stranded",
      parentDescription:
        "Betacoronaviruses are one of four genera of coronaviruses of the subfamily Coronavirinae",
    });
  });

  test(`Should verify histogram on Taxon sidebar`, async ({ page }) => {
    // histogram does not appear on Phylotree page because there is no background data to compare it to
    await testHistogramAppears(page, false);
  });

  test(`Should verify links on taxon sidebar`, async ({ page }) => {
    await testTaxonLinks(page);
  });
});
