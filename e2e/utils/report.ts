import { expect, Page } from "@playwright/test";
import {
  MENU_ITEM_PUBLIC,
  METAGENOMICS,
  SEARCH_PUBLIC,
} from "../constants/common";
import {
  BASES_REMAINING,
  BULK_DELETE_MODAL,
  DELETE_DISABLED_TOOLTIP,
  DELETE_RUN_MENUITEM,
  DOWNLOADS,
  ERCC,
  FILE_DOWLOAD_TYPES_AMR,
  FILE_DOWLOAD_TYPES_CG,
  FILE_DOWLOAD_TYPES_MNGS,
  HOST_INFO,
  INFECTION_INFO,
  OVERFLOW_BUTTON,
  PIPELINE_INFO,
  READS_REMAINING,
  SAMPLE_INFO,
  SEQUENCING_INFO,
  URL_DOWLOAD_TYPES,
} from "../constants/sample";
import { acceptCookies } from "./page";

const DOWNLOAD = "Download";
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

export const pipelineSectionTitlesLongReads: Record<string, any> = {
  pipelinesInfo: PIPELINE_INFO,
  readsRemaining: BASES_REMAINING,
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
  selectSample = true,
  openDetails = true,
) {
  if (projectName === "floo Neptunium") {
    await page.goto(
      `${process.env.BASEURL}/public?currentDisplay=table&currentTab=samples&mapSidebarTab=summary&projectId=875`,
    );
  } else {
    await page.goto(`${process.env.BASEURL}/my_data`);
    await page.goto(`${process.env.BASEURL}/my_data`);
    await page.getByTestId(MENU_ITEM_PUBLIC).click();
    await page.getByPlaceholder(SEARCH_PUBLIC).fill(projectName);
    await page.waitForTimeout(300);
    while (
      (await page.getByPlaceholder(SEARCH_PUBLIC).getAttribute("value")) !==
      projectName
    ) {
      await page.getByPlaceholder(SEARCH_PUBLIC).fill(projectName);
      await page.waitForTimeout(300);
    }
    await page.locator(".title").nth(0).click();
  }
  // select metagenonomics samples
  await page.getByTestId(METAGENOMICS.toLowerCase()).click();

  // select sample
  if (selectSample) await page.getByTestId("sample-name").first().click();

  // expand side bar
  if (openDetails) await page.getByText("Sample Details").click();
  await acceptCookies(page);
}

export async function verifySectionTitles(
  page: Page,
  sectionTitles: Record<string, string>,
) {
  for (const section of Object.keys(sectionTitles)) {
    const sectionTitle = sectionTitles[section];
    await expect(await getTabSection(page, section)).toHaveText(sectionTitle);
  }
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
    await expect(page.getByTestId("content")).toContainText(
      "No data",
    );
  }

  // when section has download links
  if (attributes.includes("href")) {
    // verify links
    for (let i = 0; i < data.length; i++) {
      const item = getDataByIndex(data, i);
      expect(await page.getByText(item.text).first().textContent()).toBe(
        item.text,
      );
      expect(
        await page
          .locator('[class*="downloadLink"]')
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
        await page.locator('[data-testid*="field-label"]').nth(i).textContent(),
      ).toBe(item.name);
      // todo: validate values but this only be done after testids added
    }
    if (attributes.includes("step")) {
      // get row data
      const row = page.locator('[class*="readsRemainingRow"]').nth(i + 1); // to ignore the header

      // verify label
      expect(await row.locator('[class*="labelText"]').textContent()).toBe(
        item.step,
      );

      // verify reads remaining
      expect(
        await row.locator('[class*="metadataValue"]').first().textContent(),
      ).toBe(item.reads_remaining);

      // verify reads remaining percentage
      expect(
        await row.locator('[class*="metadataValue"]').nth(1).textContent(),
      ).toBe(item.reads_remaining_percent);
    }
  }
}
// selects a section of tab or just the tab in case there is no section, for example Notes
export async function getTabSection(page: Page, section?: string) {
  let index = 0;
  const SIDE_BAR_HEADER =
    '[data-testid="details-sidebar"]  [data-testid*="header"]';
  if (section !== undefined) {
    index = sectionIndices[section];
  }
  return page.locator(SIDE_BAR_HEADER).nth(index);
}

export async function goToUrl(page: Page, url) {
  try {
    await page.goto(url);
  } catch (error) {
    await page.goto(url);
  }
}

export async function verifyDeleteAvailable(
  page: Page,
) {
  // verify overflow button visible
  const overflowButton = page.getByTestId(OVERFLOW_BUTTON);
  await expect(overflowButton).toBeVisible();
  await overflowButton.click();

  // dropdown text should be visible
  // todo: This looks like regression issue: All delete tooltips refer to mNGS
  // const dropdownText = page.getByText(`Delete ${workflowShorthand} run`);
  const dropdownText = page.getByText(`Delete mNGS Run`);
  await expect(dropdownText).toBeVisible();
  const dropdownItem = page.getByTestId(DELETE_RUN_MENUITEM);
  await expect(dropdownItem).toBeEnabled();
  await dropdownItem.click();

  // verify modal opens
  const modal = page.getByTestId(BULK_DELETE_MODAL);
  await expect(modal).toContainText(
    `Are you sure you want to delete`,
  );
}

export async function verifyDeleteDisabled(
  page: Page,
  workflowShorthand: string,
) {
  // verify overflow button visible
  const overflowButton = page.getByTestId(OVERFLOW_BUTTON);
  await expect(overflowButton).toBeVisible();
  await overflowButton.click();

  // dropdown text should be visible
  const dropdownText = page.getByText(`Delete ${workflowShorthand} run`);
  await expect(dropdownText).toBeVisible();

  const dropdownItem = page.getByTestId(DELETE_RUN_MENUITEM);
  await expect(dropdownItem).toBeDisabled();

  // tooltip should be visible over dropdown option
  await dropdownItem.hover({ force: true }); // use force because tooltip intercepts focus
  await expect(page.getByTestId(DELETE_DISABLED_TOOLTIP)).toBeVisible();
}

export async function verifyDownload(
  page: Page,
  workflowName:
    | "Metagenomic"
    | "Antimicrobial Resistance"
    | "Consensus Genome"
    | "Nanopore",
  sampleId: number,
) {
  switch (workflowName) {
    case "Metagenomic":
    case "Nanopore":
      await verifyDownloadFiles(page, FILE_DOWLOAD_TYPES_MNGS);
      await verifyDownloadUrls(page, sampleId);
      break;
    case "Antimicrobial Resistance":
      await verifyDownloadFiles(page, FILE_DOWLOAD_TYPES_AMR);
      break;
    case "Consensus Genome":
      await verifyDownloadFiles(page, FILE_DOWLOAD_TYPES_CG);
      break;
  }
}

async function verifyDownloadFiles(page: Page, downloadTypes: string[][]) {
  for (const downloadType of downloadTypes) {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      await page.getByRole("button", { name: DOWNLOAD }).click(),
      // await page.getByRole("option", { name: downloadType[0] }).click(),
      await page.getByTestId(downloadType[0]).click(),
    ]);
    expect(download.suggestedFilename()).toContain(downloadType[1]);
  }
}

async function verifyDownloadUrls(page: Page, sampleId: number) {
  for (const downloadType of URL_DOWLOAD_TYPES) {
    const [newTab] = await Promise.all([
      page.waitForEvent("popup"),
      await page.getByRole("button", { name: DOWNLOAD }).click(),
      await page.getByRole("option", { name: downloadType[0] }).click(),
    ]);
    await newTab.waitForLoadState();
    const newTabUrl = await newTab.url();
    expect(newTabUrl).toContain(
      `${process.env.BASEURL}/samples/${sampleId}${downloadType[1]}`,
    );
  }
}

export async function chooseBackgroundModel(page: Page) {
  // choose Background
  await page.getByTestId("background-filter").nth(0).click();

  await page
    .getByRole("option", { name: "Test Background Model Standard" })
    .getByText("Test Background Model")
    .click();
}

export async function applyFilter(page: Page) {
  await page.getByTestId("category-filter").click();
  await page.getByTestId("dropdown-viruses").click();
}
