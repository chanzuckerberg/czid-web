import { acceptCookies } from "@e2e/utils/page";
import { expect, test } from "@playwright/test";

const baseUrl = (process.env.BASEURL as string) || "";
const sampleId = "25609";
const url = `samples/${sampleId}/pipeline_viz/7.1`;

// Note (04/12/2023): These tests currently verify the Pipeline Viz Sidebar UI elements
// - More tests should be added to verify the functionality of other parts of the view
test.describe("Pipeline Viz View tests", () => {
  test.beforeEach(async ({ page }) => {
    const fullUrl = `${baseUrl}/${url}`;
    await page.goto(fullUrl);
    await acceptCookies(page);
  });

  test.fixme("Should render the Pipeline Version Select", async ({ page }) => {
    await expect(page.getByTestId("pipeline-version-select")).toBeVisible();
  });

  test("Should open sidebar on click", async ({ page }) => {
    await page.mouse.click(450, 450);
    await expect(page.getByTestId("details-sidebar")).toBeVisible();
    const title = await page.getByTestId("stepName").textContent();
    expect(title).toContain("STAR");
    expect(page.locator(".title-39IcE").nth(1)).toContainText("Input Files");
    expect(page.locator(".title-39IcE").nth(2)).toContainText("Output Files");
  });
});
