import { expect, Page, test } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { BasePage } from "../pages/basePage";
import {
  CZID,
  HREF,
  INCON_BUTTON,
  METADATA_FILTERS,
  MY_DATA,
  PROJECTS,
  SAMPLES,
  SEARCH_MY_DATA,
  tag,
  TAXON_FILTERS,
  UPLOAD,
  VISUALIZATIONS,
} from "../utils/constants";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const baseUrl: string = process.env.BASEURL || "";
let page: Page;
let basePage: BasePage;
const href = "href";

test.describe("Landing page tests", () => {
  test("Should verify top nav elements", async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.gotoUrl(`${process.env.BASEURL}/my_data`);

    // verify logo
    await expect(await basePage.findByDataName(CZID)).toBeVisible();

    // My Data menu item has correct url
    await expect(await basePage.findByText(MY_DATA)).toHaveAttribute(
      href,
      HREF.MYDATA
    );

    // Public menu item has correct url
    const publicMenuSelector = '.item-1x6Jb >> "Public"';
    const linkWithTextPublic = await basePage.findElement(publicMenuSelector);
    expect(await linkWithTextPublic.getAttribute(href)).toBe(HREF.PUBLIC);

    // Upload menu item has correct url
    await expect(await basePage.findByText(UPLOAD)).toHaveAttribute(
      href,
      HREF.UPLOAD
    );

    // Info icon
    // todo: is this intended that this icon has not href
    const infoIconIndex = 0;
    await expect(
      (await basePage.findByTestId(INCON_BUTTON)).nth(infoIconIndex)
    ).toBeVisible();
  });

  test("Should verify filter section", async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.gotoUrl(`${process.env.BASEURL}/my_data`);

    // verify filter sections
    const taxonFilterIndex = 0;
    await expect(
      (await basePage.findByText(TAXON_FILTERS)).nth(taxonFilterIndex)
    ).toBeVisible();
    await expect(await basePage.findByText(METADATA_FILTERS)).toBeVisible();
  });

  test("Should verify discovery items", async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.gotoUrl(`${process.env.BASEURL}/my_data`);

    // Info icon
    // todo: is this intended that this icon has not href
    const infoIconIndex = 0;
    await expect(
      (await basePage.findByTestId(INCON_BUTTON)).nth(infoIconIndex)
    ).toBeVisible();

    //filters
    const filterInconIndex = 1;
    await expect(
      (await basePage.findByTestId(INCON_BUTTON)).nth(filterInconIndex)
    ).toBeVisible();

    //search field
    await expect(
      await basePage.findByPlaceHolder(SEARCH_MY_DATA)
    ).toBeVisible();

    // verify discovery items
    const projectDiscoveryItemIndex = 0;
    await expect(
      (await basePage.findByText(PROJECTS)).nth(projectDiscoveryItemIndex)
    ).toBeVisible();
    await expect(await basePage.findByText(SAMPLES)).toBeVisible();
    await expect(await basePage.findByText(VISUALIZATIONS)).toBeVisible();
  });
});
