import { expect, test } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { BasePage } from "../pages/basePage";

import {
  VISIBLE,
  OVERALL,
  METAGENOMICS,
  CANCEL_ICON,
  FILTER_TAG,
  OVERALL_AREA,
  DATE_CREATED_S,
  AVG_READS_PER_SAMPLE,
  AVG_READS_FILTER_PER_SAMPLE,
  ACCEPT_ALL_COOKIES,
  SIDE_LABELS,
  SIDE_HEADERS,
  BUTTONS,
  BAR_LABEL,
  DATE_CREATED,
  DATE_LABEL,
  MENU_ITEM_PUBLIC,
  SEARCH_PUBLIC,
  SAMPLES,
  PROJECTS,
  MENU_ICON,
  MAP_VIEW,
  MAP_INFO_ICON,
  SIDE_LABEL_VALUE,
  NUMBER_OF_SAMPLE,
  CHECK_ALL,
  SAMPLE_HEADER_MAP,
  MAP_ADD_ICON,
  MAP_HEADERS,
  MAP_CHECKBOX,
  MAP_VIEW_STRING,
  HELP_OUT,
  SIDE_BAR,
  HOVER_TEXT,
  PLQC,
} from "../utils/constants";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const projectName = "floo Neptunium";
const sampleTypes = [MAP_VIEW_STRING, PLQC];

async function getProject(basePage: BasePage, projectName: string) {
  await basePage.gotoUrl(`${process.env.BASEURL}/my_data`);
  await basePage.clickByTestId(MENU_ITEM_PUBLIC);
  await basePage.fillByPlaceHolder(SEARCH_PUBLIC, projectName);
  await (await basePage.findByText(projectName)).nth(0).click();
}
const sleep = milliseconds => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

test.describe("Map view tests", () => {
  sampleTypes.forEach(sampleType => {
    test(`Should verify if user is able to collapse and expand areas on the right side on map view for ${sampleType}`, async ({
      page,
    }) => {
      const basePage = new BasePage(page);
      await getProject(basePage, projectName);
      await (await basePage.findByText(METAGENOMICS)).click();

      const menu_icon = await page.locator(MENU_ICON).allInnerTexts();
      const menu_size = menu_icon.length;

      if (sampleType == MAP_VIEW_STRING) {
        await page
          .locator(MENU_ICON)
          .nth(menu_size - 1)
          .click();
      } else {
        await page
          .locator(MENU_ICON)
          .nth(menu_size - 2)
          .click();
      }

      await page
        .locator(MAP_HEADERS)
        .nth(0)
        .click();
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

      //accept cookies
      await basePage.clickByText(ACCEPT_ALL_COOKIES);
      //collapse side tabs
      await (await basePage.findByLocator(SIDE_HEADERS, 0)).click();
      await (await basePage.findByLocator(SIDE_HEADERS, 1)).click();
      await (await basePage.findByLocator(SIDE_HEADERS, 2)).click();

      //ensure all the sides are collaspsed
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

      const filters = await page.locator(BAR_LABEL).allInnerTexts();
      for (let i = 0; i < filters.length; i++) {
        const selector = `a:text("${filters[i]}")`;
        const selector2 = `a:text("${filters[filters.length - 1]}")`;

        if (!(await page.locator(selector).isVisible())) {
          let visi2 = await page.locator(selector).isVisible();
          while (!(await page.locator(selector).isVisible())) {
            await page
              .locator(MAP_HEADERS)
              .nth(0)
              .click();
            await page.waitForTimeout(200);
          }
        }
        await page.click(selector);
        await expect(page.locator(FILTER_TAG)).toHaveText(filters[i]);
        await page.locator(CANCEL_ICON).click();
        await page
          .locator(MAP_HEADERS)
          .nth(0)
          .click();
        await page.waitForTimeout(2000);
      }
    });

    test(`Should verify content displayed on the right side on map view for ${sampleType}`, async ({
      page,
    }) => {
      const basePage = new BasePage(page);
      await getProject(basePage, projectName);
      await (await basePage.findByText(METAGENOMICS)).click();

      const menu_icon = await page.locator(MENU_ICON).allInnerTexts();
      const menu_size = menu_icon.length;
      if (sampleType == MAP_VIEW_STRING) {
        await page
          .locator(MENU_ICON)
          .nth(menu_size - 1)
          .click();
      } else {
        await page
          .locator(MENU_ICON)
          .nth(menu_size - 2)
          .click();
      }

      await page
        .locator(MAP_HEADERS)
        .nth(0)
        .click();

      ///overall area
      await expect(await basePage.findByLocator(SIDE_HEADERS, 0)).toHaveText(
        OVERALL,
      );
      await (await basePage.findByLocator(SIDE_HEADERS, 0)).click();

      expect((await page.locator(OVERALL_AREA).allInnerTexts()).length).toEqual(
        0,
      );
      await (await basePage.findByLocator(SIDE_HEADERS, 0)).click();
      await expect(await basePage.findByLocator(SIDE_LABELS, 0)).toHaveText(
        SAMPLES,
      );
      await expect(await basePage.findByLocator(SIDE_LABELS, 1)).toHaveText(
        PROJECTS,
      );
      await expect(await basePage.findByLocator(SIDE_LABELS, 2)).toHaveText(
        AVG_READS_PER_SAMPLE,
      );
      await expect(await basePage.findByLocator(SIDE_LABELS, 3)).toHaveText(
        AVG_READS_FILTER_PER_SAMPLE,
      );

      const sample_number = await page
        .locator(NUMBER_OF_SAMPLE)
        .allInnerTexts();

      await expect(page.locator(SIDE_LABEL_VALUE).nth(0)).toHaveText(
        sample_number,
      );
      await expect(page.locator(SIDE_LABEL_VALUE).nth(1)).toHaveText("1");
      await expect(page.locator(SIDE_LABEL_VALUE).nth(2)).toBeVisible();
      await expect(page.locator(SIDE_LABEL_VALUE).nth(3)).toBeVisible();

      //Date created area

      await expect(await basePage.findByLocator(SIDE_HEADERS, 1)).toHaveText(
        DATE_CREATED_S,
      );
      await (await basePage.findByLocator(SIDE_HEADERS, 1)).click();

      expect((await page.locator(DATE_LABEL).allInnerTexts()).length).toEqual(
        0,
      );
      await (await basePage.findByLocator(SIDE_HEADERS, 1)).click();
      await (await basePage.findByLocator(SIDE_HEADERS, 2)).click();

      const length = (await page.locator(SIDE_BAR).allInnerTexts()).length;
      for (let i = 0; i < length; i++) {
        const ans = await page
          .locator(SIDE_BAR)
          .nth(i)
          .getAttribute("style");
        if (ans != "height: 0px;") {
          await page
            .locator(SIDE_BAR)
            .nth(i)
            .hover();

          await expect(page.locator(HOVER_TEXT).nth(0)).toBeVisible();
          await expect(page.locator(HOVER_TEXT).nth(1)).toBeVisible();
        }
      }
    });

    test(`Should verify icons enabled when user selects a certain number of samples on map view for ${sampleType}`, async ({
      page,
    }) => {
      const basePage = new BasePage(page);
      await getProject(basePage, projectName);
      await (await basePage.findByText(METAGENOMICS)).click();

      const menu_icon = await page.locator(MENU_ICON).allInnerTexts();
      const menu_size = menu_icon.length;

      if (sampleType == MAP_VIEW_STRING) {
        await page
          .locator(MENU_ICON)
          .nth(menu_size - 1)
          .click();
      } else {
        await page
          .locator(MENU_ICON)
          .nth(menu_size - 2)
          .click();
      }

      await page
        .locator(MAP_HEADERS)
        .nth(1)
        .click();

      //accept cookies
      await basePage.clickByText(ACCEPT_ALL_COOKIES);

      //ensure the header are visible
      await expect(page.locator(CHECK_ALL)).toBeVisible();
      await expect(page.locator(SAMPLE_HEADER_MAP)).toBeVisible();
      await expect(page.locator(MAP_ADD_ICON)).toBeVisible();

      //assert icons are active after selecting some checkbox
      await page
        .locator(MAP_HEADERS)
        .nth(1)
        .click();
      expect(page.locator(BUTTONS).nth(3)).not.toBeEnabled();

      await page
        .locator(MAP_CHECKBOX)
        .nth(1)
        .click();
      await expect(page.locator(BUTTONS).nth(3)).toBeEnabled();
      await expect(page.locator(BUTTONS).nth(0)).not.toBeEnabled();
      await expect(page.locator(BUTTONS).nth(1)).not.toBeEnabled();

      await page
        .locator(MAP_CHECKBOX)
        .nth(2)
        .click();
      await expect(page.locator(BUTTONS).nth(0)).toBeEnabled();
      await expect(page.locator(BUTTONS).nth(1)).toBeEnabled();
    });
  });

  test(`Should verify content displayed when user hover around specify areas on map view for `, async ({
    page,
  }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();

    const menu_icon = await page.locator(MENU_ICON).allInnerTexts();
    const menu_size = menu_icon.length;
    await page
      .locator(MENU_ICON)
      .nth(menu_size - 1)
      .click();
    await expect(page.locator(MAP_VIEW)).toBeVisible();
    await page.locator(MAP_INFO_ICON).hover();
    await expect(page.locator(HELP_OUT)).toBeVisible();
  });
});
