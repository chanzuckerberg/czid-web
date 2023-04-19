import { test, expect } from "@playwright/test";

const sampleId = 25307;
const linkURLs = [
  "www.ncbi.nlm.nih.gov",
  "en.wikipedia.org",
  "www.google.com",
  "pubmed.ncbi.nlm.nih.gov",
];
// These tests currently verify the Taxon Sidebar on Sample Report
test.describe("Taxon Sidebar on Sample Report", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);

    await page.getByText("Sample Details").click();
    // choose Background
    await page.getByTestId("background-filter").click();

    await page
      .getByRole("option", { name: "Test Background Model Standard" })
      .getByText("Test Background Model")
      .click();
    await page.getByTestId("expand-taxon-parent").nth(0).click();

    // click Taxon Name
    await page.getByText("Klebsiella pneumoniae").click();
  });

  test(`Should verify taxon info`, async ({ page }) => {
    // check that sidebar is visible
    await expect(page.getByTestId("details-sidebar")).toBeVisible();

    // check that name is correct
    const title = page.getByTestId("taxon-name");
    await expect(title).toContainText("Klebsiella pneumoniae");

    // check taxon id is correct
    const subtitle = page.getByTestId("taxon-id");
    await expect(subtitle).toContainText("573");

    // check taxon description exists
    const descriptionText = "taxon-description";
    let description = page.getByTestId(descriptionText).nth(0);
    await expect(description).toContainText(
      "Klebsiella pneumoniae is a Gram-negative, non-motile,",
    );

    // check that show more button adds more text
    await page.getByText("Show More").nth(0).click();
    description = page.getByTestId(descriptionText).nth(0);
    await expect(description).toContainText(
      "This article uses material from the Wikipedia",
    );

    // parent description should be visible
    const parentDescription = page.locator(descriptionText).nth(1);
    await expect(parentDescription).toContainText(
      "Klebsiella is a genus of nonmotile, Gram-negative, oxidase-negative, rod-shaped bacteria with a prominent polysaccharide-based capsule.",
    );
  });

  test(`Should verify histogram on Taxon sidebar`, async ({ page }) => {
    // check histogram exists
    await expect(page.getByTestId("taxon-histogram")).toBeVisible();
  });

  test(`Should verify links on taxon sidebar`, async ({ page }) => {
    // check links
    const links = await page.getByTestId("taxon-link").all();

    // for each link, click it and verify that it navigates to the correct page
    links.forEach((link, i) => {
      link.click();
      expect(page.url()).toContain(linkURLs[i]);
    });
  });
});
