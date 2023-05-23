import { expect, test } from "@playwright/test";

test.describe("Sample Message tests", () => {
  const sampleMessage = "sample-message";
  test(`Should verify Sample Message renders if upload failed`, async ({ page }) => {
    const sampleId = 25528;
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);
    await expect(page.getByTestId(sampleMessage)).toBeVisible();
  });

  test(`Should verify Sample Message renders if workflow failed`, async ({ page }) => {
    const sampleId = 25987;
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);
    // click on AMR tab
    await page.getByTestId("antimicrobial-resistance").click();
    await expect(page.getByTestId(sampleMessage)).toBeVisible();

  });

  test(`Should verify Sample Message renders if pipeline is complete with issue`, async ({ page }) => {
    const sampleId = 25986;
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);
    await expect(page.getByTestId(sampleMessage)).toBeVisible();
  });
});
