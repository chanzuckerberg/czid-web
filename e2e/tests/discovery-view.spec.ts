import { expect, test } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { BasePage } from "../pages/basePage";
import {
  SAMPLE_TYPE_SELECTOR,
  ANNOTATION,
  LOCATION,
  TIMEFRAME,
  VISIBLE,
  VISIBILITY,
  OVERALL,
  HOST,
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
  INFO_ICON,
  ACCEPT_ALL_COOKIES,
  SAMPLES_COLUMN,
  COLUMNS_LABEL,
  SIDE_LABELS,
  SIDE_HEADERS,
  SIDEBAR_HEADER,
  PLUS_ICON,
  VIEW_ICON,
  BUTTONS,
  PAGE_TITLE,
  ANNOTATION_FILTER,
  METADATA_FILTER,
  BAR_LABEL,
  DATE_CREATED,
  CONSENSUS_GENOMES,
  DATE_LABEL,
  MENU_ITEM_PUBLIC,
  SEARCH_PUBLIC,
  DESCRIPTION,
  SAMPLES,
  PROJECTS,
  NUMBER_OF_COLUMN,
} from "../constants/common.const";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const projectName = "floo Neptunium";
const sampleTypes = [
  "Metagenomics",
  "Consensus Genomes",
  "Antimicrobial Resistance",
];

async function getProject(basePage: BasePage, projectName: string) {
  await basePage.gotoUrl(`${process.env.BASEURL}/my_data`);
  await basePage.clickByTestId(MENU_ITEM_PUBLIC);
  await basePage.fillByPlaceHolder(SEARCH_PUBLIC, projectName);
  await (await basePage.findByText(projectName)).nth(0).click();
}

async function verifyElement(basePage: BasePage, n: number, locator: string) {
  for (let i = 0; i < n; i++) {
    await expect.soft(await basePage.findByLocator(locator, i)).toBeVisible();
  }
}

test.describe("Discovery view tests", () => {
  sampleTypes.forEach((sampleType) => {
    test(`Should verify content displayed on the left side of discovery view for ${sampleType}`, async ({
      page,
    }) => {
      const basePage = new BasePage(page);
      await getProject(basePage, projectName);
      await (await basePage.findByText(sampleType)).click();

      //left side
      await expect(await basePage.findByClassName(PAGE_TITLE)).toHaveText(
        projectName
      );

      await expect(
        await basePage.findByClassName(ANNOTATION_FILTER)
      ).toHaveText(ANNOTATION);
      await expect(await basePage.findByLocator(METADATA_FILTER, 0)).toHaveText(
        LOCATION
      );
      await expect(await basePage.findByLocator(METADATA_FILTER, 1)).toHaveText(
        TIMEFRAME
      );
      await expect(await basePage.findByLocator(METADATA_FILTER, 2)).toHaveText(
        VISIBILITY
      );
      await expect(await basePage.findByLocator(METADATA_FILTER, 3)).toHaveText(
        HOST
      );
      await expect(await basePage.findByLocator(METADATA_FILTER, 4)).toHaveText(
        SAMPLE_TYPE
      );
    });
    test(`Should verify content displayed on the main side of discovery view for ${sampleType}`, async ({
      page,
    }) => {
      const basePage = new BasePage(page);
      await getProject(basePage, projectName);
      await (await basePage.findByText(sampleType)).click();
      // main area

      await expect(
        await basePage.findByLocator(SAMPLE_TYPE_SELECTOR, 1)
      ).toHaveText(METAGENOMICS);
      await expect(
        await basePage.findByLocator(SAMPLE_TYPE_SELECTOR, 2)
      ).toHaveText(CONSENSUS_GENOMES);
      await expect
        .soft(await basePage.findByLocator(SAMPLE_TYPE_SELECTOR, 3))
        .toHaveText(ANTIMICROBIAL_RESISTANCE);

      if (sampleType == METAGENOMICS) {
        await verifyElement(basePage, 3, VIEW_ICON);
      }
      if (sampleType == CONSENSUS_GENOMES) {
        await verifyElement(basePage, 2, VIEW_ICON);
      }
      if (sampleType == ANTIMICROBIAL_RESISTANCE) {
        await verifyElement(basePage, 2, VIEW_ICON);
      }

      if (sampleType == METAGENOMICS) {
        await verifyElement(basePage, 4, BUTTONS);
      }
      if (sampleType == CONSENSUS_GENOMES) {
        await verifyElement(basePage, 2, BUTTONS);
      }
      if (sampleType == ANTIMICROBIAL_RESISTANCE) {
        await verifyElement(basePage, 1, BUTTONS);
      }
    });

    test(`Should verify content displayed on the right side of discovery view for ${sampleType}`, async ({
      page,
    }) => {
      const basePage = new BasePage(page);
      await getProject(basePage, projectName);
      await (await basePage.findByText(sampleType)).click();

      await expect(await basePage.findByClassName(PLUS_ICON)).toBeVisible();
      await expect(await basePage.findByClassName(SIDEBAR_HEADER)).toHaveText(
        DESCRIPTION
      );
      // user cannot edit public description
      if ((await basePage.getUrl()).includes("my_data")) {
        await expect(await basePage.findByText("Edit")).toBeVisible();
      }

      await expect(await basePage.findByLocator(SIDE_HEADERS, 0)).toHaveText(
        OVERALL
      );
      await expect(await basePage.findByLocator(SIDE_HEADERS, 1)).toHaveText(
        DATE_CREATED_S
      );
      await expect(await basePage.findByLocator(SIDE_HEADERS, 2)).toHaveText(
        METADATA
      );

      // right side -role labels
      await expect(await basePage.findByLocator(SIDE_LABELS, 0)).toHaveText(
        SAMPLES
      );
      await expect(await basePage.findByLocator(SIDE_LABELS, 1)).toHaveText(
        PROJECTS
      );
      await expect(await basePage.findByLocator(SIDE_LABELS, 2)).toHaveText(
        AVG_READS_PER_SAMPLE
      );
      await expect(await basePage.findByLocator(SIDE_LABELS, 3)).toHaveText(
        AVG_READS_FILTER_PER_SAMPLE
      );
      await expect(await basePage.findByLocator(SIDE_LABELS, 4)).toHaveText(
        HOST
      );
      await expect(await basePage.findByLocator(SIDE_LABELS, 5)).toHaveText(
        SAMPLE_TYPE
      );
      await expect(await basePage.findByLocator(SIDE_LABELS, 6)).toHaveText(
        LOCATION
      );
    });
    test(`Should verify user is able to add/delete columns of discovery view  ${sampleType}`, async ({
      page,
    }) => {
      const basePage = new BasePage(page);
      await getProject(basePage, projectName);
      await (await basePage.findByText(sampleType)).click();

      //accept cookies
      await basePage.clickByText(ACCEPT_ALL_COOKIES);

      await (await basePage.findByClassName(PLUS_ICON)).click();
      const column_dropdown = await page
        .locator(SAMPLES_COLUMN)
        .allInnerTexts();
      const checked_samples = await page
        .locator(".checked-2yKmm:visible")
        .allInnerTexts();

      //uncheck all samples
      for (let i = 1; i < checked_samples.length; i++) {
        await page.locator(SAMPLES_COLUMN).nth(i).click();
      }

      //check all samples
      for (let i = 1; i < column_dropdown.length; i++) {
        await page.locator(SAMPLES_COLUMN).nth(i).click();
      }

      ///check if the column were added
      const columns = await page.locator(COLUMNS_LABEL).allInnerTexts();
      for (let i = 0; i < column_dropdown.length; i++) {
        expect(columns.includes(column_dropdown[i])).toBeTruthy();
      }

      //uncheck all samples
      for (let i = 1; i < column_dropdown.length; i++) {
        await page.locator(SAMPLES_COLUMN).nth(i).click();
      }
      expect(
        (await page.locator(COLUMNS_LABEL).allInnerTexts()).length
      ).toEqual(NUMBER_OF_COLUMN);
    });
    test(`Should verify functionality for the info icon and sidebar for ${sampleType}`, async ({
      page,
    }) => {
      const basePage = new BasePage(page);
      await getProject(basePage, projectName);
      await (await basePage.findByText(sampleType)).click();

      //accept cookies
      await basePage.clickByText(ACCEPT_ALL_COOKIES);

      // info icon
      await page.locator(INFO_ICON).click();
      let locator = await (
        await basePage.findByClassName(SIDEBAR_HEADER)
      ).isVisible();
      expect(locator).toBeFalsy();
      await page.locator(INFO_ICON).click();

      await page.locator(BAR_LABEL).nth(1).waitFor({
        state: VISIBLE,
      });
      const overall_area = (await page.locator(OVERALL_AREA).allInnerTexts())
        .length;
      const bar_label = (await page.locator(BAR_LABEL).allInnerTexts()).length;
      const date_created = (await page.locator(DATE_CREATED).allInnerTexts())
        .length;
      const date_label = (await page.locator(DATE_LABEL).allInnerTexts())
        .length;

      //collapse side tabs
      await (await basePage.findByLocator(SIDE_HEADERS, 0)).click();
      await (await basePage.findByLocator(SIDE_HEADERS, 1)).click();
      await (await basePage.findByLocator(SIDE_HEADERS, 2)).click();

      //ensure all the sidesa are collaspsed
      expect((await page.locator(OVERALL_AREA).allInnerTexts()).length).toEqual(
        0
      );
      expect((await page.locator(BAR_LABEL).allInnerTexts()).length).toEqual(0);
      expect((await page.locator(DATE_CREATED).allInnerTexts()).length).toEqual(
        0
      );
      expect((await page.locator(DATE_LABEL).allInnerTexts()).length).toEqual(
        0
      );

      //expand side tabs
      await (await basePage.findByLocator(SIDE_HEADERS, 0)).click();
      await (await basePage.findByLocator(SIDE_HEADERS, 1)).click();
      await (await basePage.findByLocator(SIDE_HEADERS, 2)).click();

      await page
        .locator(BAR_LABEL)
        .nth(bar_label - 1)
        .waitFor({
          state: VISIBLE,
        });

      //ensure all the sides are expanded
      expect((await page.locator(OVERALL_AREA).allInnerTexts()).length).toEqual(
        overall_area
      );
      expect((await page.locator(BAR_LABEL).allInnerTexts()).length).toEqual(
        bar_label
      );
      expect((await page.locator(DATE_CREATED).allInnerTexts()).length).toEqual(
        date_created
      );
      expect((await page.locator(DATE_LABEL).allInnerTexts()).length).toEqual(
        date_label
      );

      //verify metadata filters
      const filters = await page.locator(".barLabel-1JhFz a").allInnerTexts();
      for (let i = 0; i < filters.length; i++) {
        const selector = `a:text("${filters[i]}")`;
        await page.click(selector);
        await expect(page.locator(FILTER_TAG)).toHaveText(filters[i]);
        await page.locator(CANCEL_ICON).click();
      }
    });
  });
});
