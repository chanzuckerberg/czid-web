import {
  CZID,
  HREF,
  METADATA_FILTERS,
  MY_DATA,
  PROJECTS,
  SAMPLES,
  SEARCH_MY_DATA,
  TAXON_FILTERS,
  UPLOAD,
  VISUALIZATIONS,
} from "@e2e/constants/common";
import { getByDataName } from "@e2e/utils/selectors";
import { expect, test } from "@playwright/test";

const href = "href";
// This is a test that verify various ui elements  on the public and my data page
test.describe("Landing page tests", () => {
  test("Should verify top nav elements", async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/my_data`);

    // verify logo
    await expect(page.locator(getByDataName(CZID))).toBeVisible();

    // My Data menu item has correct url
    await expect(await page.getByText(MY_DATA)).toHaveAttribute(
      href,
      HREF.MYDATA,
    );

    // Public menu item has correct url
    const linkWithTextPublic = page.getByTestId("menu-item-public");
    expect(await linkWithTextPublic.getAttribute(href)).toBe(HREF.PUBLIC);

    // Upload menu item has correct url
    await expect(await page.getByText(UPLOAD)).toHaveAttribute(
      href,
      HREF.UPLOAD,
    );

    // Info icon
    // todo: is this intended that this icon has not href
    const infoIconIndex = 0;
    await expect(page.getByRole("button").nth(infoIconIndex)).toBeVisible();
  });

  test("Should verify filter section", async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/public`);

    // verify filter sections
    const taxonFilterIndex = 0;
    await expect(
      page.getByText(TAXON_FILTERS).nth(taxonFilterIndex),
    ).toBeVisible();
    await expect(page.getByText(METADATA_FILTERS)).toBeVisible();
  });

  test("Should verify discovery items", async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/my_data`);

    // Info icon
    // todo: is this intended that this icon has no href
    const infoIconIndex = 0;
    await expect(page.getByRole("button").nth(infoIconIndex)).toBeVisible();

    // filters
    const filterIconIndex = 1;
    await expect(page.getByRole("button").nth(filterIconIndex)).toBeVisible();

    // search field
    await expect(await page.getByPlaceholder(SEARCH_MY_DATA)).toBeVisible();

    // verify discovery items
    const projectDiscoveryItemIndex = 0;
    await expect(
      page.getByText(PROJECTS).nth(projectDiscoveryItemIndex),
    ).toBeVisible();
    await expect(page.getByText(SAMPLES).nth(1)).toBeVisible();
    await expect(page.getByText(VISUALIZATIONS)).toBeVisible();
  });
});
