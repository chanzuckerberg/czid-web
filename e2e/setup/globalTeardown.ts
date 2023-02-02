import path from "path";
import { chromium, expect } from "@playwright/test";
import dotenv from "dotenv";
import { tag } from "../utils/constants";
import { login } from "../utils/login";
import { getByText } from "../utils/selectors";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

async function globalTeardown() {
  const username: string = process.env.CZID_USERNAME as string;
  const password: string = process.env.CZID_PASSWORD as string;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, username, password);
  await page.locator(".userName-3c0tQ").click();
  await Promise.all([page.locator(getByText("Logout")).click()]);

  await context.clearCookies();
  await page.goto(`${process.env.BASEURL}`, { timeout: 120000 });
  await expect(page.locator(getByText(tag))).toBeVisible();
  await browser.close();
}

export default globalTeardown;
