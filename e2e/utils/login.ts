import { Page } from "@playwright/test";
import { BasePage } from "../pages/basePage";

export async function login(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  const basePage = new BasePage(page);
  await basePage.gotoUrl(`${process.env.BASEURL}`);
  await basePage.clickByText("Sign in");
  await basePage.fillByName("email", username);
  await basePage.fillByName("password", password);
  await Promise.all([await basePage.clickByName("submit")]);
}
