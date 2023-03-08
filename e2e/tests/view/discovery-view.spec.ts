import path from "path";
import { Page, expect, test } from "@playwright/test";
import dotenv from "dotenv";
import {
  VISIBLE,
  OVERALL,
  SAMPLE_TYPE,
  METAGENOMICS,
  ANTIMICROBIAL_RESISTANCE,
  CANCEL_ICON,
  FILTER_TAG,
  OVERALL_AREA,
  DATE_CREATED_S,
  METADATA,
  AVG_READS_PER_SAMPLE,
  AVG_READS_FILTER_PER_SAMPLE,
  SAMPLES_COLUMN,
  COLUMNS_LABEL,
  SIDE_LABELS,
  SIDE_HEADERS,
  VIEW_ICON,
  BUTTONS,
  METADATA_FILTER,
  BAR_LABEL,
  DATE_CREATED,
  CONSENSUS_GENOMES,
  DATE_LABEL,
  DESCRIPTION,
  SAMPLES,
  NUMBER_OF_COLUMN,
  CHECKED_BOX,
  EDIT,
  MYDATA,
  FILTERS,
  HIDDEN,
  TEST_PROJECTS,
  PROJECTS,
} from "../../constants/common.const";

import {
  ANNOTATION,
  LOCATION,
  TIMEFRAME,
  VISIBILITY,
  HOST,
} from "../../constants/filter.const";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const sampleTypes = [METAGENOMICS];

const ENV = (process.env.NODE_ENV as string) || "";
const baseUrl = (process.env.BASEURL as string) || "";
const projectName = TEST_PROJECTS[ENV.toUpperCase()];
const url =
  "public?currentDisplay=table&currentTab=samples&mapSidebarTab=summary&projectId=875&showFilters=true&showStats=true&workflow=short-read-mngs";
async function getTextOnly(page: Page, id: string) {
  return (await page.getByTestId(id).textContent()).replace(/[0-9]/g, "");
}
async function verifyElement(page: Page, n: number, locator: string) {
  for (let i = 0; i < n; i++) {
    await expect.soft(page.locator(locator).nth(i)).toBeVisible();
  }
}

// These tests verifies Ui elements displayed on the discovery view like header, side bars, bar charts and graphs
test.describe("Discovery view tests", () => {
  test.beforeEach(async ({ page }) => {
    const fullUrl = `${baseUrl}/${url}`;
    await page.goto(fullUrl);
  });
  sampleTypes.forEach(sampleType => {
    test(`Should display left side content for ${sampleType}`, async ({
      page,
    }) => {
      // verify left side content
      await expect(page.locator(".name-2XtnE")).toHaveText(projectName);
      await expect(page.locator(".filterLabel-1PFBn")).toHaveText(ANNOTATION);
      await expect(page.locator(METADATA_FILTER).nth(0)).toHaveText(LOCATION);
      await expect(page.locator(METADATA_FILTER).nth(1)).toHaveText(TIMEFRAME);
      await expect(page.locator(METADATA_FILTER).nth(2)).toHaveText(VISIBILITY);
      await expect(page.locator(METADATA_FILTER).nth(3)).toHaveText(HOST);
      await expect(page.locator(METADATA_FILTER).nth(4)).toHaveText(
        SAMPLE_TYPE,
      );
    });
    test(`Should display main content of for ${sampleType}`, async ({
      page,
    }) => {
      // verify header on main area
      expect(await getTextOnly(page, "metagenomics")).toBe(METAGENOMICS);

      expect(await getTextOnly(page, "consensus-genomes")).toBe(
        CONSENSUS_GENOMES,
      );

      expect(await getTextOnly(page, "antimicrobial-resistance")).toBe(
        "Antimicrobial ResistanceBETA",
      );

      if (sampleType === METAGENOMICS) {
        await verifyElement(page, 3, VIEW_ICON);
      }
      if (sampleType === CONSENSUS_GENOMES) {
        await verifyElement(page, 2, VIEW_ICON);
      }
      if (sampleType === ANTIMICROBIAL_RESISTANCE) {
        await verifyElement(page, 2, VIEW_ICON);
      }

      if (sampleType === METAGENOMICS) {
        await verifyElement(page, 4, BUTTONS);
      }
      if (sampleType === CONSENSUS_GENOMES) {
        await verifyElement(page, 2, BUTTONS);
      }
      if (sampleType === ANTIMICROBIAL_RESISTANCE) {
        await verifyElement(page, 1, BUTTONS);
      }
    });

    test(`Should display right side content for ${sampleType}`, async ({
      page,
    }) => {
      await expect(page.locator(".plusIcon-1OBta")).toBeVisible();
      await expect(page.locator(".title-3Oy38")).toHaveText(DESCRIPTION);

      // user cannot edit public description
      if (page.url().includes(MYDATA)) {
        await expect(page.getByText(EDIT)).toBeVisible();
      }

      // verify header on side area
      await expect(page.locator(SIDE_HEADERS).first()).toHaveText(OVERALL);
      await expect(page.locator(SIDE_HEADERS).nth(1)).toHaveText(
        DATE_CREATED_S,
      );
      await expect(page.locator(SIDE_HEADERS).nth(2)).toHaveText(METADATA);

      // verify  side -role labels
      await expect(page.locator(SIDE_LABELS).nth(0)).toHaveText(SAMPLES);
      await expect(page.locator(SIDE_LABELS).nth(1)).toHaveText(PROJECTS);
      await expect(page.locator(SIDE_LABELS).nth(2)).toHaveText(
        AVG_READS_PER_SAMPLE,
      );
      await expect(page.locator(SIDE_LABELS).nth(3)).toHaveText(
        AVG_READS_FILTER_PER_SAMPLE,
      );
      await expect(page.locator(SIDE_LABELS).nth(4)).toHaveText(HOST);
      await expect(page.locator(SIDE_LABELS).nth(5)).toHaveText(SAMPLE_TYPE);
      await expect(page.locator(SIDE_LABELS).nth(6)).toHaveText(LOCATION);
    });
    test(`Should add/delete columns of discovery view  ${sampleType}`, async ({
      page,
    }) => {
      // Open column
      await page.locator(".plusIcon-1OBta").click();

      // Get the number of elements on the column
      const column_dropdown = await page
        .locator(SAMPLES_COLUMN)
        .allInnerTexts();

      // Get the number of checked samples on the column
      const checked_samples = await page.locator(CHECKED_BOX).allInnerTexts();

      // uncheck all samples
      for (let i = 1; i < checked_samples.length; i++) {
        await page
          .locator(SAMPLES_COLUMN)
          .nth(i)
          .click();
      }

      // check all samples
      for (let i = 1; i < column_dropdown.length; i++) {
        await page
          .locator(SAMPLES_COLUMN)
          .nth(i)
          .click();
      }

      // check if the column were added
      const columns = await page.locator(COLUMNS_LABEL).allInnerTexts();
      for (let i = 0; i < column_dropdown.length; i++) {
        expect(columns.includes(column_dropdown[i])).toBeTruthy();
      }

      // uncheck all samples
      for (let i = 1; i < column_dropdown.length; i++) {
        await page
          .locator(SAMPLES_COLUMN)
          .nth(i)
          .click();
      }
      expect(
        (await page.locator(COLUMNS_LABEL).allInnerTexts()).length,
      ).toEqual(NUMBER_OF_COLUMN);
    });
    test(`Should display info icon and sidebar for ${sampleType}`, async ({
      page,
    }) => {
      if ((await page.locator('[id="onetrust-button-group"]').count()) > 0) {
        await page.locator('[id="onetrust-button-group"]').click();
      }
      // info icon used to hide and unhide  columns on the page
      await page.locator(".plusIcon-1OBta").click();

      await page
        .locator(BAR_LABEL)
        .nth(1)
        .waitFor({
          state: VISIBLE,
        });
      const overall_area = (await page.locator(OVERALL_AREA).allInnerTexts())
        .length;
      const bar_label = (await page.locator(BAR_LABEL).allInnerTexts()).length;
      const date_created = (await page.locator(DATE_CREATED).allInnerTexts())
        .length;
      const date_label = (await page.locator(DATE_LABEL).allInnerTexts())
        .length;

      // collapse side tabs
      for (let index = 0; index <= 2; index++) {
        await page
          .locator(SIDE_HEADERS)
          .nth(index)
          .click();
      }
      await page
        .locator(OVERALL_AREA)
        .nth(0)
        .waitFor({
          state: HIDDEN,
        });

      // ensure all the sides are collapsed
      expect((await page.locator(OVERALL_AREA).allInnerTexts()).length).toEqual(
        0,
      );
      expect((await page.locator(BAR_LABEL).allInnerTexts()).length).toEqual(0);
      expect((await page.locator(DATE_CREATED).allInnerTexts()).length).toEqual(
        0,
      );
      expect((await page.locator(DATE_LABEL).allInnerTexts()).length).toEqual(
        0,
      );

      // expand side tabs
      for (let index = 0; index <= 2; index++) {
        await page
          .locator(SIDE_HEADERS)
          .nth(index)
          .click();
      }

      await page
        .locator(BAR_LABEL)
        .nth(bar_label - 1)
        .waitFor({
          state: VISIBLE,
        });

      // ensure all the sides are expanded
      expect((await page.locator(OVERALL_AREA).allInnerTexts()).length).toEqual(
        overall_area,
      );
      expect((await page.locator(BAR_LABEL).allInnerTexts()).length).toEqual(
        bar_label,
      );
      expect((await page.locator(DATE_CREATED).allInnerTexts()).length).toEqual(
        date_created,
      );
      expect((await page.locator(DATE_LABEL).allInnerTexts()).length).toEqual(
        date_label,
      );

      // verify metadata filters were applied
      const filters = await page.locator(FILTERS).allInnerTexts();
      for (let i = 0; i < filters.length; i++) {
        const selector = `a:text("${filters[i]}")`;
        await page.click(selector);
        await expect(page.locator(FILTER_TAG)).toHaveText(filters[i]);
        await page.locator(CANCEL_ICON).click();
      }
    });
  });
});
