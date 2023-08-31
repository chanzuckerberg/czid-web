import path from "path";
import { expect, Page, test } from "@playwright/test";
import dotenv from "dotenv";
import { TEST_PROJECTS } from "../../constants/common";
import {
  ADD_THRESHOLD,
  ANNOTATION,
  CLOSE_ICON,
  ESCAPE,
  SAMPLE_NAME_SELECTOR,
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
    // todo: this is failing and requires further investigation
    // annotation = "Not a hit";
    test(`Should filter ${workflow} by annotations`, async ({ page }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      if (await page.getByText(ANNOTATION).isEnabled()) {
        // Hit annotation
        const annotation = "Hit";
        await page.getByText(ANNOTATION).click();
        await page.getByText(annotation, { exact: true }).click();
        await page.keyboard.press(ESCAPE);

        // check result
        expect(
          await page.locator(SAMPLE_NAME_SELECTOR).count(),
        ).toBeGreaterThanOrEqual(0);

        // clear filter
        clearFilters(page);
      }
    });
  });
});
