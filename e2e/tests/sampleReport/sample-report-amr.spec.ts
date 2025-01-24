import { expect, test } from "@playwright/test";
const sampleId = 27169;

test.describe("Sample report tests", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(
      `${process.env.BASEURL}/samples/${sampleId}?currentTab=Antimicrobial%20Resistance`,
    );
  });

  test(`Should verify AMR sample report is rendered`, async ({ page }) => {
    await expect(page.getByTestId("gene-info-group-header")).toBeVisible();
    await expect(page.getByTestId("contigs-group-header")).toBeVisible();
    await expect(page.getByTestId("reads-group-header")).toBeVisible();

    // nth(0) is the header row, nth(1) is the first row of data
    await expect(page.getByTestId("amr-table-row").nth(1)).toBeVisible();
  });
});
