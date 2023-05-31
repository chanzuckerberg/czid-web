import { test } from "@playwright/test";
import {
  verifyDeleteAvailable,
  verifyDeleteDisabled,
} from "../../utils/report";

test.describe("My Illumina sample report pipeline run deletion tests", () => {
  const stagingSampleId = 25983;

  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${stagingSampleId}`);
  });

  test("Should be able to delete run on short read mNGS tab", async ({
    page,
  }) => {
    await verifyDeleteAvailable(page, "mNGS", "Metagenomic");
  });

  test("Should be able to delete run on Consensus Genome tab", async ({
    page,
  }) => {
    await page.getByTestId("consensus-genome").click();
    // verify overflow button visible
    await verifyDeleteAvailable(page, "CG", "Consensus Genome");
  });

  test("Should be able to delete run on AMR tab", async ({ page }) => {
    await page.getByTestId("antimicrobial-resistance").click();
    await verifyDeleteAvailable(page, "AMR", "Antimicrobial Resistance");
  });
});

test.describe("Another user's Illumina sample report deletion tests", () => {
  const stagingSampleId = 26101;

  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${stagingSampleId}`);
  });

  test("Delete run should be disabled for short read mNGS tab", async ({
    page,
  }) => {
    await verifyDeleteDisabled(page, "mNGS");
  });

  test("Delete run should be disabled for consensus genome tab", async ({
    page,
  }) => {
    await page.getByTestId("consensus-genome").click();
    await verifyDeleteDisabled(page, "CG");
  });

  test("Delete run should be disabled for AMR tab", async ({ page }) => {
    await page.getByTestId("antimicrobial-resistance").click();
    await verifyDeleteDisabled(page, "AMR");
  });
});

test.describe("My Nanopore sample report deletion tests", () => {
  const stagingSampleId = 26001;

  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${stagingSampleId}`);
  });

  test("Should be able to delete run on long read mNGS tab", async ({
    page,
  }) => {
    await verifyDeleteAvailable(page, "mNGS", "Nanopore");
  });
});

test.describe("Another user's Nanopore sample report deletion tests", () => {
  const stagingSampleId = 26097;

  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${stagingSampleId}`);
  });

  test("Delete run should be disabled for nanopore tab", async ({ page }) => {
    await verifyDeleteDisabled(page, "mNGS");
  });
});
