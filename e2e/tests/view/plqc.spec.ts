import { BrowserContext, expect, Page, test } from "@playwright/test";
import {
  SHARED_SAMPLE_TABLE_COLUMNS,
  SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS,
} from "../../constants/app.constants";
import {
  BAR_POPUP,
  HEADER_READS,
  LEARN_MORE,
  LEARN_MORE_TEXT,
  PIPELINE_CHART_HEADER,
} from "../../constants/map";
import { openSamplePage } from "../../utils/report";

const projectName = "floo Neptunium";

type ChartData = {
  titleId: string;
  titleText: string;
  infoIcon: string;
  tooltipId: string;
  tooltipText: string;
  index: number;
  link: string;
};

async function verifyBarChartContent(
  page: Page,
  context: BrowserContext,
  chartData: ChartData,
) {
  const BARS = '[data-testid*="histogram"]';
  const BAR_CHARTS = ".bar-0";

  await expect(page.getByTestId("samples").nth(0)).toBeVisible();

  // click to switch display to bar chart
  await page.getByTestId("plqc-view").click();

  // verify chart title
  expect(await page.getByTestId(chartData.titleId).textContent()).toContain(
    chartData.titleText,
  );

  // Verify text displayed after hovering

  await page.getByTestId(chartData.tooltipId).hover();

  expect(await page.getByTestId(chartData.infoIcon).textContent()).toContain(
    chartData.tooltipText,
  );
  // Verify link attached to the popup
  const [newPage] = await Promise.all([
    context.waitForEvent("page"),
    // Opens a new tab
    page.locator(LEARN_MORE).locator(LEARN_MORE_TEXT).click(),
  ]);
  await newPage.waitForLoadState();
  const actualLink = (await newPage.url()).split("/").pop();
  const expectedLink = chartData.link.split("/").pop();
  expect(actualLink).toContain(expectedLink);
  newPage.close();

  // Find the number of bar charts displayed
  const bars = await page
    .locator(BAR_CHARTS)
    .nth(chartData.index)
    .locator(BARS)
    .allInnerTexts();

  // verify information when user hovers over bar charts
  for (let i = 0; i < bars.length; i++) {
    const graphHeight = await page
      .locator(`.rect-${i}`)
      .nth(chartData.index)
      .getAttribute("height");
    // if the height of the chart is zero do not hover over it
    if (
      graphHeight !== "0" &&
      (await page.locator(`.rect-${i}`).nth(chartData.index).isVisible())
    ) {
      await page.locator(HEADER_READS).nth(chartData.index).hover();
      await page.locator(`.rect-${i}`).nth(chartData.index).hover();
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
    await page.goto(`${process.env.BASEURL}/my_data`);
    await openSamplePage(page, projectName, false, false);
    const ChartData = {
      titleId: "total-read-title",
      titleText: "Total Reads",
      tooltipId: "total-read-info-icon",
      infoIcon: "total-read-tooltip",
      tooltipText: SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.totalReads["tooltip"],
      index: 0,
      link: SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.totalReads["link"],
    };
    await verifyBarChartContent(page, context, ChartData);
  });

  test(`Should verify QUALITY_READ bar chart content`, async ({
    page,
    context,
  }) => {
    await page.goto(`${process.env.BASEURL}/my_data`);
    await openSamplePage(page, projectName, false, false);
    const ChartData = {
      titleId: "passed-qc-title",
      titleText: "Passed QC",
      infoIcon: "passed-qc-tooltip",
      tooltipId: "passed-qc-info-icon",
      tooltipText: SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.qcPercent["tooltip"],
      index: 1,
      link: SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.qcPercent["link"],
    };
    await verifyBarChartContent(page, context, ChartData);
  });

  // unskip after new test id is deployed to staging
  test.skip(`Should verify DUPLICATE_READ bar chart content`, async ({
    page,
    context,
  }) => {
    await page.goto(`${process.env.BASEURL}/my_data`);
    await openSamplePage(page, projectName, false, false);
    const ChartData = {
      titleId: "duplicate-compression-ratio-title",
      titleText: "Duplicate Compression Ratio",
      infoIcon: "duplicate-tooltip-info-icon",
      tooltipId: "duplicate-tooltip",
      tooltipText:
        SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.duplicateCompressionRatio[
          "tooltip"
        ],
      index: 1,
      link: SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.duplicateCompressionRatio[
        "link"
      ],
    };
    await verifyBarChartContent(page, context, ChartData);
  });

  // unskip after test id is deployed to staging
  test.skip(`Should verify INSERT_LENGTH bar chart content`, async ({
    page,
    context,
  }) => {
    await page.goto(`${process.env.BASEURL}/my_data`);
    await openSamplePage(page, projectName, false, false);
    const ChartData = {
      titleId: "mean-insert-size-title",
      titleText: "Mean Insert Size",
      infoIcon: "mean-insert-size-info-icon",
      tooltipId: "mean-insert-size-tooltip",
      tooltipText:
        SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.meanInsertSize["tooltip"],
      index: 1,
      link: SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.meanInsertSize["link"],
    };
    await verifyBarChartContent(page, context, ChartData);
  });

  test(`Should verify pipeline bar chart content`, async ({
    page,
    context,
  }) => {
    await page.goto(`${process.env.BASEURL}/my_data`);
    await openSamplePage(page, projectName, false, false);
    // click to switch display to bar chart
    await page.getByTestId("plqc-view").click();

    // Verify text displayed after hovering
    await expect(page.getByTestId("sample-processed-check")).toHaveText(
      PIPELINE_CHART_HEADER,
    );

    // Verify text displayed after hovering
    await page.getByTestId("read-lost-title").locator("svg").hover();
    await expect(page.getByTestId("column-tooltip")).toHaveText(
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
