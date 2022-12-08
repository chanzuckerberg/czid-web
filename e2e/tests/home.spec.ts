import { expect, test } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { BasePage } from "../pages/basePage";
import { CZID, footer, tag } from "../utils/constants";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

test.describe("Home page tests", () => {
  // overwrite global login with empty storage so we can visit home page
  test.use({ storageState: "storage/emptyStorageState.json" });
  test("Should verify home page @nologin", async ({ page }) => {
    const basePage = new BasePage(page);
    //now go to home page
    await basePage.gotoUrl(`${process.env.BASEURL}`);

    // verify tag is displayed
    await expect(await basePage.findByText(tag)).toBeVisible();

    // verify logo
    await expect((await basePage.findByDataName(CZID)).nth(0)).toBeVisible();

    // verify footer links
    Object.keys(footer).forEach(async (key) => {
      await expect((await basePage.findLinkByText(key)).nth(0)).toHaveAttribute(
        "href",
        footer[key]
      );
    });
  });
});
