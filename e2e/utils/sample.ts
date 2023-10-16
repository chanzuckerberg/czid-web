import { TEST_SAMPLES } from "@e2e/constants/data";
import { expect, Page } from "@playwright/test";

/*
 * Navigates to sample page based on sample name
 */
export async function goToSamplePage(
  page: Page,
  sampleId: number,
): Promise<any> {
  const ENV = `${process.env.NODE_ENV}`;
  const sampleName = TEST_SAMPLES[ENV.toUpperCase()][sampleId];
  const baseUrl = `${process.env.BASEURL}`;
  const targetUrl = `${baseUrl}/my_data?currentDisplay=table&currentTab=samples&mapSidebarTab=samples&search=${sampleName}`;
  await page.goto(targetUrl, {
    waitUntil: "domcontentloaded",
  });
  await page.getByText(sampleName as string).first().click();

  // wait for LOADING to disappear
  await expect(async () => {
    expect(await page.getByText("Loading report data").count()).toBe(0);
  }).toPass({
    intervals: [1_000, 2_000, 10_000],
    timeout: 120_000,
  });
}

/*
 * Get sample Id by name
 * Useful when need to know sample id, e.g. for heatmap tests
 */
export async function getLocalSampleId(
  page: Page,
  sampleId: number,
): Promise<any> {
  await goToSamplePage(page, sampleId);
  return page.url().split("/")[2].split("?")[0];
}
