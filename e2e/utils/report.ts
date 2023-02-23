import { expect, Page } from "@playwright/test";
import {
  MENU_ITEM_PUBLIC,
  METAGENOMICS,
  SEARCH_PUBLIC,
} from "../constants/common.const";
import { SIDE_BAR_HEADER } from "../constants/map.const";
import {
  SAMPLE_INFO,
  HOST_INFO,
  INFECTION_INFO,
  SEQUENCING_INFO,
  PIPELINE_INFO,
  READS_REMAINING,
  ERCC,
  DOWNLOADS,
} from "../constants/sample.const";
import { getByClassName, getByTestID, getByText } from "./selectors";

export const sectionIndices: Record<string, number> = {
  sampleInfo: 0,
  hostInfo: 1,
  infectionInfo: 2,
  sequencingInfo: 3,
  pipelinesInfo: 0,
  readsRemaining: 1,
  erccSpikeInCounts: 2,
  downloads: 3,
};
export const metadataSectionTitles: Record<string, any> = {
  sampleInfo: SAMPLE_INFO,
  hostInfo: HOST_INFO,
  infectionInfo: INFECTION_INFO,
  sequencingInfo: SEQUENCING_INFO,
};
export const pipelineSectionTitles: Record<string, any> = {
  pipelinesInfo: PIPELINE_INFO,
  readsRemaining: READS_REMAINING,
  erccSpikeInCounts: ERCC,
  downloads: DOWNLOADS,
};

export interface DataModel {
  id: number;
  name?: string;
  reads_remaining?: string;
  reads_remaining_percent?: string;
  step?: string;
  value?: string;
  text?: string;
  href?: string;
}

export function getDataByIndex(data: Array<DataModel>, index: number) {
  for (const item of data) {
    if (Number(item.id) === index) {
      return item;
    }
  }
}
export async function openSamplePage(
  page: Page,
  projectName: string,
  openDetails = true,
) {
  await page.goto(`${process.env.BASEURL}/my_data`);
  await page.locator(getByTestID(MENU_ITEM_PUBLIC)).click();
  await page.getByPlaceholder(SEARCH_PUBLIC).fill(projectName);
  if (await page.locator(getByClassName("title")).isVisible()) {
    await page.locator(getByClassName("title")).click();
  } else {
    await page.getByPlaceholder(SEARCH_PUBLIC).fill(projectName);
    await page.locator(getByClassName("title")).click();
  }
  // select metagenonomics samples
  await page.locator(getByTestID(METAGENOMICS.toLowerCase())).click();

  // open sample details page
  await page
    .locator(getByTestID("sample-name"))
    .nth(0)
    .click();

  // expand side bar
  if (openDetails) await page.locator(getByText("Sample Details")).click();

  // accept cookies
  // await page.locator(getByText(ACCEPT_ALL_COOKIES)).click();
}

export async function verifySectionTitles(
  page: Page,
  sectionTitles: Record<string, string>,
) {
  Object.keys(sectionTitles).forEach(async section => {
    const sectionTitle = sectionTitles[section];
    await expect(await getTabSection(page, section)).toHaveText(sectionTitle);
  });
}
/**
 *
 * @param page This function needs to be refactored once we have testid; at the moment we are doing a lot
 * of manipulation just to handle selectors
 * @param section
 * @param data
 * @param expandSection
 */
export async function verifySectionDetails(
  page: Page,
  section: string,
  data: Array<DataModel>,
  attributes: Array<string>,
  sampleId?: number,
  expandSection = true,
) {
  // expand section; first section is expanded by default
  if (expandSection) {
    await (await getTabSection(page, section)).click();
  }
  // when section has no data
  if (attributes.length === 0) {
    await expect(page.locator(".noData-2AfzS")).toBeVisible();
  }

  // when section has download links
  if (attributes.includes("href")) {
    // verify links
    for (let i = 0; i < data.length; i++) {
      const item = getDataByIndex(data, i);
      expect(
        await page
          .locator(getByText(item.text))
          .first()
          .textContent(),
      ).toBe(item.text);
      expect(
        await page
          .locator(".downloadLink-14o8v")
          .nth(i)
          .getAttribute("href"),
      ).toBe(item.href.replace("SAMPLEID", sampleId.toString()));
    }
  }
  // verify label is displayed
  for (let i = 0; i < data.length; i++) {
    const item = getDataByIndex(data, i);
    if (attributes.includes("name")) {
      expect(
        await page
          .locator(".label-9CR8O")
          .nth(i)
          .textContent(),
      ).toBe(item.name);
      // todo: validate values but this only be done after testids added
    }
    if (attributes.includes("step")) {
      // get row data
      const row = page.locator(".readsRemainingRow-2sd9r").nth(i + 1); // to ignore the header

      // verify label
      expect(await row.locator(".labelText-2uB1q").textContent()).toBe(
        item.step,
      );

      // verify reads remaining
      expect(
        await row
          .locator(".metadataValue-2cDlV")
          .first()
          .textContent(),
      ).toBe(item.reads_remaining);

      // verify reads remaining percentage
      expect(
        await row
          .locator(".metadataValue-2cDlV")
          .nth(1)
          .textContent(),
      ).toBe(item.reads_remaining_percent);
    }
  }
}
// selects a section of tab or just the tab in case there is no section, for example Notes
export async function getTabSection(page: Page, section?: string) {
  let index = 0;
  if (section !== undefined) {
    index = sectionIndices[section];
  }
  return page.locator(SIDE_BAR_HEADER).nth(index);
}
