import path from "path";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { OVERALL, TEST_PROJECTS } from "../../constants/common.const";
import {
  VISIBLE,
  OVERALL_AREA,
  AVG_READS_FILTER_PER_SAMPLE,
  SIDE_LABELS,
  SIDE_HEADERS,
  BUTTONS,
  BAR_LABEL,
  DATE_CREATED,
  DATE_LABEL,
  MENU_ICON,
  SIDE_LABEL_VALUE,
  CHECK_ALL,
  MAP_HEADERS,
  MAP_CHECKBOX,
  MAP_VIEW_STRING,
  HELP_OUT,
  SIDE_BAR,
  HOVER_TEXT,
} from "../../constants/map.const";
import { BasePage } from "../../pages/basePage";
import { openSamplePage } from "../../utils/report";
dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });
const PLQC = "Plqc";
const ENV = (process.env.NODE_ENV as string) || "";
const projectName = TEST_PROJECTS[ENV.toUpperCase()];
const viewTypes = [MAP_VIEW_STRING, PLQC];
// These tests verifies Ui elements displayed on the map  view like header, side bars, bar charts and graphs
test.describe("Map view tests", () => {
  test.beforeEach(async ({ page }) => {
    await openSamplePage(page, projectName, false, false);
  });
  viewTypes.forEach(viewType => {
    test(`Should collapse and expand right side areas for ${viewType}`, async ({
      page,
    }) => {
      const menu_icon = await page.locator(MENU_ICON).allInnerTexts();
      const menu_size = menu_icon.length;

      // navigate to map view page
      if (viewType === MAP_VIEW_STRING) {
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
        .first()
        .click();
      await page
        .locator(BAR_LABEL)
        .nth(1)
        .waitFor({
          state: VISIBLE,
        });

      await page.waitForTimeout(2000);
      // collapse side tabs
      for (let index = 0; index <= 2; index++) {
        await page
          .locator(SIDE_HEADERS)
          .nth(index)
          .click();
      }

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
        .nth(1)
        .waitFor({
          state: VISIBLE,
        });

      // ensure all the sides are expanded
      expect(
        (await page.locator(OVERALL_AREA).allInnerTexts()).length,
      ).toBeGreaterThan(0);
      expect(
        (await page.locator(BAR_LABEL).allInnerTexts()).length,
      ).toBeGreaterThan(0);
      expect(
        (await page.locator(DATE_CREATED).allInnerTexts()).length,
      ).toBeGreaterThan(0);
      expect(
        (await page.locator(DATE_LABEL).allInnerTexts()).length,
      ).toBeGreaterThan(0);
    });

    test(`Should display right side content for ${viewType}`, async ({
      page,
    }) => {
      const basePage = new BasePage(page);
      const PROJECTS = "Projects";
      const SAMPLES = "Samples";
      const DATE_CREATED_S = "Date created";
      const AVG_READS_PER_SAMPLE = "Avg. reads per sample";
      const NUMBER_OF_SAMPLE = ".tabCounter-LfG85";
      const menu_icon = await page.locator(MENU_ICON).allInnerTexts();
      const menu_size = menu_icon.length;
      if (viewType === MAP_VIEW_STRING) {
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

      /// overall area
      await expect(await basePage.findByLocator(SIDE_HEADERS, 0)).toContainText(
        OVERALL,
      );
      // ensure all the sides are expanded afer loading
      await expect(page.locator(OVERALL_AREA).nth(1)).toBeVisible();

      await page.waitForTimeout(2000);
      // collapse side tabs
      for (let index = 0; index <= 2; index++) {
        await page
          .locator(SIDE_HEADERS)
          .nth(index)
          .click();
      }
      // ensure all the sides are collaspsed
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

      await (await basePage.findByLocator(SIDE_HEADERS, 0)).click();

      // verify  Overall area label
      await expect(await basePage.findByLocator(SIDE_LABELS, 0)).toContainText(
        SAMPLES,
      );
      await expect(await basePage.findByLocator(SIDE_LABELS, 1)).toContainText(
        PROJECTS,
      );
      await expect(await basePage.findByLocator(SIDE_LABELS, 2)).toContainText(
        AVG_READS_PER_SAMPLE,
      );
      await expect(await basePage.findByLocator(SIDE_LABELS, 3)).toContainText(
        AVG_READS_FILTER_PER_SAMPLE,
      );

      const sample_number = await page.locator(NUMBER_OF_SAMPLE).textContent();

      await expect(page.locator(SIDE_LABEL_VALUE).nth(0)).toContainText(
        sample_number.replace(",", ""),
      );
      await expect(page.locator(SIDE_LABEL_VALUE).nth(2)).toBeVisible();
      await expect(page.locator(SIDE_LABEL_VALUE).nth(3)).toBeVisible();

      if (
        await page
          .locator(SIDE_BAR)
          .nth(0)
          .isVisible()
      ) {
        await (await basePage.findByLocator(SIDE_HEADERS, 1)).click();
        await (await basePage.findByLocator(SIDE_HEADERS, 2)).click();
      }

      // Date created area
      await expect(await basePage.findByLocator(SIDE_HEADERS, 1)).toContainText(
        DATE_CREATED_S,
      );
      await (await basePage.findByLocator(SIDE_HEADERS, 1)).click();

      // verify information when user hovers over bar charts on date created section
      const length = (await page.locator(SIDE_BAR).allInnerTexts()).length;
      for (let i = 0; i < length; i++) {
        const ans = await page
          .locator(SIDE_BAR)
          .nth(i)
          .getAttribute("style");
        if (ans !== "height: 0px;") {
          await page
            .locator(SIDE_BAR)
            .nth(i)
            .hover();
          await expect(page.locator(HOVER_TEXT).nth(0)).toBeVisible();
          await expect(page.locator(HOVER_TEXT).nth(1)).toBeVisible();
          //make sure the hover is no longer present
          await page.locator(".label-153WY").click();
        }
      }
    });

    test(`Should enable icons upon selection of ${viewType} samples `, async ({
      page,
    }) => {
      const MAP_ADD_ICON = ".plusIcon-1OBta";
      const SAMPLE_HEADER_MAP = ".label-33v00";

      const menu_icon = await page.locator(MENU_ICON).allInnerTexts();
      const menu_size = menu_icon.length;

      if (viewType === MAP_VIEW_STRING) {
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

      // ensure the header are visible
      await expect(page.locator(CHECK_ALL)).toBeVisible();
      await expect(page.locator(SAMPLE_HEADER_MAP)).toBeVisible();
      await expect(page.locator(MAP_ADD_ICON)).toBeVisible();

      // assert icons are active after selecting some checkbox
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

  test(`Should display content when hovered `, async ({ page }) => {
    const MAP_VIEW = ".overlays";
    const MAP_INFO_ICON = ".infoIcon-3BQyQ";
    const menu_icon = await page.locator(MENU_ICON).allInnerTexts();
    const menu_size = menu_icon.length;
    await page
      .locator(MENU_ICON)
      .nth(menu_size - 1)
      .click();
    await expect(page.locator(MAP_VIEW)).toBeVisible();
    // hover over map info
    await page.locator(MAP_INFO_ICON).hover();
    await expect(page.locator(HELP_OUT)).toBeVisible();
  });
});
