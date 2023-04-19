import path from "path";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const baseUrl = (process.env.BASEURL as string) || "";
const sampleId = "25655";
const url = `samples/${sampleId}/pipeline_viz/7.1`;

// Note (04/12/2023): These tests currently verify the Pipeline Viz Sidebar UI elements
// - More tests should be added to verify the functionality of other parts of the view
test.describe("Pipeline Viz View tests", () => {
  test.beforeEach(async ({ page }) => {
    const fullUrl = `${baseUrl}/${url}`;
    await page.goto(fullUrl);
    await page.getByText("Accept All Cookies").click();
  });

  test("Should open sidebar on click", async ({ page }) => {
    await page.mouse.click(450, 450);
    await expect(page.getByTestId("details-sidebar")).toBeVisible();
    const title = await page.getByTestId("stepName").textContent();
    expect(title).toContain("STAR");
    await expect(page.getByTestId("input-files")).toBeVisible();
    await expect(page.getByTestId("output-files")).toBeVisible();
  });
});
