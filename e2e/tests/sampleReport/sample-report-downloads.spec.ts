import { chooseBackgroundModel, verifyDownload } from "@e2e/utils/report";
import { test } from "@playwright/test";

test.describe("Sample report download tests - Illumina", () => {
  const stagingSampleId = 25983;

  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${stagingSampleId}`);
    await chooseBackgroundModel(page);
    // todo: uncomment when test id is on staging (smccanny)
    // await applyFilter(page);
  });

  test("Should be able to download outputs from short read mNGS tab", async ({
    page,
  }) => {
    await verifyDownload(page, "Metagenomic", stagingSampleId);
  });

  test("Should be able to outputs from AMR tab", async ({ page }) => {
    await page.getByTestId("antimicrobial-resistance").click();
    await verifyDownload(page, "Antimicrobial Resistance", stagingSampleId);
  });

  test("Should be able to download outputs from Consensus Genome tab", async ({
    page,
  }) => {
    await page.getByTestId("consensus-genome").click();
    await verifyDownload(page, "Consensus Genome", stagingSampleId);
  });

  const stagingSampleId2 = 26001;

  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${stagingSampleId2}`);
  });

  test("Should be able to download outputs from long read mNGS tab", async ({
    page,
  }) => {
    await verifyDownload(page, "Nanopore", stagingSampleId2);
  });
});
