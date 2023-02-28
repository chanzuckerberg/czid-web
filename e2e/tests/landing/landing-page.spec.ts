import path from "path";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
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
} from "../../constants/common.const";
import { BasePage } from "../../pages/basePage";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

let basePage: BasePage;
const href = "href";
// This is a test that verify various ui elements  on the public and my data page
test.describe("Landing page tests", () => {
  test("Should verify top nav elements", async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.gotoUrl(`${process.env.BASEURL}/my_data`);

    // verify logo
    await expect(await basePage.findByDataName(CZID)).toBeVisible();

    // My Data menu item has correct url
    await expect(await basePage.findByText(MY_DATA)).toHaveAttribute(
      href,
      HREF.MYDATA,
    );

    // Public menu item has correct url
    const linkWithTextPublic = await basePage.findByTestId("menu-item-public");
    expect(await linkWithTextPublic.getAttribute(href)).toBe(HREF.PUBLIC);

    // Upload menu item has correct url
    await expect(await basePage.findByText(UPLOAD)).toHaveAttribute(
      href,
      HREF.UPLOAD,
    );

    // Info icon
    // todo: is this intended that this icon has not href
    const infoIconIndex = 0;
    await expect(
      await basePage.findByLocator("button", infoIconIndex),
    ).toBeVisible();
  });

  test("Should verify filter section", async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.gotoUrl(`${process.env.BASEURL}/public`);

    // verify filter sections
    const taxonFilterIndex = 0;
    await expect(
      (await basePage.findByText(TAXON_FILTERS)).nth(taxonFilterIndex),
    ).toBeVisible();
    await expect(await basePage.findByText(METADATA_FILTERS)).toBeVisible();
  });

  test("Should verify discovery items", async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.gotoUrl(`${process.env.BASEURL}/my_data`);

    // Info icon
    // todo: is this intended that this icon has no href
    const infoIconIndex = 0;
    await expect(
      await basePage.findByLocator("button", infoIconIndex),
    ).toBeVisible();

    // filters
    const filterIconIndex = 1;
    await expect(
      await basePage.findByLocator("button", filterIconIndex),
    ).toBeVisible();

    // search field
    await expect(
      await basePage.findByPlaceHolder(SEARCH_MY_DATA),
    ).toBeVisible();

    // verify discovery items
    const projectDiscoveryItemIndex = 0;
    await expect(
      (await basePage.findByText(PROJECTS)).nth(projectDiscoveryItemIndex),
    ).toBeVisible();
    await expect((await basePage.findByText(SAMPLES)).nth(1)).toBeVisible();
    await expect(await basePage.findByText(VISUALIZATIONS)).toBeVisible();
  });
});
