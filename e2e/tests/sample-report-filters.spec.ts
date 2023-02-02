import path from "path";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { BasePage } from "../pages/basePage";
import {
  METAGENOMICS,
  CANCEL_ICON,
  FILTER_TAG,
  ACCEPT_ALL_COOKIES,
  COLUMNS_LABEL,
  MENU_ITEM_PUBLIC,
  SEARCH_PUBLIC,
  TOTAL_READ_POPOUP_CONTENT,
  SAMPLE_NUMBER,
  SEARCH_BAR,
  FILTER_HEADERS,
  NUMBER_INPUT,
  CATEGORIES_FILTER,
  COLUMN_HEADER_PROP,
  APPLY_BUTTON,
  THRESHOLD_FILTER,
  SCORE,
  FILTERS_DROPDOWN,
  APPLY,
  LEARN_MORE_LINK,
  KLEBSIELLA,
  THRESHOLD_FILTERS,
  ANNOTATION_FILTERS,
  KLEBSIELLA_GENUS,
  READ_SPECIFICITY,
  ANNOTATION_TEXT,
  READ_SPECIFICITY_FILTERS,
  FILTER_RESULT,
  ARCHAEA_FILTER,
  BACTERIA_FILTER,
  EUKARYOTA_FILTER,
  VIROIDS_FILTER,
  VIRUSES_FILTER,
  UNCATEGORIZED_FILTER,
} from "../constants/sample.const";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const projectName = "floo Neptunium";

async function getProject(basePage: BasePage, projectName: string) {
  await basePage.gotoUrl(`${process.env.BASEURL}/my_data`);
  await basePage.clickByTestId(MENU_ITEM_PUBLIC);
  await basePage.fillByPlaceHolder(SEARCH_PUBLIC, projectName);
  await (await basePage.findByText(projectName)).nth(0).click();
  //accept cookies
  await basePage.clickByText(ACCEPT_ALL_COOKIES);
}

async function navigateToSampleReport(page) {
  await page.locator(SAMPLE_NUMBER).nth(0).click();
}

test.describe("Sample report filter test", () => {
  test(`Verify url displayed on the columns`, async ({ page, context }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();
    await navigateToSampleReport(page);
    await page.waitForLoadState();

    await expect(page.locator(COLUMNS_LABEL).nth(1)).toBeVisible();
    const n = await page.locator(COLUMNS_LABEL).allInnerTexts();
    for (let i = 1; i < n.length; i++) {
      await page.locator(COLUMNS_LABEL).nth(i).hover();
      await expect(page.locator(TOTAL_READ_POPOUP_CONTENT)).toHaveText(
        COLUMN_HEADER_PROP[n[i]]["description"]
      );

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await page.locator(LEARN_MORE_LINK).click(),
      ]);
      await newPage.waitForLoadState();
      const link = COLUMN_HEADER_PROP[n[i]]["url"];
      newPage.url().includes(link);
      await newPage.close();
    }
  });

  test(`Should be able to filter by Taxon name`, async ({ page }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();

    await navigateToSampleReport(page);
    //Search for data
    await page.locator(SEARCH_BAR).fill(KLEBSIELLA);
    await page.getByText(KLEBSIELLA_GENUS).click();

    //Verify filter result
    await expect(page.locator(FILTER_TAG)).toBeVisible();
    await expect(page.locator(FILTER_RESULT)).toHaveText(KLEBSIELLA);
  });
  test(`Should be able to filter by Category name`, async ({ page }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();

    await navigateToSampleReport(page);

    await page.locator(FILTER_HEADERS).locator(CATEGORIES_FILTER).click();
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
      await expect(page.locator(drop_down[i])).toBeVisible();
      await page.locator(drop_down[i]).click();
      await expect(
        page.locator(FILTER_TAG).locator(`text="${filter_tag[i]}"`)
      ).toBeVisible();
    }
  });

  test(`Should be able to filter by Threshold`, async ({ page }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();
    await navigateToSampleReport(page);

    await page.locator(FILTER_HEADERS).locator(THRESHOLD_FILTER).click();
    await page.locator(FILTER_HEADERS).locator(SCORE).click();

    //Verify drop down contains required elements
    const drop_down = await page.locator(FILTERS_DROPDOWN).allInnerTexts();
    for (let i = 0; i < drop_down.length; i++) {
      THRESHOLD_FILTERS.includes(drop_down[i]);
    }
    await page.locator(FILTER_HEADERS).locator(THRESHOLD_FILTER).click();

    // Verify Threshold filter are applied
    for (let i = 0; i < drop_down.length; i++) {
      await page.locator(FILTER_HEADERS).locator(THRESHOLD_FILTER).click();
      await page.locator(FILTER_HEADERS).locator(SCORE).click();
      await page.locator(FILTERS_DROPDOWN).nth(i).click();
      await page.locator(NUMBER_INPUT).fill("10");
      await page.locator(APPLY_BUTTON).locator(APPLY).click();
      await expect(page.locator(FILTER_TAG)).toHaveText(
        drop_down[i] + " >= 10"
      );
      await page.locator(CANCEL_ICON).click();
    }
  });

  test(`Should be able to filter by Read Specificity`, async ({ page }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();

    await navigateToSampleReport(page);

    await page.locator(FILTER_HEADERS).locator(READ_SPECIFICITY).click();
    const drop_down = await page.locator(FILTERS_DROPDOWN).allInnerTexts();
    for (let i = 0; i < drop_down.length; i++) {
      READ_SPECIFICITY_FILTERS.includes(drop_down[i]);
    }
  });

  test(`Should be able to filter by Annotation`, async ({ page }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();
    await navigateToSampleReport(page);

    await page.locator(FILTER_HEADERS).locator(ANNOTATION_TEXT).click();
    const drop_down = await page.locator(FILTERS_DROPDOWN).allInnerTexts();
    for (let i = 0; i < drop_down.length; i++) {
      ANNOTATION_FILTERS.includes(drop_down[i]);
    }

    await page.locator(FILTER_HEADERS).locator(ANNOTATION_TEXT).click();
    // Verify Threshold filter are applied
    for (let i = 0; i < drop_down.length; i++) {
      await page.locator(FILTER_HEADERS).locator(ANNOTATION_TEXT).click();
      await page.locator(FILTERS_DROPDOWN).nth(i).click();
      await expect(page.locator(FILTER_TAG)).toHaveText(drop_down[i]);
      await page.locator(COLUMNS_LABEL).nth(0).click();
      await page.locator(CANCEL_ICON).click();
    }
  });
});
