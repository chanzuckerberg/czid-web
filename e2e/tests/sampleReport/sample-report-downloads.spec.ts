import { test } from "@playwright/test";
import { chooseBackgroundModel, verifyDownload } from "../../utils/report";

test.describe("Sample report downloand tests - Illumina", () => {
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

});

test.describe("Sample Report Download Tests - Nanopore", () => {
  const stagingSampleId = 26001;

  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${stagingSampleId}`);
  });

  test("Should be able to download outputs from long read mNGS tab", async ({
    page,
  }) => {
    await verifyDownload(page, "Nanopore", stagingSampleId);
  });
});

