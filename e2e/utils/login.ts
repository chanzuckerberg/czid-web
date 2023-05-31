import { Page } from "@playwright/test";
import { getByName } from "./selectors";

export async function login(
  page: Page,
  username?: string,
  password?: string,
): Promise<void> {
  await page.locator(getByName("email")).fill(username as string);
  await page.locator(getByName("password")).fill(password as string);
  await page.locator(getByName("submit")).click();
  await page.waitForURL("**/my_data**");
}
