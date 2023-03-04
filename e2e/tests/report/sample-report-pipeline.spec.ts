import path from "path";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import {
  METAGENOMICS,
  MENU_ITEM_PUBLIC,
  SEARCH_PUBLIC,
  SAMPLE_NUMBER,
  PIPELINE_LINK_PATH,
  SAMPLE_LANDING,
  SAMPLE_DETAILS,
  PIPELINES,
  SIDE_BAR_HEADER,
  METADATA_LABELS,
  READS_REMAINING_LABELS,
  DOWNLOADS_LABELS,
  ALL_PIPELINE_INFO,
  ALL_READS_REMAINING,
  NO_DATA,
  ALL_DOWNLOAD,
  DOWNLOAD_HREF,
  PIPELINE_LABELS_VALUE,
  ILLUMINA,
  HUMAN,
  METAGENOMIC,
  PIPELINE_READS_LABEL,
  VIEW_PIPELINE_VISUALIZATION,
  SIDEBAR_PIPELINE_AMR_SELECTOR,
  ANTIMICROBIAL_RESISTANCE,
  AMR_LABEL_SELECTOR,
} from "../../constants/sample.const";
import { BasePage } from "../../pages/basePage";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const projectName = "floo Einsteinium";

async function getProject(basePage: BasePage, projectName: string) {
  await basePage.gotoUrl(`${process.env.BASEURL}/my_data`);
  await basePage.clickByTestId(MENU_ITEM_PUBLIC);
  await basePage.fillByPlaceHolder(SEARCH_PUBLIC, projectName);
  await (await basePage.findByText(projectName)).nth(0).click();
}

async function clickSampleDetails(page) {
  await page
    .locator(SAMPLE_NUMBER)
    .nth(0)
    .click();
  // expand side bar
  await page.locator(SAMPLE_DETAILS).click();
}

test.describe("Sample report pipeline test", () => {
  test(`Should verify content displayed on side bar pipeline section of sample report page`, async ({
    page,
  }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();
    await clickSampleDetails(page);

    // pipeline tab
    await page.locator(PIPELINES).click();

    //  Navigate to new page
    await page.locator(VIEW_PIPELINE_VISUALIZATION).click();
    await page.waitForLoadState();
    expect(page.url().includes(PIPELINE_LINK_PATH)).toBeTruthy();
    await expect(page.locator(SAMPLE_LANDING)).toBeVisible();

    // Naviagate back to main page
    await page.locator(SAMPLE_LANDING).click();
    await page.waitForLoadState();
    await page.locator(SAMPLE_DETAILS).click();
    await page.locator(PIPELINES).click();

    // Retrieve and verify the values of all the labels on the pipeline tab
    const pipeline_info = await page.locator(METADATA_LABELS).allInnerTexts();
    for (let i = 0; i < pipeline_info.length; i++) {
      expect(ALL_PIPELINE_INFO.includes(pipeline_info[i])).toBeTruthy();
    }
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(0)
      .click();

    await page
      .locator(SIDE_BAR_HEADER)
      .nth(1)
      .click();
    const reads_remaining = await page
      .locator(READS_REMAINING_LABELS)
      .allInnerTexts();

    for (let i = 0; i < reads_remaining.length; i++) {
      expect(ALL_READS_REMAINING.includes(reads_remaining[i])).toBeTruthy();
    }
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(1)
      .click();

    await page
      .locator(SIDE_BAR_HEADER)
      .nth(2)
      .click();
    expect(page.locator(NO_DATA)).toBeVisible();
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(2)
      .click();

    await page
      .locator(SIDE_BAR_HEADER)
      .nth(3)
      .click();
    const downloads = await page.locator(DOWNLOADS_LABELS).allInnerTexts();

    for (let i = 0; i < downloads.length; i++) {
      expect(ALL_DOWNLOAD.includes(downloads[i])).toBeTruthy();
      const link = await page
        .locator(DOWNLOADS_LABELS)
        .nth(i)
        .getAttribute("href");
      expect(link.includes(DOWNLOAD_HREF[i])).toBeTruthy();
    }

    await page
      .locator(SIDE_BAR_HEADER)
      .nth(3)
      .click();
  });

  test(`Should verify values of the labels displayed on side bar pipeline section of sample report page`, async ({
    page,
  }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();
    await clickSampleDetails(page);

    // pipeline tab
    await page.locator(PIPELINES).click();
    await expect(page.locator(PIPELINE_LABELS_VALUE).nth(0)).toHaveText(
      METAGENOMIC,
    );
    await expect(page.locator(PIPELINE_LABELS_VALUE).nth(1)).toHaveText(
      ILLUMINA,
    );
    await expect(page.locator(PIPELINE_LABELS_VALUE).nth(3)).toHaveText(HUMAN);
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(0)
      .click();
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(1)
      .click();
    await expect(page.locator(PIPELINE_READS_LABEL).nth(1)).toBeVisible();
    const reads_remaining = await page
      .locator(PIPELINE_READS_LABEL)
      .allInnerTexts();
    expect(reads_remaining.length).not.toEqual(0);
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(1)

      .click();
  });

  test(`Should verify values of the labels displayed on side bar pipeline section AMR tab of sample report page`, async ({
    page,
  }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();
    await clickSampleDetails(page);

    // Navigate to pipeline tab
    await page.locator(PIPELINES).click();

    // Naviate to AMR sub-tab
    await page.locator(SIDEBAR_PIPELINE_AMR_SELECTOR).click();

    // check contents of AMR tab
    await expect(page.locator(PIPELINE_LABELS_VALUE).nth(0)).toHaveText(
      ANTIMICROBIAL_RESISTANCE,
    );
    await expect(page.locator(PIPELINE_LABELS_VALUE).nth(1)).toHaveText(
      ILLUMINA,
    );

    // Check for important row labels in pipeline info section
    const pipelineInfoLabels = await page
      .locator(AMR_LABEL_SELECTOR)
      .allInnerTexts();
    expect(pipelineInfoLabels).toContain("Pipeline Version");
    expect(pipelineInfoLabels).toContain("CARD Database Version");
  });
});
