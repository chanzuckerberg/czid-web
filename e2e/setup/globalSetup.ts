import { readFileSync } from "fs"; // Move this line before the import of @playwright/test
import { resolve } from "path"; // Move this line before the import of @playwright/test
import { chromium, expect, FullConfig } from "@playwright/test";
import { config } from "dotenv";
import { tag } from "../constants/common";
import { login } from "../utils/login";

config({ path: resolve(`.env.${process.env.NODE_ENV}`) });

/**
 * This function is run once at the start of the test
 * This is where we established shared cookies and other setups we want to
 * do before running any test
 * @param config
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const { storageState, baseURL } = config.projects[0].use;
  process.env.BASEURL = baseURL;

  if (process.env.NODE_ENV === "ci") {
    process.env.CI = "true";
  }

  if (!hasRecentlyLoggedIn()) {
    const username = process.env.CZID_USERNAME;
    const password = process.env.CZID_PASSWORD;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(process.env.BASEURL);
    expect(page.getByText(tag)).toBeVisible({ timeout: 30 * 1000 }); // Wait upto 30 seconds
    await page.getByTestId("home-top-nav-login").click();
    await login(page, username, password);
    await page.context().storageState({ path: storageState as string });
    await browser.close();
  }
}
export default globalSetup;

/**
 * This function checks if there is already valid cookie and skips login process
 * This is very helpful during development when we run lots of tests
 * @returns
 */
const hasRecentlyLoggedIn = (): boolean => {
  try {
    const cookieFile = "/tmp/state.json";
    const currentTime = new Date().getTime();
    const cookieJson = JSON.parse(readFileSync(cookieFile).toString())[
      "cookies"
    ];
    const cookie = cookieJson.find(cookie => cookie.name === "auth0");
    const expires = cookie["expires"] as number;
    const domain = cookie["domain"];
    if (
      expires > currentTime &&
      domain.includes(process.env.NODE_ENV.toUpperCase())
    ) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};
