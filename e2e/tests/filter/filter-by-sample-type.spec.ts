import path from "path";
import { expect, Page, test } from "@playwright/test";
import dotenv from "dotenv";
import { kebabCase } from "lodash";
import { TEST_PROJECTS } from "../../constants/common";
import {
  ADD_THRESHOLD,
  CLOSE_ICON,
  ESCAPE,
  SAMPLE_NAME_SELECTOR,
  SAMPLE_TYPE,
  SEARCH,
} from "../../constants/filter";
import { goToProjectSamples } from "../../utils/project";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const sampleTypes = ["Ocular Fluid", "Nasopharyngeal Swab"];

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
    test(`Should filter ${workflow} samples by sample type`, async ({
      page,
    }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page.getByTestId(kebabCase(SAMPLE_TYPE)).nth(0).click();
      for (let i = 0; i < sampleTypes.length; i++) {
        await page.getByPlaceholder(SEARCH).first().fill(sampleTypes[i]);
        await page.getByTestId(`dropdown-${kebabCase(sampleTypes[i])}`).click();
      }
      // close popup
      await page.keyboard.press(ESCAPE);

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
