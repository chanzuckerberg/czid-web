import { acceptCookies } from "@e2e/utils/page";
import { expect, test } from "@playwright/test";
import { SEARCH_BAR } from "../../constants/sample";
const sampleId = 25745;

test.describe("Blast Hover Actions on Sample Report", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);
    await acceptCookies(page);
  });

  test.skip("Should verify BlastN modal flow on click of hover action", async ({
    page,
    context,
  }) => {
    // hover on taxon name
    await page.locator('[class*="taxonName"]').getByText("Klebsiella").click();
    // click on that taxon's Blast icon
    await page.getByTestId("hover-action-blast-570-v-1").click();
    expect(page.getByTestId("blast-selection-modal")).toBeVisible();

    // for the BlastN flow
    // await page.pause();
    await page.locator('[class*="radioButton"]').first().click(); // select BlastX
    await page.getByText("Continue").click();

    // selet contig
    await page.getByText("NODE_25_length_597_cov_0.916974").click();
    await page.getByText("Continue").click();

    // expect(page.getByTestId("blast-redirection-modal")).toBeVisible();

    const pagePromise = context.waitForEvent("page");
    await page.getByText("Continue", { exact: true }).nth(1).click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain("https://blast.ncbi.nlm.nih.gov/");
    await newPage.close();

    // toast is visible
    expect(page.getByRole("alert"));
  });

  test.skip("Should verify BlastX modal flow on click of hover action", async ({
    page,
    context,
  }) => {
    // hover on taxon name
    await page.locator('[class*="taxonName"]').getByText("Lupinus").click();
    // click on that taxon's Blast icon

    await page.getByTestId("hover-action-blast-570-v-1").click();
    expect(page.getByTestId("blast-selection-modal")).toBeVisible();

    // for the BlastX flow
    await page.locator('[class*="radioButton"]').nth(1).click(); // select BlastX option
    await page.getByText("Continue").click();
    // await page.pause();
    // select continue
    // await page.getByText("NODE_50_length_477_cov_1.310427").click();
    // await page.getByText("NR Hits").click();
    // await page.getByText("NODE_35_length_534_cov_1.135699").click();
    // await page.getByText("Continue").click();

    // expect(page.getByTestId("blast-redirection-modal")).toBeVisible();

    // Start waiting for new page before clicking.
    const pagePromise = context.waitForEvent("page");
    await page.getByText("NCBI").click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain("https://blast.ncbi.nlm.nih.gov/");
    await newPage.close();

    // toast is visible
    expect(page.getByText("Dismiss")).toBeVisible();
  });

  test.skip("BlastN is disabled and 5 reads have been selected", async ({
    page,
  }) => {
    // search for Salmonella
    await page.locator(SEARCH_BAR).fill("Salmonella");
    await page.getByText("Salmonella (genus)").click();

    // hover and click on blast icon
    await page.getByText("Salmonella", { exact: true }).hover();
    await page.getByTestId("hover-action-blast-590-v-1").click();

    // verify blast selection modal functionality
    // expect(page.getByTestId("blast-selection-modal")).toBeVisible();
    await page.getByText("blastx", { exact: true }).click();
    await page.getByText("Continue").click();

    // verify contig selection modal functionality
    expect(page.getByText("NT hits", { exact: true })).toBeDisabled();
    expect(
      page.getByText("Up to 5 NR reads have been selected."),
    ).toBeVisible();
  });
});
