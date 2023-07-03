import path from "path";
import { BrowserContext, expect, Page, test } from "@playwright/test";
import dotenv from "dotenv";
import {
  DUPLICATE_READ_HELP_LINK,
  INSERT_LENGTH_HELP_LINK,
  QUALITY_READ_HELP_LINK,
  READS_POPUP_HELP,
  READ_URL_HELP_LINK,
  TOTAL_READ_HELP_LINK,
} from "../../../app/assets/src/components/utils/documentationLinks";
import {
  BAR_POPUP,
  HEADER_READS,
  LEARN_MORE,
  LEARN_MORE_TEXT,
  MENU_ICON,
  PIPELINE_CHART_HEADER,
  TOTAL_READ_INFO_ICON,
  TOTAL_READ_POPUP_CONTENT,
} from "../../constants/map";
import { openSamplePage } from "../../utils/report";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const projectName = "floo Neptunium";

async function verifyBarChartContent(
  page: Page,
  context: BrowserContext,
  data: any,
  index: number,
) {
  const BARS = "rect";
  const BAR_CHARTS = ".bar-0";
  await openSamplePage(page, projectName, false, false);
  await expect(page.getByTestId("samples")).toBeVisible();

  // click to switch display to bar chart
  await page.locator(".menuItem-25eT6").nth(1).click();

  // 20 of 20 samples
  // todo: uncomment once testid gets to staging
  // todo: need to calculate/retrieve the numbers instead of hardcoding
  // await expect(
  //   page.getByTestId("showing-x-of-y-samples"),
  // ).toBe('Showing 20 of 20 samples');

  // info icon
  // uncomment once test id gets to staging
  // await page.getByTestId("chart-info-icon").hover();

  // hover text
  // await expect(page.locator(SAMPLE_INFORMATION_POPUP)).toBeVisible();

  // header
  await expect(page.locator(HEADER_READS).nth(index)).toHaveText(
    data["header"],
  );

  // Verify text displayed after hovering
  await page
    .locator(TOTAL_READ_INFO_ICON)
    .nth(index + 1)
    .hover();

  await expect(page.locator(TOTAL_READ_POPUP_CONTENT)).toHaveText(
    data["pop_up"],
  );
  // Verify link attached to the popup
  const [newPage] = await Promise.all([
    context.waitForEvent("page"),
    // Opens a new tab
    page.locator(LEARN_MORE).locator(LEARN_MORE_TEXT).click(),
  ]);
  await newPage.waitForLoadState();
  expect(newPage.url()).toEqual(data["url"]);
  newPage.close();

  // Find the number of bar charts displayed
  const bars = await page
    .locator(BAR_CHARTS)
    .nth(index)
    .locator(BARS)
    .allInnerTexts();

  // verify information when user hovers over bar charts
  for (let i = 0; i < bars.length; i++) {
    const graphHeight = await page
      .locator(`.rect-${i}`)
      .nth(index)
      .getAttribute("height");
    // if the height of the chart is zero do not hover over it
    if (
      graphHeight !== "0" &&
      (await page.locator(`.rect-${i}`).nth(index).isVisible())
    ) {
      await page.locator(HEADER_READS).nth(index).hover();
      await page.locator(`.rect-${i}`).nth(index).hover();
      await expect(page.locator(BAR_POPUP).nth(0)).toBeVisible();
      await expect(page.locator(BAR_POPUP).nth(1)).toBeVisible();
    }
  }
}
// These tests verifies Ui elements displayed on the plqc view like header, side bars, bar charts and graphs
test.describe("PLQC view tests", () => {
  test(`Should verify TOTAL_READ bar chart content`, async ({
    page,
    context,
  }) => {
    await verifyBarChartContent(page, context, TOTAL_READ_HELP_LINK, 0);
  });

  test(`Should verify QUALITY_READ bar chart content`, async ({
    page,
    context,
  }) => {
    await verifyBarChartContent(page, context, QUALITY_READ_HELP_LINK, 1);
  });

  test(`Should verify DUPLICATE_READ bar chart content`, async ({
    page,
    context,
  }) => {
    await verifyBarChartContent(page, context, DUPLICATE_READ_HELP_LINK, 2);
  });

  test(`Should verify INSERT_LENGTH bar chart content`, async ({
    page,
    context,
  }) => {
    await verifyBarChartContent(page, context, INSERT_LENGTH_HELP_LINK, 3);
  });

  test(`Should verify pipeline bar chart content`, async ({
    page,
    context,
  }) => {
    const SAMPLE_AMOUNT = ".filteredCount-3bajD";
    await openSamplePage(page, projectName, false, false);
    await page.locator(MENU_ICON).nth(1).click();
    await expect(page.locator(SAMPLE_AMOUNT)).toBeVisible();

    // Verify text displayed after hovering
    await expect(page.locator(HEADER_READS).nth(4)).toHaveText(
      PIPELINE_CHART_HEADER,
    );

    // Verify text displayed after hovering
    await page.locator(TOTAL_READ_INFO_ICON).nth(6).hover();
    await expect(page.locator(TOTAL_READ_POPUP_CONTENT)).toHaveText(
      READS_POPUP_HELP,
    );

    // Verify link attached to the popup
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),

      // Opens a new tab
      page.locator(LEARN_MORE).locator(LEARN_MORE_TEXT).click(),
    ]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toEqual(READ_URL_HELP_LINK);
    newPage.close();
  });
});
