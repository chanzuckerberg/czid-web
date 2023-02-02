import path from "path";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import {
  METAGENOMICS,
  ACCEPT_ALL_COOKIES,
  MENU_ITEM_PUBLIC,
  SEARCH_PUBLIC,
  MENU_ICON,
  SAMPLE_AMOUNT,
  SAMPLE_COUNT,
  SAMPLE_COUNT_INFO_ICON,
  SAMPLE_INFORMATION_POPUP,
  HEADER_READS,
  READS_POPUP,
  READ_URL,
  LEARN_MORE,
  TOTAL_READ_INFO_ICON,
  TOTAL_READ_POPOUP_CONTENT,
  BAR_CHARTS,
  BARS,
  BAR_POPUP,
  DATA,
  LEARN_MORE_TEXT,
  PIPELINE_CHART_HEADER,
} from "../constants/map.const";
import { BasePage } from "../pages/basePage";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const projectName = "floo Neptunium";

const READTYPES = [
  "Total_read",
  "Quality_read",
  "Duplicate_read",
  "Insert_length",
];

async function getProject(basePage: BasePage, projectName: string) {
  await basePage.gotoUrl(`${process.env.BASEURL}/my_data`);
  await basePage.clickByTestId(MENU_ITEM_PUBLIC);
  await basePage.fillByPlaceHolder(SEARCH_PUBLIC, projectName);
  await (await basePage.findByText(projectName)).nth(0).click();
}
let j = 0;

test.describe("Map view tests", () => {
  READTYPES.forEach((READTYPES) => {
    test(`Should verify content displayed on  ${READTYPES} bar chart @fast`, async ({
      page,
      context,
    }) => {
      const basePage = new BasePage(page);
      await getProject(basePage, projectName);
      await (await basePage.findByText(METAGENOMICS)).click();
      await basePage.clickByText(ACCEPT_ALL_COOKIES);
      await page.locator(MENU_ICON).nth(1).click();
      await expect(page.locator(SAMPLE_AMOUNT)).toBeVisible();

      // 20 of 20 samples
      await expect(page.locator(SAMPLE_COUNT)).toBeVisible();
      // info icon
      await page.locator(SAMPLE_COUNT_INFO_ICON).hover();

      // hover text
      await expect(page.locator(SAMPLE_INFORMATION_POPUP)).toBeVisible();

      // header
      await expect(page.locator(HEADER_READS).nth(j)).toHaveText(
        DATA[READTYPES]["header"]
      );

      await page
        .locator(TOTAL_READ_INFO_ICON)
        .nth(j + 1)
        .hover();

      await expect(page.locator(TOTAL_READ_POPOUP_CONTENT)).toHaveText(
        DATA[READTYPES]["pop_up"]
      );

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        // Opens a new tab
        page.locator(LEARN_MORE).locator(LEARN_MORE_TEXT).click(),
      ]);
      await newPage.waitForLoadState();
      expect(newPage.url()).toEqual(DATA[READTYPES]["url"]);
      newPage.close();

      const bars = await page
        .locator(BAR_CHARTS)
        .nth(j)
        .locator(BARS)
        .allInnerTexts();

      for (let i = 0; i < bars.length; i++) {
        const ans = await page
          .locator(`.rect-${i}`)
          .nth(j)
          .getAttribute("height");
        if (ans !== "0") {
          await page.locator(`.rect-${i}`).nth(j).hover();
          await expect(page.locator(BAR_POPUP).nth(0)).toBeVisible();
          await expect(page.locator(BAR_POPUP).nth(1)).toBeVisible();
        }
      }
      j++;
    });
  });
  test(`Should verify content displayed on pipeline bar chart`, async ({
    page,
    context,
  }) => {
    const basePage = new BasePage(page);

    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();
    await page.locator(MENU_ICON).nth(1).click();
    await expect(page.locator(SAMPLE_AMOUNT)).toBeVisible();

    // header
    await expect(page.locator(HEADER_READS).nth(4)).toHaveText(
      PIPELINE_CHART_HEADER
    );
    await page.locator(TOTAL_READ_INFO_ICON).nth(6).hover();
    await expect(page.locator(TOTAL_READ_POPOUP_CONTENT)).toHaveText(
      READS_POPUP
    );
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      // Opens a new tab
      page.locator(LEARN_MORE).locator(LEARN_MORE_TEXT).click(),
    ]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toEqual(READ_URL);
    newPage.close();
  });
});
