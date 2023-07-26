import { BrowserContext, expect, Page, test } from "@playwright/test";
import {
  SHARED_SAMPLE_TABLE_COLUMNS,
  SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS,
} from "../../../app/assets/src/components/views/samples/constants";
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

const projectName = "floo Neptunium";

async function verifyBarChartContent(
  page: Page,
  context: BrowserContext,
  data: any,
  index: number,
) {
  const BARS = '[data-testid*="histogram"]';
  const BAR_CHARTS = ".bar-0";
  await openSamplePage(page, projectName, false);
  await expect(page.getByTestId("samples")).toBeVisible();

  // click to switch display to bar chart
  await page.getByTestId("plqc-view").click();

  // X of Y samples
  expect(page.getByTestId("showing-x-of-y-samples")).toBe(
    "Showing 20 of 20 samples",
  );

  // info icon
  await page.getByTestId("chart-info-icon").hover();

  // Verify text displayed after hovering
  await page
    .getByTestId(TOTAL_READ_INFO_ICON)
    .nth(index + 1)
    .hover();

  expect(
    await page.getByTestId(TOTAL_READ_POPUP_CONTENT).textContent(),
  ).toContain(data["tooltip"]);
  // Verify link attached to the popup
  const [newPage] = await Promise.all([
    context.waitForEvent("page"),
    // Opens a new tab
    page.locator(LEARN_MORE).locator(LEARN_MORE_TEXT).click(),
  ]);
  await newPage.waitForLoadState();
  const actualLink = (await newPage.url()).split("/").pop();
  const expectedLink = data["link"].split("/").pop();
  expect(actualLink).toContain(expectedLink);
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
      await expect(page.getByTestId(BAR_POPUP).nth(0)).toBeVisible();
      await expect(page.getByTestId(BAR_POPUP).nth(1)).toBeVisible();
    }
  }
}
// These tests verifies Ui elements displayed on the plqc view like header, side bars, bar charts and graphs
test.describe("PLQC view tests", () => {
  test(`Should verify TOTAL_READ bar chart content`, async ({
    page,
    context,
  }) => {
    await verifyBarChartContent(
      page,
      context,
      SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.totalReads,
      0,
    );
  });

  test(`Should verify QUALITY_READ bar chart content`, async ({
    page,
    context,
  }) => {
    await verifyBarChartContent(
      page,
      context,
      SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.qcPercent,
      1,
    );
  });

  test(`Should verify DUPLICATE_READ bar chart content`, async ({
    page,
    context,
  }) => {
    await verifyBarChartContent(
      page,
      context,
      SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.duplicateCompressionRatio,
      2,
    );
  });

  test(`Should verify INSERT_LENGTH bar chart content`, async ({
    page,
    context,
  }) => {
    await verifyBarChartContent(
      page,
      context,
      SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.meanInsertSize,
      3,
    );
  });

  test(`Should verify pipeline bar chart content`, async ({
    page,
    context,
  }) => {
    const SAMPLE_AMOUNT = ".filteredCount-3bajD";
    await openSamplePage(page, projectName, false, false);
    await page.getByTestId(MENU_ICON).nth(1).click();
    await expect(page.locator(SAMPLE_AMOUNT)).toBeVisible();

    // Verify text displayed after hovering
    await expect(page.locator(HEADER_READS).nth(4)).toHaveText(
      PIPELINE_CHART_HEADER,
    );

    // Verify text displayed after hovering
    await page.getByText("Reads Lost").locator("svg").hover();
    await expect(page.getByTestId(TOTAL_READ_POPUP_CONTENT)).toHaveText(
      SHARED_SAMPLE_TABLE_COLUMNS.readsLost.tooltip,
    );

    // Verify link attached to the popup
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),

      // Opens a new tab
      page.locator(LEARN_MORE).locator(LEARN_MORE_TEXT).click(),
    ]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toEqual(SHARED_SAMPLE_TABLE_COLUMNS.readsLost.link);
    newPage.close();
  });
});
