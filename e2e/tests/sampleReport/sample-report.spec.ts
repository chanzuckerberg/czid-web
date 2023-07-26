import { expect, test } from "@playwright/test";
import { ALL_COLUMN_HEADERS, FILTER_HEADERS } from "../../constants/sample";
import {
  metadataSectionTitles,
  pipelineSectionTitles,
  verifySectionTitles,
} from "../../utils/report";
const SAMPLE_ID = 25307;
const IFRAME = "appcues-container iframe";

// These tests verify the ui displayed on the Table  for the sample report page
test.describe("Test Sample Report Header Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${SAMPLE_ID}`);
  });

  // todo: check test after data-testid is in staging (smccanny)
  test(`verify Sample Name Dropdown`, async ({ page }) => {
    // verify that Sample Name Dropdown redirects to correct sample report page
    page.getByTestId("view-header-dropdown").click();
    await page.getByRole("option", { name: "RR004_water_2_S23A_107" }).click();
    expect(page.url()).toBe(`${process.env.BASEURL}/samples/${25598}`);
  });

  // todo: mock data from shorturl api (smccanny)
  test(`verify Share button and Snapshot link`, async ({ page }) => {
    await page.getByRole("button", { name: "Share" }).click();
    setTimeout(async () => {
      const clipboardText: string = await page.evaluate(
        "navigator.clipboard.readText()",
      );
      await page.goto(clipboardText);
    }, 1000);
    expect(page.url()).toContain(`${process.env.BASEURL}/samples/${SAMPLE_ID}`);
  });

  // Download functionality can be found in sample-report-downloads.spec.ts

  // todo: check test after data-testid is in staging (smccanny)
  test(`verify Help button and App Cues panel`, async ({ page }) => {
    await page.getByTestId("help-button").click();
    await expect(page.frameLocator(IFRAME).locator("cue")).toBeVisible();

    await page
      .frameLocator(IFRAME)
      .getByRole("button", { name: "Close modal" })
      .click();
    await expect(page.frameLocator(IFRAME).locator("cue")).not.toBeVisible();
  });

  // Delete functionality can be found in sample-report-delete.spec.ts
  test(`verify Sample Report Filters`, async ({ page }) => {
    const filter = await page.locator(FILTER_HEADERS).allInnerTexts();

    for (let i = 0; i < filter.length; i++) {
      expect(ALL_COLUMN_HEADERS.includes(filter[i])).toBeTruthy();
    }
    const column_header = await page.locator(FILTER_HEADERS).allInnerTexts();

    for (let i = 0; i < column_header.length; i++) {
      expect(ALL_COLUMN_HEADERS.includes(column_header[i])).toBeTruthy();
    }
  });
});

test.describe("Test the Sample Report Sidebar Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${SAMPLE_ID}`);
  });

  test(`verify side bar on the sample report page`, async ({ page }) => {
    await page.getByText("Sample Details").click();
    await expect(page.getByTestId("metadata")).toBeVisible();
    await expect(page.getByTestId("pipelines")).toBeVisible();
    await expect(page.getByTestId("notes")).toBeVisible();

    // verify metadata section titles
    await verifySectionTitles(page, metadataSectionTitles);

    // verify pipeline section titles
    await page.getByTestId("pipelines").click();
    await verifySectionTitles(page, pipelineSectionTitles);
  });
});

test.describe("Test Sample Report Pipeline Version dropdown", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    const SAMPLE_ID = 25653;
    await page.goto(`${process.env.BASEURL}/samples/${SAMPLE_ID}`);
  });

  // function to select pipeline version v7.1 (pipeline version v8.0 is the default)
  async function selectPipelineVersionV7(page) {
    await page.getByTestId("pipeline-version-select").click();
    await page.getByRole("option", { name: "Pipeline v7.1" }).click();
  }

  test(`verify sample report header`, async ({ page }) => {
    // pipeline version v8.0
    await expect(page.getByText("Illumina mNGS Pipeline v8.0")).toBeVisible();

    // pipeline version v7.1
    await selectPipelineVersionV7(page);
    await expect(page.getByText("Illumina mNGS Pipeline v7.1")).toBeVisible();
  });

  test(`verify sample report table`, async ({ page }) => {
    // pipeline version v8.0 has 674 taxon rows
    await expect(page.getByText("674 rows")).toBeVisible();

    // pipeline version v7.1 has 685 taxon rows
    await selectPipelineVersionV7(page);
    await expect(page.getByText("685 rows")).toBeVisible();
  });

  test(`verify coverage viz on the sample report bottom bar`, async ({
    page,
  }) => {
    async function viewKlebsiellaCoverageViz(page) {
      await page.getByText("Klebsiella").nth(0).hover();
      await page.getByTestId("hover-action-coverage-viz-570").click();
    }

    // pipeline version v8.0 has 80 Loose NT reads
    await viewKlebsiellaCoverageViz(page);
    await expect(page.getByText("Loose NT Reads (80)")).toBeVisible();

    // pipeline version v7.1 has 78 Loose NT reads
    await page.reload();
    await selectPipelineVersionV7(page);
    await viewKlebsiellaCoverageViz(page);
    await expect(page.getByText("Loose NT Reads (78)")).toBeVisible();
  });
});
