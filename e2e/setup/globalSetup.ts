import { chromium, expect, FullConfig } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { login } from "../utils/login";
import fs from "fs";
import { getByTestID, getByText } from "../utils/selectors";
import { tag } from "../utils/constants";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const username: string = process.env.CZID_USERNAME as string;
const password: string = process.env.CZID_PASSWORD as string;

/**
 * This function is run once at the start of the test
 * This is where we established shared cookies and other setups we want to
 * do before running an test
 * @param config
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const { storageState } = config.projects[0].use;
  if (process.env.NODE_ENV === "ci" || !checkCookies()) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await Promise.all([
      page.goto(`${process.env.BASEURL}`, { waitUntil: "networkidle" }),
    ]);
    expect(page.locator(getByText(tag))).toBeVisible({ timeout: 120000 });
    await page.locator(getByTestID("home-top-nav-login")).click();
    await login(page, username, password);
    await page.context().storageState({ path: storageState as string });
    const cookieJson = JSON.parse(
      fs.readFileSync(storageState as string).toString()
    );
    await browser.close();
  }
}
export default globalSetup;

/**
 * This function checks if there is already valid cookie and skips login process
 * This is very help during development when we run lots of tests
 * @returns
 */
function checkCookies(): boolean {
  try {
    const cookieFile = "/tmp/state.json";
    const currentTime = new Date().getTime();
    const cookieJson = JSON.parse(fs.readFileSync(cookieFile).toString())[
      "cookies"
    ];
    const cookie = cookieJson.find((cookie) => cookie.name === "auth0");
    const expires = cookie["expires"] as number;
    const domain = cookie["domain"];
    if (expires > currentTime && domain.includes(process.env.DOMAIN)) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}
