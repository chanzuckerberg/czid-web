import { expect, Page } from "@playwright/test";
import { getByName, getByTestID, getByText } from "./selectors";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });
export async function login(
  page: Page,
  username?: string,
  password?: string,
): Promise<void> {
  const email = username !== undefined ? username : process.env.CZID_USERNAME;
  const pwd = password !== undefined ? password : process.env.CZID_PASSWORD;
  await page.locator(getByName("email")).fill(email as string);
  await page.locator(getByName("password")).fill(pwd as string);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle" }),
    page.locator(getByName("submit")).click(),
  ]);
}
