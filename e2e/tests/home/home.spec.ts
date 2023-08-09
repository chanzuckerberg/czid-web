import path from "path";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { CZID, footer, tag } from "../../constants/common";
import { getByDataName, getByLinkText, getByText } from "../../utils/selectors";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });
// This a test to verify if user is able to navigate to the home page.
test.describe("Home page tests", () => {
  // overwrite global login with empty storage so we can visit home page
  test.use({ storageState: "storage/emptyStorageState.json" });
  test("Should verify home page", async ({ page }) => {
    // now go to home page
    await page.goto(`${process.env.BASEURL}`);

    // verify tag is displayed
    await expect(page.locator(getByText(tag))).toBeVisible();

    // verify logo
    await expect(page.locator(getByDataName(CZID)).nth(0)).toBeVisible();

    // verify footer links
    Object.keys(footer).forEach(async key => {
      await expect(page.locator(getByLinkText(key)).nth(0)).toHaveAttribute(
        "href",
        footer[key],
      );
    });
  });
});
