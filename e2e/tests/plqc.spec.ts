import { expect, test } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { BasePage } from "../pages/basePage";
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
} from "../utils/constants";

const DATA = {
  TOTAL_READ: {
    url:
      "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#Total-Reads",
    header: "Do my samples have enough total reads?",
    pop_up:
      "Total Reads:The total number of single-end reads uploaded. Each end of the paired-end reads count as one read. Learn more.",
  },
  QUALITY_READ: {
    url:
      "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#Passed-QC",
    header: "Do my samples have enough quality reads?",
    pop_up:
      "Passed QC:The percentage of reads that came out of PriceSeq, step (3) of the host filtration and QC steps, compared to what went in to Trimmomatic, step (2). Learn more.",
  },
  DUPLICATE_READ: {
    url:
      "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#DCR-(duplicate-compression-ratio)",
    header: "Are there too many duplicate reads in my library?",
    pop_up:
      "DCR:Duplicate Compression Ratio is the ratio of the total number of sequences present prior to running czid-dedup (duplicate identification) vs the number of unique sequences. Learn more.",
  },
  INSERT_LENGTH: {
    url:
      "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#Mean-Insert-Size",
    header: "Do my samples have sufficient insert lengths?",
    pop_up:
      "Mean Insert Size:The average length of the nucleotide sequence that is inserted between the adapters. Learn more.",
  },
};

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const projectName = "floo Neptunium";

const readType = [
  "TOTAL_READ",
  "QUALITY_REA",
  "DUPLICATE_READ",
  "INSERT_LENGTH",
];

async function getProject(basePage: BasePage, projectName: string) {
  await basePage.gotoUrl(`${process.env.BASEURL}/my_data`);
  await basePage.clickByTestId(MENU_ITEM_PUBLIC);
  await basePage.fillByPlaceHolder(SEARCH_PUBLIC, projectName);
  await (await basePage.findByText(projectName)).nth(0).click();
}
let j = 0;

test.describe("Map view tests", () => {
  readType.forEach(readType => {
    test(`Should verify content displayed on  ${readType} bar chart`, async ({
      page,
      context,
    }) => {
      const basePage = new BasePage(page);
      await getProject(basePage, projectName);
      await (await basePage.findByText(METAGENOMICS)).click();
      await basePage.clickByText(ACCEPT_ALL_COOKIES);
      const menu_icon = await page.locator(MENU_ICON).allInnerTexts();
      const menu_size = menu_icon.length;

      await page
        .locator(MENU_ICON)
        .nth(1)
        .click();
      await expect(page.locator(SAMPLE_AMOUNT)).toBeVisible();

      //20 of 20 samples
      await expect(page.locator(SAMPLE_COUNT)).toBeVisible();
      // info icon
      await page.locator(SAMPLE_COUNT_INFO_ICON).hover();

      // hover text
      await expect(page.locator(SAMPLE_INFORMATION_POPUP)).toBeVisible();

      //header
      await expect(page.locator(HEADER_READS).nth(j)).toHaveText(
        DATA[readType]["header"],
      );
      //The total number of single-end reads uploaded. Each end of the paired-end reads count as one read.
      //.infoIcon-pU_hl
      await page
        .locator(TOTAL_READ_INFO_ICON)
        .nth(j + 1)
        .hover();

      await expect(page.locator(TOTAL_READ_POPOUP_CONTENT)).toHaveText(
        DATA[readType]["pop_up"],
      );

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        // Opens a new tab
        page.locator(LEARN_MORE).click(),
      ]);
      await newPage.waitForLoadState();
      expect(newPage.url()).toEqual(DATA[readType]["url"]);
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
        if (ans != "0") {
          await page
            .locator(`.rect-${i}`)
            .nth(j)
            .hover();
          //.boldText-32btR
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
    const menu_icon = await page.locator(MENU_ICON).allInnerTexts();
    const menu_size = menu_icon.length;
    await page
      .locator(MENU_ICON)
      .nth(1)
      .click();
    await expect(page.locator(SAMPLE_AMOUNT)).toBeVisible();
    //header
    await expect(page.locator(HEADER_READS).nth(4)).toHaveText(
      "How were my samples processed through the pipeline?",
    );
    await page
      .locator(TOTAL_READ_INFO_ICON)
      .nth(6)
      .hover();
    await expect(page.locator(TOTAL_READ_POPOUP_CONTENT)).toHaveText(
      READS_POPUP,
    );
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      // Opens a new tab
      page.locator(LEARN_MORE).click(),
    ]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toEqual(READ_URL);
    newPage.close();
  });
});
