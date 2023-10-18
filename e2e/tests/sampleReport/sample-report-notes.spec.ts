import { expect, test } from "@playwright/test";

const sampleId = 25307;

// These tests verifies ui functionalities on the Notes Tab on the sample report page
test.describe("Sample report pipeline tests", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);

    // click details link
    await page.getByText("Sample Details").click();

    // select Notes tab
    await page.getByTestId("notes").click();
  });

  test(`Should verify no data on notes tab`, async ({ page }) => {
    await expect(page.locator(".noData-24F7k")).toBeVisible();
  });

  test(`Should edit notes section`, async ({ page }) => {
    // Click the edit button
    await page.getByText("Edit").nth(0).click();

    // edit Notes Text
    await page
      .locator(".textareaContainer-2my8K")
      .locator("textarea")
      .fill(`Notes info edited`);
  });
});
