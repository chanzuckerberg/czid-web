import path from "path";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import {
  METAGENOMICS,
  MENU_ITEM_PUBLIC,
  SEARCH_PUBLIC,
  SAMPLE_NUMBER,
  VIEWS,
  FILTER_RESULT,
  TREE_NODES,
  KNOWN_PATHOGEN,
  PATHOGEN_POPUP,
  PATHOGEN_POPUP_TEXT,
  PATHOGEN_LINk,
  TREE_VIEW_TITLE,
  FULL_LIST,
  PATHOGEN_LIST_URL,
} from "../../constants/sample.const";
import { BasePage } from "../../pages/basePage";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const projectName = "floo Neptunium";

async function getProject(basePage: BasePage, projectName: string) {
  await basePage.gotoUrl(`${process.env.BASEURL}/my_data`);
  await basePage.clickByTestId(MENU_ITEM_PUBLIC);
  await basePage.fillByPlaceHolder(SEARCH_PUBLIC, projectName);
  await (await basePage.findByText(projectName)).nth(0).click();
}

async function navigeteToSampleReport(page) {
  await page.locator(SAMPLE_NUMBER).nth(0).click();
}

test.describe("Sample report view test", () => {
  test(`Should verify content displayed on tree view page`, async ({
    page,
    context,
  }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();
    await navigeteToSampleReport(page);

    // navigate to table view
    await page.locator(VIEWS).nth(0).click();
    await expect(page.locator(FILTER_RESULT).nth(0)).toBeVisible();
    await page.locator(VIEWS).nth(1).click();
    await expect(page.locator(TREE_NODES).nth(0)).toBeVisible();
    await page.locator(KNOWN_PATHOGEN).hover();
    await expect(page.locator(PATHOGEN_POPUP)).toHaveText(PATHOGEN_POPUP_TEXT);

    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      await page.locator(PATHOGEN_LINk).locator(FULL_LIST).click(),
    ]);
    await newPage.waitForLoadState();
    newPage.url().includes(PATHOGEN_LIST_URL);
    await expect(newPage.locator(TREE_VIEW_TITLE)).toBeVisible();
    await newPage.close();
    await page.locator(TREE_NODES).nth(0).click();
    await expect(page.locator(TREE_NODES).nth(1)).not.toBeVisible();
  });
});
