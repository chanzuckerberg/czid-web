import { expect, test } from "@playwright/test";
import { OVERALL, TEST_PROJECTS } from "../../constants/common";
import {
  AVG_READS_FILTER_PER_SAMPLE,
  DATE_CREATED_SIDEBAR,
  HELP_OUT,
  MAP_HEADERS,
  MAP_VIEW_STRING,
  MENU_ICON,
  META_DATA_SIDEBAR,
  OVERALL_SIDEBAR,
  SIDE_LABELS,
  SIDE_LABEL_VALUE,
  VISIBLE,
} from "../../constants/map";
import { BasePage } from "../../pages/basePage";
import { openSamplePage } from "../../utils/report";
import { cookieBanner } from "../../utils/upload";
const BAR_LABEL_ID = "date-histogram";
const DATE_CREATED_ID = "date-histogram";
const OVERALL_AREA_ID = "overall-content";
const DATE_LABEL_ID = "date-histogram-first-date";
const PLQC = "Plqc";
const ENV = (process.env.NODE_ENV as string) || "";
const projectName = TEST_PROJECTS[ENV.toUpperCase()];
const viewTypes = [MAP_VIEW_STRING, PLQC];
// These tests verifies Ui elements displayed on the map  view like header, side bars, bar charts and graphs
test.describe("Map view tests", () => {
  test.beforeEach(async ({ page }) => {
    await openSamplePage(page, projectName, false, false);
    await cookieBanner(page);
  });
  viewTypes.forEach(viewType => {
    test(`Should collapse and expand right side areas for ${viewType}`, async ({
      page,
    }) => {
      const menu_icon = await page.getByTestId(MENU_ICON).allInnerTexts();
      const menu_size = menu_icon.length;

      // navigate to map view page
      if (viewType === MAP_VIEW_STRING) {
        await page
          .getByTestId(MENU_ICON)
          .nth(menu_size - 1)
          .click();
      } else {
        await page
          .getByTestId(MENU_ICON)
          .nth(menu_size - 2)
          .click();
      }

      await page.locator(MAP_HEADERS).first().click();
      await page.getByTestId(BAR_LABEL_ID).waitFor({
        state: VISIBLE,
      });

      await page.waitForTimeout(2000);
      // collapse side tabs
      await page.getByTestId(OVERALL_SIDEBAR).click();
      await page.getByTestId(DATE_CREATED_SIDEBAR).click();
      await page.getByTestId(META_DATA_SIDEBAR).click();

      // ensure all the sides are collapsed
      expect(
        (await page.getByTestId(OVERALL_AREA_ID).allInnerTexts()).length,
      ).toEqual(0);
      expect(
        (await page.getByTestId(BAR_LABEL_ID).allInnerTexts()).length,
      ).toEqual(0);
      expect(
        (await page.getByTestId(DATE_CREATED_ID).allInnerTexts()).length,
      ).toEqual(0);
      expect(
        (await page.getByTestId(DATE_LABEL_ID).allInnerTexts()).length,
      ).toEqual(0);

      // expand side tabs
      await page.getByTestId(OVERALL_SIDEBAR).click();
      await page.getByTestId(DATE_CREATED_SIDEBAR).click();
      await page.getByTestId(META_DATA_SIDEBAR).click();

      await page.getByTestId(BAR_LABEL_ID).waitFor({
        state: VISIBLE,
      });

      // ensure all the sides are expanded
      expect(
        (await page.getByTestId(OVERALL_AREA_ID).allInnerTexts()).length,
      ).toBeGreaterThan(0);
      expect(
        (await page.getByTestId(BAR_LABEL_ID).allInnerTexts()).length,
      ).toBeGreaterThan(0);
      expect(
        (await page.getByTestId(DATE_CREATED_ID).allInnerTexts()).length,
      ).toBeGreaterThan(0);
      expect(
        (await page.getByTestId(DATE_LABEL_ID).allInnerTexts()).length,
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

      await page.getByTestId(MENU_ICON).click();
      await page.locator(MAP_HEADERS).first().click();

      // overall area
      await expect(page.getByTestId(OVERALL_SIDEBAR)).toContainText(OVERALL);
      // ensure all the sides are expanded after loading
      await expect(page.getByTestId(OVERALL_AREA_ID)).toBeVisible();

      await page.waitForTimeout(2000);
      // collapse side tabs
      await page.getByTestId(OVERALL_SIDEBAR).click();
      await page.getByTestId(DATE_CREATED_SIDEBAR).click();
      await page.getByTestId(META_DATA_SIDEBAR).click();

      // ensure all the sides are collapsed
      expect(
        (await page.getByTestId(OVERALL_AREA_ID).allInnerTexts()).length,
      ).toEqual(0);
      expect(
        (await page.getByTestId(BAR_LABEL_ID).allInnerTexts()).length,
      ).toEqual(0);
      expect(
        (await page.getByTestId(DATE_CREATED_ID).allInnerTexts()).length,
      ).toEqual(0);
      expect(
        (await page.getByTestId(DATE_LABEL_ID).allInnerTexts()).length,
      ).toEqual(0);

      await page.getByTestId(OVERALL_SIDEBAR).click();

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

      const sample_number =
        (await page.locator(NUMBER_OF_SAMPLE).textContent()) || "";

      await expect(page.locator(SIDE_LABEL_VALUE).nth(0)).toContainText(
        sample_number,
      );
      await expect(page.locator(SIDE_LABEL_VALUE).nth(2)).toBeVisible();
      await expect(page.locator(SIDE_LABEL_VALUE).nth(3)).toBeVisible();

      // Date created area
      await expect(page.getByTestId(DATE_CREATED_SIDEBAR)).toContainText(
        DATE_CREATED_S,
      );
      await page.getByTestId(DATE_CREATED_SIDEBAR).click();

      // verify tooltip on non-zero bar charts
      const DATE_HISTOGRAM_BAR = "date-histogram-bar";
      const TOOLTIP_SELECTOR = "[class*='boldText']";
      const chartCount = await page.getByTestId(DATE_HISTOGRAM_BAR).count();

      for (let i = 0; i < chartCount; i++) {
        const chartStyle = await page
          .getByTestId(DATE_HISTOGRAM_BAR)
          .nth(i)
          .getAttribute("style");
        if (chartStyle !== "height: 0px;") {
          // height zero bars have no tooltips
          await page.getByTestId(DATE_HISTOGRAM_BAR).nth(i).hover();
          await expect(page.locator(TOOLTIP_SELECTOR).nth(0)).toBeVisible();
          await expect(page.locator(TOOLTIP_SELECTOR).nth(1)).toBeVisible();
          // make sure the hover is no longer present
          await page.getByTestId("date-histogram-first-date").click();
        }
      }
    });

    test(`Should enable icons upon selection of ${viewType} samples `, async ({
      page,
    }) => {
      const SAMPLE_URL =
        "/public?currentDisplay=plqc&currentTab=samples&mapSidebarTab=summary&projectId=1015&showFilters=true&showStats=true&workflow=short-read-mngs";
      await page.goto(SAMPLE_URL);
      await page.getByTestId("sample-tablabel").click();
      const BACKGROUND_MODEL_ICON = "background-model-icon";
      const HEATMAP_ICON = "heatmap-icon";
      const DOWNLOAD_ICON = "download-icon";
      const BULK_DELETE_ICON = "bulk-delete-trigger";
      const THREE_DOTS_ICON = "dots-horizontal";
      const CHECKBOX = "check-box";
      const BUTTON = "button";

      // check various action icons are disabled by default
      await expect(
        page.getByTestId(BACKGROUND_MODEL_ICON).locator(BUTTON),
      ).toBeDisabled();
      await expect(
        page.getByTestId(HEATMAP_ICON).locator(BUTTON),
      ).toBeDisabled();
      await expect(
        page.getByTestId(DOWNLOAD_ICON).locator(BUTTON),
      ).toBeDisabled();
      await expect(
        page.getByTestId(BULK_DELETE_ICON).locator(BUTTON),
      ).toBeDisabled();
      await expect(
        page.getByTestId(THREE_DOTS_ICON).locator(BUTTON),
      ).toBeDisabled();

      // select all samples and check icons
      await page.getByTestId(CHECKBOX).first().click();
      await expect(
        page.getByTestId("sample-view-actions").locator(BUTTON).locator(BUTTON),
      ).toBeEnabled();
      await expect(page.locator('[role="listbox"]').first()).toBeEnabled();
      await expect(
        page.getByTestId(DOWNLOAD_ICON).locator(BUTTON),
      ).toBeEnabled();
      await expect(
        page.getByTestId(BULK_DELETE_ICON).locator(BUTTON),
      ).toBeDisabled();
      await expect(
        page.getByTestId(THREE_DOTS_ICON).locator(BUTTON),
      ).toBeEnabled();

      // select a single sample and check icons
      await page.getByTestId(CHECKBOX).first().click();
      await page.getByTestId(CHECKBOX).nth(1).click();
      await expect(
        page.getByTestId(BACKGROUND_MODEL_ICON).locator(BUTTON),
      ).toBeDisabled();
      await expect(
        page.getByTestId(HEATMAP_ICON).locator(BUTTON),
      ).toBeDisabled();
      await expect(
        page.getByTestId(DOWNLOAD_ICON).locator(BUTTON),
      ).toBeEnabled();
      await expect(
        page.getByTestId(BULK_DELETE_ICON).locator(BUTTON),
      ).toBeDisabled();
      await expect(
        page.getByTestId(THREE_DOTS_ICON).locator(BUTTON),
      ).toBeEnabled();
    });
  });

  test(`Should display content when hovered `, async ({ page }) => {
    const MAP_VIEW = ".overlays";
    const MAP_INFO_ICON = '[class*="infoIcon"]';
    await page.getByTestId("map-view").click();
    await expect(page.locator(MAP_VIEW)).toBeVisible();
    // hover over map info
    await page.locator(MAP_INFO_ICON).hover();
    await expect(page.locator(HELP_OUT)).toBeVisible();
  });
});
