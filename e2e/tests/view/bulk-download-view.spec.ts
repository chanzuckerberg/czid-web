import path from "path";
import { acceptCookies } from "@e2e/utils/page";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const baseUrl = (process.env.BASEURL as string) || "";
const url = "bulk_downloads";
const detailsLink = "download-details-link";

// Note (04/12/2023): These tests currently verify the Bulk Downloads Sidebar UI elements
// - More tests should be added to verify the functionality of other parts of the view
test.describe("Bulk Downloads View tests", () => {
  test.beforeEach(async ({ page }) => {
    const fullUrl = `${baseUrl}/${url}`;
    await page.goto(fullUrl);
    await acceptCookies(page);
  });

  test("Should open sidebar on click", async ({ page }) => {
    await page.getByTestId(detailsLink).nth(0).click();
    await expect(page.getByTestId("details-sidebar")).toBeVisible();

    // check that there are two sections in the first tab
    await expect(page.getByTestId("details")).toBeVisible();

    // select the second tab
    await page.getByTestId("advanced-download").click();

    // check that the second tab has download information
    // This will be changed when the pr is merged
    await expect(page.getByTestId("cloud-command-container")).toBeVisible();
    // check that the sidebar closes on click
    await page.locator('[class*="closeIcon"]').click();
    await expect(page.getByTestId("details-sidebar")).not.toBeVisible();
  });

  test("Should change download selected on click", async ({ page }) => {
    // check that the title of the sidebar matches the download name
    const downloadName = await page
      .getByTestId("download-name")
      .nth(0)
      .textContent();
    await page.getByTestId(detailsLink).nth(0).click();
    const title = await page.getByTestId("sidebar-download-name").textContent();
    expect(title).toContain(downloadName);

    // check that the download name changes on click
    const downloadName2 = await page
      .getByTestId("download-name")
      .nth(1)
      .textContent();
    await page.getByTestId(detailsLink).nth(1).click();
    const title2 = await page
      .getByTestId("sidebar-download-name")
      .textContent();
    expect(title2).toContain(downloadName2);
  });
});
