import path from "path";
import { expect, Page, test } from "@playwright/test";
import dotenv from "dotenv";
import { kebabCase } from "lodash";
import { TEST_PROJECTS } from "../../constants/common";
import {
  ADD_THRESHOLD,
  CLOSE_ICON,
  LAST_MONTH,
  LAST_SIX_MONTHS,
  LAST_THREE_MONTHS,
  LAST_WEEK,
  SAMPLE_NAME_SELECTOR,
  TIMEFRAME,
} from "../../constants/filter";
import { goToProjectSamples } from "../../utils/project";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const workflows = ["Metagenomics", "Consensus Genomes"];

const ENV = (process.env.NODE_ENV as string) || "";
const projectName = TEST_PROJECTS[ENV.toUpperCase()];

async function clearFilters(page: Page) {
  const totalFilters = await page.getByText(ADD_THRESHOLD).count();
  for (let i = 0; i < totalFilters; i += 1) {
    await page.locator(CLOSE_ICON).nth(0).click();
  }
}
test.describe("Sample filtering tests", () => {
  workflows.forEach((workflow, index) => {
    test(`Should filter ${workflow} samples by timeframe - Last Week`, async ({
      page,
    }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page.getByTestId("timeframe").first().click();
      await page.getByTestId(kebabCase(LAST_WEEK)).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count(),
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      clearFilters(page);

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count(),
      ).toBeGreaterThanOrEqual(0);
    });

    test(`Should filter ${workflow} samples by timeframe - Last Month`, async ({
      page,
    }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page.getByText(TIMEFRAME).first().click();
      await page.getByText(LAST_MONTH).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count(),
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      clearFilters(page);

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count(),
      ).toBeGreaterThanOrEqual(0);
    });

    test(`Should filter ${workflow} samples by timeframe - Last 3 Months`, async ({
      page,
    }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page.getByText(TIMEFRAME).first().click();
      await page.getByText(LAST_THREE_MONTHS).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count(),
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      clearFilters(page);

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count(),
      ).toBeGreaterThanOrEqual(0);
    });

    test(`Should filter ${workflow} samples by timeframe - Last 6 months`, async ({
      page,
    }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page.getByText(TIMEFRAME).first().click();
      await page.getByText(LAST_SIX_MONTHS).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count(),
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      clearFilters(page);

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count(),
      ).toBeGreaterThanOrEqual(0);
    });

    test(`Should filter ${workflow} samples by timeframe - Last Year`, async ({
      page,
    }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page.getByTestId(kebabCase(TIMEFRAME)).first().click();
      await page.getByTestId(kebabCase(LAST_WEEK)).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count(),
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      clearFilters(page);

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count(),
      ).toBeGreaterThanOrEqual(0);
    });
  });
});
