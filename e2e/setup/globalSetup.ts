import { readFileSync } from "fs"; // Move this line before the import of @playwright/test
import { resolve } from "path"; // Move this line before the import of @playwright/test
import { chromium, expect, FullConfig } from "@playwright/test";
import { config } from "dotenv";
import { tag } from "../constants/common";
import { login } from "../utils/login";

config({ path: resolve(`.env.${process.env.NODE_ENV}`) });

const MILLISECONDS_IN_HOUR = 3600000;
const AUTH0_EXPIRATION_HOURS = 72;
const REAUTHENTICATE_AFTER_HOURS = 8;

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

  if (!hasRecentlyLoggedIn(storageState as string)) {
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
const hasRecentlyLoggedIn = (cookieFile: string): boolean => {
  try {
    const currentTime = new Date().getTime();
    const cookieJson = JSON.parse(readFileSync(cookieFile).toString())[
      "cookies"
    ];
    const cookie = cookieJson.find(cookie => cookie.name === "auth0");
    const auth0ExpiresSeconds = cookie["expires"] as number;

    return getTimeForReauthenticating(auth0ExpiresSeconds) > currentTime;
  } catch (error) {
    return false;
  }
};

// the auth0 expires time stored in our cookie is 72 hours from login time, but the system generally
// requires re-authentication after a much shorter period of time depending on activity.
// This function calculates re-authentication time based on REAUTHENTICATE_AFTER_HOURS
const getTimeForReauthenticating = (auth0ExpiresSeconds: number): number => {
  // expires is stored in seconds, e.g. 1722725055.953518
  // so we need to convert it to milliseconds for accurate comparison
  const auth0ExpiresMilliseconds = auth0ExpiresSeconds * 1000;

  const millisecondsToSubtract = (AUTH0_EXPIRATION_HOURS - REAUTHENTICATE_AFTER_HOURS) * MILLISECONDS_IN_HOUR;
  return auth0ExpiresMilliseconds - millisecondsToSubtract;
}
