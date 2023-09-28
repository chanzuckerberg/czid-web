import {
  ENTER,
  METADATA_COUNT_SELECTOR,
  PROJECT_COUNT,
  PROJECT_NAME_SELECTOR,
  PUBLIC_MENU_ITEM,
  SAMPLES,
  SAMPLE_COUNT,
  SEARCH_PUBLIC,
} from "@e2e/constants/common";
import { SAMPLE_NAME_SELECTOR } from "@e2e/constants/filter";
import { expect, test } from "@playwright/test";

const projectName = "AMR beta test";
const sampleName = "RNAEnr_10e4_viralcopies_RVOPv2_iSeq";
test.describe("Search data tests", () => {
  test("Should search projects", async ({ page }) => {
    await page.goto(`${process.env.BASEURL}`);
    await page.getByTestId(PUBLIC_MENU_ITEM).click();
    await page.getByPlaceholder(SEARCH_PUBLIC).fill(projectName);
    await page.keyboard.press(ENTER);
    await page.waitForSelector(PROJECT_NAME_SELECTOR);

    // row counts
    expect(
      await page.locator(PROJECT_NAME_SELECTOR).count(),
    ).toBeGreaterThanOrEqual(1);

    // project count
    const projectCount = String(
      await page.getByTestId(PROJECT_COUNT).textContent(),
    ).replace(/\D/g, "");
    expect(Number(projectCount)).toBeGreaterThanOrEqual(1);

    // metadata project count
    const metadataProjectCount = String(
      await page.locator(METADATA_COUNT_SELECTOR).nth(0).textContent(),
    ).replace(/\D/g, "");
    expect(Number(metadataProjectCount)).toBeGreaterThanOrEqual(1);
  });

  test("Should search samples", async ({ page }) => {
    await page.goto(`${process.env.BASEURL}`);
    await page.getByTestId(PUBLIC_MENU_ITEM).click();
    await page.getByTestId(SAMPLES.toLowerCase()).nth(0).click();
    await page.getByPlaceholder(SEARCH_PUBLIC).fill(sampleName);
    await page.keyboard.press(ENTER);
    await page.waitForSelector(SAMPLE_NAME_SELECTOR);

    // sample count
    const sampleCount = String(
      await page.locator(SAMPLE_COUNT).nth(0).textContent(),
    ).replace(/\D/g, "");
    expect(Number(sampleCount)).toBeGreaterThanOrEqual(1);

    // metadata sample count
    const metadataSampleCount = String(
      await page.locator(METADATA_COUNT_SELECTOR).nth(0).textContent(),
    ).replace(/\D/g, "");
    expect(Number(metadataSampleCount)).toBeGreaterThanOrEqual(1);
  });
});
