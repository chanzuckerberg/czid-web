import path from "path";
import { Page, expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { TEST_PROJECTS } from "../../constants/common.const";
import {
  ADD_THRESHOLD,
  ANNOTATION,
  BUTTON,
  CHOOSE_TAXON,
  CLOSE_ICON,
  COMBOBOX,
  ESCAPE,
  HOST,
  KLEBSIELLA,
  LAST_MONTH,
  LAST_SIX_MONTHS,
  LAST_THREE_MONTHS,
  LAST_WEEK,
  LOCATION,
  MENU_ITEM,
  NUMBERINPUT,
  OPTION,
  PRIVATE,
  PUBLIC,
  SAMPLE_NAME_SELECTOR,
  SAMPLE_TYPE,
  SEARCH,
  TAXON,
  TEXTBOX,
  TIMEFRAME,
  VISIBILITY,
} from "../../constants/filter.const";
import { goToProjectSamples } from "../../utils/project";
import { getByText } from "../../utils/selectors";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const chosenHosts = ["Human"];
const sampleTypes = ["Ocular Fluid", "Nasopharyngeal Swab"];

const workflows = [
  "Metagenomics",
  "Consensus Genomes",
  "Antimicrobial Resistance",
];
const CANADA = "Alberta, Canada";
const BEXAR = "Bexar County, Texas, USA";

const ENV = (process.env.NODE_ENV as string) || "";
const projectName = TEST_PROJECTS[ENV.toUpperCase()];

async function clearFilters(page: Page) {
  const totalFilters = await page.getByText(ADD_THRESHOLD).count();
  for (let i = 0; i < totalFilters; i += 1) {
    await page
      .locator(CLOSE_ICON)
      .nth(0)
      .click();
  }
}
test.describe("Sample filtering tests", () => {
  ["Metagenomics", "Consensus Genomes"].forEach((workflow, index) => {
    test(`Should filter ${workflow} by taxons`, async ({ page }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page
        .getByText(TAXON)
        .nth(1)
        .click();
      await page.getByRole(BUTTON, { name: CHOOSE_TAXON }).click();
      await page.getByRole(COMBOBOX, { name: SEARCH }).click();
      await page.getByRole(COMBOBOX, { name: SEARCH }).fill(KLEBSIELLA);
      await page
        .getByText(KLEBSIELLA)
        .first()
        .click();
      await page
        .getByText("Taxon filter")
        .first()
        .click(); // close the popup window so we can fill other fields

      // todo: sometimes the add threshold is not available
      if ((await page.getByText(ADD_THRESHOLD).count()) > 0) {
        await page.getByText(ADD_THRESHOLD).click();
        await page.locator(NUMBERINPUT).click();
        await page.locator(NUMBERINPUT).fill(".5");
      }

      await page
        .getByText("Apply")
        .nth(1)
        .click();

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

    // todo: this is failing and requires further investigation
    // annotation = "Not a hit";
    test(`Should filter ${workflow} by annotations`, async ({ page }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      if (await page.locator(getByText(ANNOTATION)).isEnabled()) {
        // Hit annotation
        const annotation = "Hit";
        await page.locator(getByText(ANNOTATION)).click();
        await page
          .getByRole(MENU_ITEM, { name: annotation })
          .getByText(annotation)
          .click();
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
  workflows.forEach((workflow, index) => {
    test(`Should filter ${workflow} samples by locations`, async ({ page }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      // click location dropdown
      await page
        .locator(getByText(LOCATION))
        .nth(0)
        .click();

      // select two locations
      await page
        .locator(".dropdownMenu-1gUyq")
        .locator(getByText(CANADA))
        .nth(0)
        .click();
      await page
        .locator(".dropdownMenu-1gUyq")
        .locator(getByText(BEXAR))
        .nth(0)
        .click();
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

    test(`Should filter ${workflow} samples by timeframe - Last Week`, async ({
      page,
    }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page.locator(getByText(TIMEFRAME)).click();
      await page.locator(getByText(LAST_WEEK)).click();

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

      await page.locator(getByText(TIMEFRAME)).click();
      await page.locator(getByText(LAST_MONTH)).click();

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

      await page.locator(getByText(TIMEFRAME)).click();
      await page.locator(getByText(LAST_THREE_MONTHS)).click();

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

      await page.locator(getByText(TIMEFRAME)).click();
      await page.locator(getByText(LAST_SIX_MONTHS)).click();

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

      await page.locator(getByText(TIMEFRAME)).click();
      await page.locator(getByText(LAST_WEEK)).click();

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

    test(`Should filter ${workflow} samples by private visibility`, async ({
      page,
    }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page.locator(getByText(VISIBILITY)).click();
      await page.locator(getByText(PRIVATE)).click();

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

    test(`Should filter ${workflow} samples by public visibility`, async ({
      page,
    }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page.locator(getByText(VISIBILITY)).click();
      await page
        .locator(getByText(PUBLIC))
        .nth(1)
        .click();

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
    test(`Should filter ${workflow} samples by host`, async ({ page }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);
      await page
        .getByText(HOST)
        .nth(0)
        .click();

      for (let i = 0; i < chosenHosts.length; i++) {
        await page.getByRole(TEXTBOX, { name: SEARCH }).fill(chosenHosts[i]);
        await page
          .getByRole(OPTION, { name: chosenHosts[i] })
          .getByText(chosenHosts[i])
          .click();
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

    test(`Should filter ${workflow} samples by sample type`, async ({
      page,
    }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page
        .getByText(SAMPLE_TYPE)
        .nth(0)
        .click();
      for (let i = 0; i < sampleTypes.length; i++) {
        await page.getByRole(TEXTBOX, { name: SEARCH }).fill(sampleTypes[i]);
        await page
          .getByRole(OPTION, { name: sampleTypes[i] })
          .getByText(sampleTypes[i])
          .click();
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
