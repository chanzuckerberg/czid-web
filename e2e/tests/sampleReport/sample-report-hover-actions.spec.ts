import { test, expect } from "@playwright/test";

const sampleId = 25745;

test.describe("Hover Actions on Sample Report", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);
  });
  test("Should verify CG modal is opened on click of hover action", async ({ page }) => {
    // choose Background
    await page.getByTestId("background-filter").click();

    await page
      .getByRole("option", { name: "Test Background Model Standard" })
      .getByText("Test Background Model")
      .click();

    // expand taxon parent
    await page.getByTestId("expand-taxon-parent").first().click();
    // hover on taxon name
    await page.getByText("Rhinovirus C").hover();

    // click on that taxon's CG icon
    await page.getByTestId("hover-action-consensus-genome-463676").click();
    expect(await page.getByTestId("consensus-genome-modal").hover()).toBeTruthy();
  });
});
