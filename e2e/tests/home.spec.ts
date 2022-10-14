import { expect, test } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { BasePage } from "../pages/basePage";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const footer: Record<string, string> = {
  Github: "https://github.com/chanzuckerberg/czid-workflows",
  Careers: "https://boards.greenhouse.io/chanzuckerberginitiative/jobs/3293983",
  Resources: "http://help.czid.org",
};
const tag =
  "Chan Zuckerberg ID: The free, cloud-based metagenomics platform for researchers";
test.describe("Home page tests", () => {
  // overwrite global login with empty storage so we can visit home page
  test.use({ storageState: "storage/emptyStorageState.json" });
  test("Should verify home page", async ({ page }) => {
    //now go to home page
    await page.goto(`${process.env.BASEURL}`);

    const base = new BasePage(page);

    // verify tag is displayed
    await expect(await base.findByText(tag)).toBeVisible();

    // verify logo
    await expect((await base.findByDataName("CZ ID")).nth(0)).toBeVisible();

    // verify footer links
    Object.keys(footer).forEach(async key => {
      await expect(
        await (await base.findLinkByText(key)).nth(0),
      ).toHaveAttribute("href", footer[key]);
    });
  });
});
