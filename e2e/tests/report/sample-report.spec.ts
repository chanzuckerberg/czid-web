import path from "path";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { BasePage } from "../../pages/basePage";
import {
  METAGENOMICS,
  MENU_ITEM_PUBLIC,
  SEARCH_PUBLIC,
  SAMPLE_NUMBER,
  PIPELINE_LINK,
  PIPELINE_LINK_PATH,
  SAMPLE_HEADER,
  SAMPLE_LANDING,
  SAMPLE_DETAILS,
  SEARCH_BAR,
  FILTER_HEADERS,
  ALL_COLUMN_HEADERS,
  META,
  PIPELINES,
  NOTES,
  SIDE_BAR_HEADER,
  HOST_INFO,
  SAMPLE_INFO,
  INFECTION_INFO,
  SEQUENCING_INFO,
  PIPELINE_INFO,
  READS_REMAINING,
  ERCC,
  DOWNLOADS,
  METADATA_LABELS,
  ALL_SAMPLE_INFO,
  ALL_HOST_INFO,
  All_INFECTION_INFO,
  ALL_SEQUENCING_INFO,
  EDIT_METADATA,
  METADATA_DROP_DOWN,
  DROP_DOWN,
  DNA,
  RNA,
  COLLECTION_DATE_FIELD,
  WRONG_DATE_FORMAT,
  WRONG_DATE_ERROR_MSG,
  RIGHT_DATE_FORMAT,
  HOST_INFO_DROPDOWNS,
  META_DATA_DROP_DOWN_,
  NUMBER_INPUT,
  INFECTION_INFO_DROPDOWN,
  SEQUENCING_INFO_DROP_DOWN,
} from "../../utils/constants";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const projectName = "floo Neptunium";

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

test.describe("Sample report test", () => {
  test(`Should verify content displayed on the header of sample report page`, async ({
    page,
    context,
  }) => {
    const basePage = new BasePage(page);

    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();

    // select sample from list
    await page
      .locator(SAMPLE_NUMBER)
      .nth(0)
      .click();
    expect(page.locator(PIPELINE_LINK)).toBeVisible();
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      // Opens a new tab
      page.locator(PIPELINE_LINK).click(),
    ]);
    await newPage.waitForLoadState();
    newPage.url().includes(PIPELINE_LINK_PATH);
    expect(newPage.locator(SAMPLE_LANDING)).toBeVisible();

    // navigate to new page
    await newPage.locator(SAMPLE_LANDING).click();
    await newPage.waitForLoadState();
    await expect(newPage.locator(SAMPLE_HEADER)).toBeVisible();
    await newPage.close();

    expect(page.locator(SAMPLE_DETAILS)).toBeVisible();
    expect(page.locator(SEARCH_BAR)).toBeVisible();

    const filter = await page.locator(FILTER_HEADERS).allInnerTexts();

    for (let i = 0; i < filter.length; i++) {
      ALL_COLUMN_HEADERS.includes(filter[i]);
    }
    const column_header = await page.locator(FILTER_HEADERS).allInnerTexts();

    for (let i = 0; i < column_header.length; i++) {
      ALL_COLUMN_HEADERS.includes(column_header[i]);
    }
  });

  test(`Should verify content displayed on side bar when sample details is clicked on the sample report page`, async ({
    page,
  }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();
    await clickSampleDetails(page);
    await expect(page.locator(META)).toBeVisible();
    await expect(page.locator(PIPELINES)).toBeVisible();
    await expect(page.locator(NOTES)).toBeVisible();

    // Metadata tab
    await page.locator(META).click();
    await expect(page.locator(SIDE_BAR_HEADER).nth(0)).toHaveText(SAMPLE_INFO);
    await expect(page.locator(SIDE_BAR_HEADER).nth(1)).toHaveText(HOST_INFO);
    await expect(page.locator(SIDE_BAR_HEADER).nth(2)).toHaveText(
      INFECTION_INFO,
    );
    await expect(page.locator(SIDE_BAR_HEADER).nth(3)).toHaveText(
      SEQUENCING_INFO,
    );

    // Pipelines bar
    await page.locator(PIPELINES).click();
    await expect(page.locator(SIDE_BAR_HEADER).nth(0)).toHaveText(
      PIPELINE_INFO,
    );
    await expect(page.locator(SIDE_BAR_HEADER).nth(1)).toHaveText(
      READS_REMAINING,
    );
    await expect(page.locator(SIDE_BAR_HEADER).nth(2)).toHaveText(ERCC);
    await expect(page.locator(SIDE_BAR_HEADER).nth(3)).toHaveText(DOWNLOADS);
  });

  test(`Should verify content displayed on side bar metadata section of sample report page`, async ({
    page,
  }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();
    await clickSampleDetails(page);
    await expect(page.locator(META)).toBeVisible();
    await expect(page.locator(PIPELINES)).toBeVisible();
    await expect(page.locator(NOTES)).toBeVisible();

    // Metadata tab
    await page.locator(META).click();

    const sample_info = await page.locator(METADATA_LABELS).allInnerTexts();
    for (let i = 0; i < sample_info.length; i++) {
      ALL_SAMPLE_INFO.includes(sample_info[i]);
    }
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(0)
      .click();

    await page
      .locator(SIDE_BAR_HEADER)
      .nth(1)
      .click();
    const host_info = await page.locator(METADATA_LABELS).allInnerTexts();
    for (let i = 0; i < host_info.length; i++) {
      ALL_HOST_INFO.includes(host_info[i]);
    }
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(1)
      .click();

    await page
      .locator(SIDE_BAR_HEADER)
      .nth(2)
      .click();
    const infection_info = await page.locator(METADATA_LABELS).allInnerTexts();
    for (let i = 0; i < infection_info.length; i++) {
      All_INFECTION_INFO.includes(host_info[i]);
    }
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(2)
      .click();

    await page
      .locator(SIDE_BAR_HEADER)
      .nth(3)
      .click();
    const sequencing_info = await page.locator(METADATA_LABELS).allInnerTexts();
    for (let i = 0; i < sequencing_info.length; i++) {
      ALL_SEQUENCING_INFO.includes(host_info[i]);
    }
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(3)
      .click();
  });

  test(`Should verify content displayed on the sample info metadata section`, async ({
    page,
  }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();

    await clickSampleDetails(page);

    // Metadata tab
    await page.locator(META).click();
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(0)
      .hover();
    await page
      .locator(EDIT_METADATA)
      .nth(0)
      .click();
    await page.locator(METADATA_DROP_DOWN).click();

    // verify content on dropdown
    await expect(page.locator(DROP_DOWN).locator(DNA)).toBeVisible();
    await expect(page.locator(DROP_DOWN).locator(RNA)).toBeVisible();
    await page.locator(METADATA_DROP_DOWN).click();

    // verify input variable allowed
    const rightDateFormat = RIGHT_DATE_FORMAT;
    for (let i = 0; i < rightDateFormat.length; i++) {
      await page.locator(COLLECTION_DATE_FIELD).fill(rightDateFormat[i]);
      await page.locator(META).click();
      await expect(page.locator(WRONG_DATE_ERROR_MSG)).not.toBeVisible();
    }

    const wrongDateFormat = WRONG_DATE_FORMAT;

    for (let i = 0; i < wrongDateFormat.length; i++) {
      await page.locator(COLLECTION_DATE_FIELD).fill(wrongDateFormat[i]);
      await page.locator(META).click();
      await expect(page.locator(WRONG_DATE_ERROR_MSG)).toBeVisible();
    }
  });

  test(`Should verify content displayed on the host info metadata section`, async ({
    page,
  }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();

    await clickSampleDetails(page);

    // Metadata tab
    await page.locator(META).click();
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(0)
      .click();
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(1)
      .click();

    await page
      .locator(SIDE_BAR_HEADER)
      .nth(1)
      .hover();
    await page
      .locator(EDIT_METADATA)
      .nth(1)
      .click();

    // verify content in dropdown
    for (let i = 0; i < 5; i++) {
      await page
        .locator(METADATA_DROP_DOWN)
        .nth(i)
        .click();
      for (let j = 0; j < HOST_INFO_DROPDOWNS[i].length; j++) {
        (await page.locator(META_DATA_DROP_DOWN_).allInnerTexts()).map(
          value => {
            HOST_INFO_DROPDOWNS[i].includes(value);
          },
        );
      }
      await page
        .locator(METADATA_DROP_DOWN)
        .nth(i)
        .click();
    }

    // verify input variable allowed
    await expect(page.locator(NUMBER_INPUT)).toBeVisible();
    await page.locator('text="Done Editing"').click();
  });

  test(`Should verify content displayed on the infection info metadata section`, async ({
    page,
  }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();

    await clickSampleDetails(page);

    // Metadata tab
    await page.locator(META).click();
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(0)
      .click();
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(2)
      .click();

    await page
      .locator(SIDE_BAR_HEADER)
      .nth(2)
      .hover();
    await page
      .locator(EDIT_METADATA)
      .nth(2)
      .click();

    await expect(page.locator(NUMBER_INPUT)).toBeVisible();
    await page.locator(METADATA_DROP_DOWN).click();

    (await page.locator(META_DATA_DROP_DOWN_).allInnerTexts()).map(value => {
      INFECTION_INFO_DROPDOWN.includes(value);
    });
  });

  test(`Should verify content displayed on the sequencing info metadata section`, async ({
    page,
  }) => {
    const basePage = new BasePage(page);
    await getProject(basePage, projectName);
    await (await basePage.findByText(METAGENOMICS)).click();

    await clickSampleDetails(page);

    // Metadata tab
    await page.locator(META).click();
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(0)
      .click();
    await page
      .locator(SIDE_BAR_HEADER)
      .nth(3)
      .click();

    await page
      .locator(SIDE_BAR_HEADER)
      .nth(3)
      .hover();
    await page
      .locator(EDIT_METADATA)
      .nth(3)
      .click();
    await expect(page.locator(NUMBER_INPUT)).toBeVisible();

    // verify drop d own content
    for (let i = 0; i < 2; i++) {
      await page
        .locator(METADATA_DROP_DOWN)
        .nth(i)
        .click();
      for (let j = 0; j < SEQUENCING_INFO_DROP_DOWN[i].length; j++) {
        (await page.locator(META_DATA_DROP_DOWN_).allInnerTexts()).map(
          value => {
            SEQUENCING_INFO_DROP_DOWN[i].includes(value);
          },
        );
      }
      await page
        .locator(METADATA_DROP_DOWN)
        .nth(i)
        .click();
    }
  });
});
