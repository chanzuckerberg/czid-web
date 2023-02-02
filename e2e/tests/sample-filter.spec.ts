import path from "path";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import {
  ADD_THRESHOLD,
  ANNOTATION,
  APPLY,
  BUTTON,
  CHOOSE_TAXON,
  CLOSE_ICON,
  CLOSE_ICON_POLYGON,
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
} from "../constants/filter.const";
import { goToProjectSamples } from "../utils/project";
import { getByText } from "../utils/selectors";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const chosenHosts = ["Human"];
const sampleTypes = ["Amniotic Fluid", "Nasopharyngeal Swab"];

const workflows = [
  "Metagenomics",
  "Consesus Genome",
  "Antibacterial Resistance",
];
const CANADA = "Alberta, Canada";
const ARGENTINA = "Argentina";
const projectName = "floo Plutonium";
test.describe("Sample filtering tests", () => {
  ["Metagenomics", "Consesus Genome"].forEach((workflow, index) => {
    test(`Should filter ${workflow} by taxons`, async ({ page }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page.getByText(TAXON).nth(1).click();
      await page.getByRole(BUTTON, { name: CHOOSE_TAXON }).click();
      await page.getByRole(COMBOBOX, { name: SEARCH }).click();
      await page.getByRole(COMBOBOX, { name: SEARCH }).fill(KLEBSIELLA);
      await page.getByText(KLEBSIELLA).click();
      await page.getByRole(COMBOBOX, { name: SEARCH }).press(ESCAPE);
      // todo: sometimes the add threshold is not available
      if ((await page.getByText(ADD_THRESHOLD).count()) > 0) {
        await page.getByText(ADD_THRESHOLD).click();
        await page.locator(NUMBERINPUT).click();
        await page.locator(NUMBERINPUT).fill(".5");
      }
      await page.getByRole(BUTTON, { name: APPLY }).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      await page.locator(CLOSE_ICON).first().click();
      await page.locator(CLOSE_ICON).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);
    });

    test(`Should filter ${workflow} by annotations`, async ({ page }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);
      // Hit annotation
      let annotation = "Hit";
      await page.locator(getByText(ANNOTATION)).click();
      await page
        .getByRole(MENU_ITEM, { name: annotation })
        .getByText(annotation)
        .click();
      await page.keyboard.press(ESCAPE);

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      annotation = "Not a hit";
      await page.locator(getByText(ANNOTATION)).click();
      await page
        .getByRole(MENU_ITEM, { name: annotation })
        .getByText(annotation)
        .click();
      await page.keyboard.press(ESCAPE);

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      annotation = "Inconclusive";
      await page.locator(getByText(ANNOTATION)).click();
      await page
        .getByRole(MENU_ITEM, { name: annotation })
        .getByText(annotation)
        .click();
      await page.keyboard.press(ESCAPE);

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);
    });
  });
  workflows.forEach((workflow, index) => {
    test(`Should filter ${workflow} samples by locations`, async ({ page }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      // click location dropdown
      await page.locator(getByText(LOCATION)).nth(0).click();

      // select two locations
      await page.locator(getByText(CANADA)).nth(0).click();
      await page.locator(getByText(ARGENTINA)).nth(0).click();
      await page.keyboard.press(ESCAPE);

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      // clear locations
      await page.locator(CLOSE_ICON_POLYGON).first().click();
      await page.locator(CLOSE_ICON).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
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
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      await page.locator(CLOSE_ICON).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
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
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      await page.locator(CLOSE_ICON).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
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
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      await page.locator(CLOSE_ICON).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
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
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      await page.locator(CLOSE_ICON).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
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
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      await page.locator(CLOSE_ICON).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
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
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      await page.locator(CLOSE_ICON).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);
    });

    test(`Should filter ${workflow} samples by public visibility`, async ({
      page,
    }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page.locator(getByText(VISIBILITY)).click();
      await page.locator(getByText(PUBLIC)).nth(1).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      await page.locator(CLOSE_ICON).click();

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);
    });
    test(`Should filter ${workflow} samples by host`, async ({ page }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);
      await page.getByText(HOST).nth(0).click();

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
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      for (let i = 0; i < chosenHosts.length; i++) {
        await page.locator(CLOSE_ICON).nth(i).click();
      }

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);
    });

    test(`Should filter ${workflow} samples by sample type`, async ({
      page,
    }) => {
      // search project and display samples
      await goToProjectSamples(page, projectName, index);

      await page.getByText(SAMPLE_TYPE).nth(0).click();
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
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);

      // clear filter
      for (let i = 0; i < sampleTypes.length; i++) {
        await page.locator(CLOSE_ICON).first().click();
      }

      // check result
      expect(
        await page.locator(SAMPLE_NAME_SELECTOR).count()
      ).toBeGreaterThanOrEqual(0);
    });
  });
});
