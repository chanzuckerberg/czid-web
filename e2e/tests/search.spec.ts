import path from "path";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import {
  ENTER,
  METADATA_COUNT_SELECTOR,
  MY_DATA,
  PROJECT_COUNT,
  PROJECT_NAME_SELECTOR,
  PUBLIC_MENU_ITEM,
  RESULT_COUNT_SELECTOR,
  SAMPLES,
  SAMPLE_NAME_SELECTOR,
  SEARCH_PUBLIC,
} from "../utils/constants";
import { getByPlaceholder, getByTestID } from "../utils/selectors";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const projectName = "AMR beta test";
const projectsFound = "132 projects";
const sampleName = "RNAEnr_10e4_viralcopies_RVOPv2_iSeq";
const samplesFound = "5 samples";
test.describe("Search data tests", () => {
  test("Should search projects", async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/${MY_DATA}`);
    await page.locator(getByTestID(PUBLIC_MENU_ITEM)).click();
    await page.locator(getByPlaceholder(SEARCH_PUBLIC)).fill(projectName);
    await page.keyboard.press(ENTER);
    await page.waitForSelector(PROJECT_NAME_SELECTOR);

    // row counts
    expect(await page.locator(PROJECT_NAME_SELECTOR).count()).toBe(1);

    // project count
    expect(await page.locator(getByTestID(PROJECT_COUNT)).textContent()).toBe(
      projectsFound
    );

    // metadata project count
    expect(
      await page.locator(METADATA_COUNT_SELECTOR).nth(1).textContent()
    ).toBe("1");
  });

  test("Should search samples", async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/${MY_DATA}`);
    await page.locator(getByTestID(PUBLIC_MENU_ITEM)).click();
    await page.locator(getByTestID(SAMPLES.toLowerCase())).click();
    await page.locator(getByPlaceholder(SEARCH_PUBLIC)).fill(sampleName);
    await page.keyboard.press(ENTER);
    await page.waitForSelector(SAMPLE_NAME_SELECTOR);

    // sample count
    expect(await page.locator(RESULT_COUNT_SELECTOR).textContent()).toBe(
      samplesFound
    );

    // metadata sample count
    expect(
      await page.locator(METADATA_COUNT_SELECTOR).nth(0).textContent()
    ).toBe("5");
  });
});
