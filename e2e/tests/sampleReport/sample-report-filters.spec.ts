import {
  ANNOTATION_FILTERS,
  ANNOTATION_TEXT,
  APPLY,
  APPLY_BUTTON,
  ARCHAEA_FILTER,
  BACTERIA_FILTER,
  CANCEL_ICON,
  CATEGORIES_FILTER,
  COLUMNS_LABEL,
  COLUMN_HEADER_PROP,
  EUKARYOTA_FILTER,
  FILTER_RESULT,
  FILTER_TAG,
  FILTER_VALUE,
  KLEBSIELLA,
  KLEBSIELLA_GENUS,
  LEARN_MORE_LINK,
  NUMBER_INPUT,
  READ_SPECIFICITY,
  READ_SPECIFICITY_FILTERS,
  SCORE,
  SEARCH_BAR,
  THRESHOLD_FILTER,
  THRESHOLD_FILTERS,
  TOTAL_READ_POPOUP_CONTENT,
  UNCATEGORIZED_FILTER,
  VIROIDS_FILTER,
  VIRUSES_FILTER,
} from "@e2e/constants/sample";
import { expect, test } from "@playwright/test";
import { kebabCase } from "lodash";

const sampleId = 25307;
// These tests validate the user's proficiency in utilizing various filter functions on the sample report page, such as Nametype, Annotation, Category, Threshold filter, and Read specificity.
test.describe("Sample report filter test", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);
  });

  test(`Verify url displayed on the columns`, async ({ page, context }) => {
    await expect(page.locator(COLUMNS_LABEL).nth(1)).toBeVisible();
    const n = await page.locator(COLUMNS_LABEL).allInnerTexts();
    for (let i = 1; i < n.length; i++) {
      await page.locator(COLUMNS_LABEL).nth(i).hover();
      await expect(page.locator(TOTAL_READ_POPOUP_CONTENT)).toHaveText(
        COLUMN_HEADER_PROP[n[i]]["description"],
      );

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await page.locator(LEARN_MORE_LINK).click(),
      ]);
      await newPage.waitForLoadState();
      const link = COLUMN_HEADER_PROP[n[i]]["url"];
      expect(newPage.url().includes(link)).toBeTruthy();
      await newPage.close();
      await page.locator(COLUMNS_LABEL).nth(i).click();
    }
  });

  test(`Should be able to filter by Taxon name`, async ({ page }) => {
    // Search for data
    await page.locator(SEARCH_BAR).fill(KLEBSIELLA);
    await page.getByText(KLEBSIELLA_GENUS).click();

    // Verify filter result
    await expect(page.locator(FILTER_TAG)).toBeVisible();
    await expect(page.locator(FILTER_RESULT)).toContainText(KLEBSIELLA);
  });

  test(`Should be able to filter by Category name`, async ({ page }) => {
    const drop_down = [
      ARCHAEA_FILTER,
      BACTERIA_FILTER,
      EUKARYOTA_FILTER,
      VIROIDS_FILTER,
      VIRUSES_FILTER,
      UNCATEGORIZED_FILTER,
    ];
    const filter_tag = [
      "Archaea",
      "Bacteria",
      "Eukaryota",
      "Viroids",
      "Viruses",
      "Phage",
      "Uncategorized",
    ];
    for (let i = 0; i < drop_down.length; i++) {
      await page.locator(CATEGORIES_FILTER).click();
      await page.locator(drop_down[i]).click();
      await expect(
        page.locator(FILTER_TAG).locator(`text="${filter_tag[i]}"`),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      // test Remove filter x button
      await page
        .locator(FILTER_TAG)
        .locator(`text="${filter_tag[i]}"`)
        .getByTestId("x-close-icon")
        .click();
      await expect(
        page.locator(FILTER_TAG).locator(`text="${filter_tag[i]}"`),
      ).not.toBeVisible();
    }

    for (let i = 0; i < drop_down.length; i++) {
      await page.locator(CATEGORIES_FILTER).click();
      await expect(page.locator(drop_down[i])).toBeVisible();
      await page.locator(drop_down[i]).click();
      await page.keyboard.press("Escape");
    }
    // test Stats bar
    await expect(page.getByTestId("stats-info")).not.toBeEmpty();

    // test Clear Filters button
    await page.locator(`text="Clear Filters"`).click();
    await expect(page.getByTestId("filter-tag")).toHaveCount(0);
  });

  test(`Should be able to filter by Threshold`, async ({ page }) => {
    await page.locator(THRESHOLD_FILTER).click();
    await page.getByTestId(FILTER_VALUE).getByText(SCORE).click();

    // Verify drop down contains required elements
    for (let i = 0; i < THRESHOLD_FILTERS.length; i++) {
      expect(
        await page.getByTestId(kebabCase(THRESHOLD_FILTERS[i])),
      ).toBeVisible();
    }
    await page.locator(THRESHOLD_FILTER).click();

    // Verify Threshold filter are applied
    for (let i = 0; i < THRESHOLD_FILTERS.length; i++) {
      await page.locator(THRESHOLD_FILTER).click();
      await page.getByTestId(FILTER_VALUE).getByText(SCORE).click();
      await page.getByTestId(kebabCase(THRESHOLD_FILTERS[i])).click();
      await page.locator(NUMBER_INPUT).fill("10");
      await page.locator(APPLY_BUTTON).locator(APPLY).click();
      await expect(page.locator(FILTER_TAG)).toHaveText(
        THRESHOLD_FILTERS[i] + " >= 10",
      );
      await page.locator(CANCEL_ICON).click();
    }
  });

  test(`Should be able to filter by Read Specificity`, async ({ page }) => {
    await page.locator(READ_SPECIFICITY).click();
    for (let i = 0; i < READ_SPECIFICITY_FILTERS.length; i++) {
      expect(
        await page.getByTestId(kebabCase(READ_SPECIFICITY_FILTERS[i])),
      ).toBeVisible();
    }
  });

  test(`Should be able to filter by Annotation`, async ({ page }) => {
    await page.locator(ANNOTATION_TEXT).click();

    for (let i = 0; i < ANNOTATION_FILTERS.length; i++) {
      expect(
        page.getByTestId(`dropdown-${kebabCase(ANNOTATION_FILTERS[i])}`),
      ).toBeVisible();
    }

    await page.locator(ANNOTATION_TEXT).click();

    // Verify filter are applied
    for (let i = 0; i < ANNOTATION_FILTERS.length; i++) {
      await page.locator(ANNOTATION_TEXT).click();
      await page
        .getByTestId(`dropdown-${kebabCase(ANNOTATION_FILTERS[i])}`)
        .click();
      await expect(page.locator(FILTER_TAG)).toHaveText(ANNOTATION_FILTERS[i]);
      await page.locator(COLUMNS_LABEL).nth(0).click();
      await page.locator(CANCEL_ICON).click();
    }
  });
});
