import { chromium, FullConfig } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { login } from "../utils/login";
import fs from "fs";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const username: string = process.env.USERNAME as string;
const password: string = process.env.PASSWORD as string;

async function globalSetup(config: FullConfig): Promise<void> {
  const { storageState } = config.projects[0].use;
  const { baseURL } = config.projects[0].use;
  if (!checkCookies()) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(baseURL as string);
    await login(page, username, password);
    await page.waitForNavigation();
    await page.context().storageState({ path: storageState as string });
    await browser.close();
  }
}
export default globalSetup;

/**
 * This function checks if there already valid cookie and skips login process
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
    const cookie = cookieJson.find(cookie => cookie.name === "auth0");
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
