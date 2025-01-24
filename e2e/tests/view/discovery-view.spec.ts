import {
  ANTIMICROBIAL_RESISTANCE,
  AVG_READS_FILTER_PER_SAMPLE,
  AVG_READS_PER_SAMPLE,
  BACKGROUND_MODEL_ICON,
  BAR_LABEL,
  BULK_DELETE_TRIGGER,
  CANCEL_ICON,
  COLUMNS_LABEL,
  CONSENSUS_GENOMES,
  DATE_CREATED,
  DATE_CREATED_S,
  DATE_LABEL,
  DESCRIPTION,
  DOT_HORIZONTAL,
  DOWNLOAD_ICON,
  EDIT,
  FILTERS,
  FILTER_TAG,
  HEAT_MAP_ICON,
  HIDDEN,
  MAP_VIEW,
  METADATA,
  METAGENOMICS,
  MYDATA,
  OVERALL,
  OVERALL_AREA,
  PLQC_VIEW,
  PROJECTS,
  SAMPLES,
  SAMPLES_COLUMN,
  TEST_PROJECTS,
  SAMPLE_TYPE,
  SIDE_HEADERS,
  TABLE_VIEW,
  VISIBLE,
} from "@e2e/constants/common";
import {
  ANNOTATION,
  HOST,
  LOCATION,
  TIMEFRAME,
  VISIBILITY,
} from "@e2e/constants/filter";
import { acceptCookies } from "@e2e/utils/page";
import { expect, test } from "@playwright/test";

const sampleType = METAGENOMICS;
const PLUS_CIRCLE = "plus-circle";
const ENV = (process.env.NODE_ENV as string) || "";
const baseUrl = (process.env.BASEURL as string) || "";
const projectName = TEST_PROJECTS[ENV.toUpperCase()];
const url =
  "public?currentDisplay=table&currentTab=samples&mapSidebarTab=summary&projectId=875&showFilters=true&showStats=true&workflow=short-read-mngs";
// These tests verifies Ui elements displayed on the discovery view like header, side bars, bar charts and graphs
test.describe("Discovery view tests", () => {
  test.beforeEach(async ({ page }) => {
    const fullUrl = `${baseUrl}/${url}`;
    await page.goto(fullUrl);
    await acceptCookies(page);
  });
  test(`Should display left side content for ${sampleType}`, async ({
    page,
  }) => {
    // verify left side content
    await expect(page.getByTestId("project-header")).toContainText(projectName);
    await expect(page.getByTestId("annotation")).toContainText(ANNOTATION);
    await expect(page.getByTestId("location")).toContainText(LOCATION);
    await expect(page.getByTestId("timeframe")).toContainText(TIMEFRAME);
    await expect(page.getByTestId("visibility")).toContainText(VISIBILITY);
    await expect(page.getByTestId("host")).toContainText(HOST);
    await expect(page.getByTestId("sample-type")).toContainText(SAMPLE_TYPE);
  });
  test(`Should display main content of for ${sampleType}`, async ({ page }) => {
    // verify header on main area
    await expect(page.getByTestId("metagenomics")).toContainText(METAGENOMICS);
    await expect(page.getByTestId("consensus-genomes")).toContainText(
      CONSENSUS_GENOMES,
    );
    await expect(page.getByTestId("antimicrobial-resistance")).toContainText(
      ANTIMICROBIAL_RESISTANCE,
    );

    // verify icons displayed on the left
    await expect(page.getByTestId(TABLE_VIEW)).toBeVisible();
    await expect(page.getByTestId(PLQC_VIEW)).toBeVisible();
    await expect(page.getByTestId(MAP_VIEW)).toBeVisible();
    await expect(page.getByTestId(BACKGROUND_MODEL_ICON)).toBeVisible();
    await expect(page.getByTestId(HEAT_MAP_ICON)).toBeVisible();
    await expect(page.getByTestId(DOWNLOAD_ICON)).toBeVisible();
    await expect(page.getByTestId(BULK_DELETE_TRIGGER)).toBeVisible();
    await expect(page.getByTestId(DOT_HORIZONTAL)).toBeVisible();
  });

  test(`Should display right side content for ${sampleType}`, async ({
    page,
  }) => {
    await expect(page.getByTestId(PLUS_CIRCLE)).toBeVisible();
    await expect(page.getByTestId("description-header")).toContainText(
      DESCRIPTION,
    );

    // user cannot edit public description
    if (page.url().includes(MYDATA)) {
      await expect(page.getByText(EDIT)).toBeVisible();
    }

    // verify header on side area
    await expect(page.locator(SIDE_HEADERS).first()).toContainText(OVERALL);
    await expect(page.locator(SIDE_HEADERS).nth(1)).toContainText(
      DATE_CREATED_S,
    );
    await expect(page.locator(SIDE_HEADERS).nth(2)).toContainText(METADATA);

    // verify  side -role labels
    await expect(page.getByTestId("samples").nth(0)).toContainText(SAMPLES);
    await expect(page.getByTestId("projects")).toContainText(PROJECTS);
    await expect(page.getByTestId("avg-reads-per-sample")).toContainText(
      AVG_READS_PER_SAMPLE,
    );
    await expect(
      page.getByTestId("avg-reads-passing-filters-per-sample"),
    ).toContainText(AVG_READS_FILTER_PER_SAMPLE);
    await expect(page.getByTestId("metadata-host")).toContainText(HOST);
    await expect(page.getByTestId("metadata-sample-type")).toContainText(
      SAMPLE_TYPE,
    );
    await expect(page.getByTestId("metadata-location")).toContainText(LOCATION);
  });
  test(`Should add/delete columns of discovery view  ${sampleType}`, async ({
    page,
  }) => {
    // Open column
    await page.getByTestId(PLUS_CIRCLE).click();
    // Get the number of elements on the column
    const column_dropdown = await page.locator(SAMPLES_COLUMN).allInnerTexts();

    // uncheck all samples
    for (let i = 1; i < column_dropdown.length; i++) {
      const element = await page.locator(SAMPLES_COLUMN).nth(i);
      const classList = await element.getAttribute("class");
      if (classList.includes("checked")) {
        await element.click();
      }
    }

    // check all samples
    for (let i = 1; i < column_dropdown.length; i++) {
      await page.locator(SAMPLES_COLUMN).nth(i).click();
    }

    // check if the column were added
    const columns = await page.locator(COLUMNS_LABEL).allInnerTexts();
    for (let i = 0; i < column_dropdown.length; i++) {
      expect(columns.includes(column_dropdown[i])).toBeTruthy();
    }

    // uncheck all samples
    for (let i = 1; i < column_dropdown.length; i++) {
      await page.locator(SAMPLES_COLUMN).nth(i).click();
    }
  });
  test(`Should display info icon and sidebar for ${sampleType}`, async ({
    page,
  }) => {
    if ((await page.locator('[id="onetrust-button-group"]').count()) > 0) {
      await page.locator('[id="onetrust-button-group"]').click();
    }
    // info icon used to hide and unhide  columns on the page
    await page.getByTestId(PLUS_CIRCLE).click();

    await page.locator(BAR_LABEL).waitFor({
      state: VISIBLE,
    });
    const overall_area = (await page.locator(OVERALL_AREA).allInnerTexts())
      .length;
    const bar_label = (await page.locator(BAR_LABEL).allInnerTexts()).length;
    const date_created = (await page.locator(DATE_CREATED).allInnerTexts())
      .length;
    const date_label = (await page.locator(DATE_LABEL).allInnerTexts()).length;

    // collapse side tabs
    for (let index = 0; index <= 2; index++) {
      await page.locator(SIDE_HEADERS).nth(index).click();
    }
    await page.locator(OVERALL_AREA).nth(0).waitFor({
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
    expect((await page.locator(DATE_LABEL).allInnerTexts()).length).toEqual(0);

    // expand side tabs
    for (let index = 0; index <= 2; index++) {
      await page.locator(SIDE_HEADERS).nth(index).click();
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
      await expect(page.locator(FILTER_TAG)).toContainText(filters[i]);
      await page.locator(CANCEL_ICON).click();
    }
  });
});
