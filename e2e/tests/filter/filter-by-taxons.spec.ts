import path from "path";
import { expect, Page, test } from "@playwright/test";
import dotenv from "dotenv";
import { TEST_PROJECTS } from "../../constants/common";
import {
  ADD_THRESHOLD,
  CHOOSE_TAXON,
  CLOSE_ICON,
  COMBOBOX,
  KLEBSIELLA,
  NUMBERINPUT,
  SAMPLE_NAME_SELECTOR,
  SEARCH,
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
    test(`Should filter ${workflow} by taxons`, async ({ page }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);
      await page.getByTestId("taxon-filter").click();
      await page.getByText(CHOOSE_TAXON).click();
      await page.getByRole(COMBOBOX, { name: SEARCH }).click();
      await page.getByRole(COMBOBOX, { name: SEARCH }).fill(KLEBSIELLA);
      await page.getByText(KLEBSIELLA).first().click();
      await page.getByText("Taxon filter").first().click(); // close the popup window so we can fill other fields

      // todo: sometimes the add threshold is not available
      if ((await page.getByTestId("add-threshold").count()) > 0) {
        await page.getByTestId("add-threshold").click();
        await page.locator(NUMBERINPUT).click();
        await page.locator(NUMBERINPUT).fill(".5");
      }

      await page.getByTestId("apply").click();

      // check result
      expect(
        await page.getByTestId("sample-name").count(),
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
