import { expect, test } from "@playwright/test";
import {
  ALL_COLUMN_HEADERS,
  FILTER_HEADERS,
} from "../../constants/sample.const";
import {
  metadataSectionTitles,
  pipelineSectionTitles,
  verifySectionTitles,
} from "../../utils/report";
const sampleIds = [
  {type: "short-read", id: 25307},
  {type:"long-read", id: 26022},
];

// These tests verify the ui displayed on the Table  for the sample report page
test.describe("Sample report tests", () => {
  sampleIds.forEach((sampleId) => {
    test.beforeEach(async ({ page }) => {
      // go to sample page
      await page.goto(`${process.env.BASEURL}/samples/${sampleId.id}`);

      // click details link
      await page.getByText("Sample Details").click();
    });
    test(`Should verify header of sample report page ${sampleId.type}`, async ({ page }) => {
      const filter = await page.locator(FILTER_HEADERS).allInnerTexts();

      for (let i = 0; i < filter.length; i++) {
        expect(ALL_COLUMN_HEADERS.includes(filter[i]) === true);
      }
      const column_header = await page.locator(FILTER_HEADERS).allInnerTexts();

      for (let i = 0; i < column_header.length; i++) {
        expect(ALL_COLUMN_HEADERS.includes(column_header[i]) === true);
      }
    });

    test(`Should verify side bar on the sample report page ${sampleId.type}`, async ({ page }) => {
      await expect(page.getByTestId("metadata")).toBeVisible();
      await expect(page.getByTestId("pipelines")).toBeVisible();
      await expect(page.getByTestId("notes")).toBeVisible();

      // verify metadata section titles
      await verifySectionTitles(page, metadataSectionTitles);

      // verify pipeline section titles
      await page.getByTestId("pipelines").click();
      await verifySectionTitles(page, pipelineSectionTitles);
    });
  });
});
