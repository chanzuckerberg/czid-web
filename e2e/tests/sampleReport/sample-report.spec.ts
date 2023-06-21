import { expect, test } from "@playwright/test";
import {
  ALL_COLUMN_HEADERS,
  FILTER_HEADERS,
} from "../../constants/sample.const";
import {
  metadataSectionTitles,
  pipelineSectionTitles,
  verifySectionTitles,
} from "../../utils/report";
const sampleId = 25307;

// These tests verify the ui displayed on the Table  for the sample report page
test.describe("Test Sample Report Header Functionality", () => {
    test.beforeEach(async ({ page }) => {
      // go to sample page
      await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);
    });

    // todo: check test after data-testid is in staging (smccanny)
    test(`verify Sample Name Dropdown`, async ({ page }) => {
       // verify that Sample Name Dropdown redirects to correct sample report page
       page.getByTestId("view-header-dropdown").click();
       await page.getByRole("option", { name: "RR004_water_2_S23A_107" }).click();
       expect(page.url()).toBe(`${process.env.BASEURL}/samples/${25598}`);
    });

    // todo: mock data from shorturl api (smccanny)
    test.fixme(`verify Share button and Snapshot link`, async ({ page }) => {
      await page.getByRole("button", { name: "Share" }).click();
      setTimeout(async () => {
        const clipboardText: string = await page.evaluate("navigator.clipboard.readText()");
        await page.goto(clipboardText);
      }, 1000);
      expect(page.url()).toContain(`${process.env.BASEURL}/samples/${sampleId}`);
    });

    // Download functionality can be found in sample-report-downloads.spec.ts

    // todo: check test after data-testid is in staging (smccanny)
    test.fixme(`verify Help button and App Cues panel`, async ({ page }) => {
      await page.getByTestId("help-button").click();
      await expect(page.frameLocator("iframe[title='Modal']").locator("cue")).toBeVisible();
      await page.frameLocator("iframe[title='Modal']").getByRole("button", { name: "Close modal" }).click();
      await expect(page.frameLocator('iframe[title="Modal"]').locator("cue")).not.toBeVisible();
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
      await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);
    });

    test(`Should verify side bar on the sample report page`, async ({ page }) => {
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
    const sampleId = 25653;
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);
  });
  test.only(`verify Pipeline Version dropdown`, async ({ page }) => {
    // await expect(page.getByTestId("pipeline-version-select")).toHaveText("Illumina mNGS Pipeline v8.0");
    await page.getByTestId("pipeline-version-select").click();
    await page.getByRole("option", { name: "Pipeline v7.1" }).click();
    await expect(page.getByText("Klebsiella")).toBeVisible();
  });
});
