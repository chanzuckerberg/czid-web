import { expect, test } from "@playwright/test";
import { VIEWS, FILTER_RESULT, TREE_NODES } from "../../constants/sample.const";

const sampleId = 25307;
// These tests verify the ui displayed on the treeview for the sample report page
test.describe("Sample report view test", () => {
  test(`Should verify content displayed on tree view page`, async ({
    page,
  }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);

    // navigate to table view
    await page
      .locator(VIEWS)
      .nth(0)
      .click();
    await expect(page.locator(FILTER_RESULT).nth(0)).toBeVisible();
    await page
      .locator(VIEWS)
      .nth(1)
      .click();
    await expect(page.locator(TREE_NODES).nth(0)).toBeVisible();

    // Would remove the comment as soon as test id is ready
    // await page.locator(KNOWN_PATHOGEN).hover();

    // await expect(page.locator(PATHOGEN_POPUP)).toHaveText(PATHOGEN_POPUP_TEXT);

    // const [newPage] = await Promise.all([
    //   context.waitForEvent("page"),
    //   await page.locator(PATHOGEN_LINk).locator(FULL_LIST).click(),
    // ]);
    // await newPage.waitForLoadState();
    // newPage.url().includes(PATHOGEN_LIST_URL);
    // await expect(newPage.locator(TREE_VIEW_TITLE)).toBeVisible();
    // await newPage.close();
    await page
      .locator(TREE_NODES)
      .nth(0)
      .click();
    await expect(page.locator(TREE_NODES).nth(1)).not.toBeVisible();
  });
});
