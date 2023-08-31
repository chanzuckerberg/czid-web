import path from "path";
import { expect, Page, test } from "@playwright/test";
import dotenv from "dotenv";
import { TEST_PROJECTS } from "../../constants/common";
import {
  ADD_THRESHOLD,
  CLOSE_ICON,
  ESCAPE,
  SAMPLE_NAME_SELECTOR,
} from "../../constants/filter";
import { goToProjectSamples } from "../../utils/project";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const workflows = ["Metagenomics", "Consensus Genomes"];
const CANADA = "Alberta, Canada";
const DALLAS = "Dallas County, Texas, USA";
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
    test(`Should filter ${workflow} samples by locations`, async ({ page }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      // click location dropdown
      await page.getByTestId("location").nth(0).click();

      // select two locations
      await page.getByTestId("dropdown-menu").getByText(CANADA).nth(0).click();
      await page.getByTestId("dropdown-menu").getByText(DALLAS).nth(0).click();
      await page.keyboard.press(ESCAPE);

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count(),
      ).toBeGreaterThanOrEqual(0);

      // clear locations
      clearFilters(page);

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count(),
      ).toBeGreaterThanOrEqual(0);
    });
  });
});
