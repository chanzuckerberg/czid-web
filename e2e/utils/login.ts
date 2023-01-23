import { Page } from "@playwright/test";
import { getByName } from "./selectors";
import path from "path";
import dotenv from "dotenv";
import { BasePage } from "../pages/basePage";

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

export async function createProject(
  basePage: BasePage,
  name: string,
): Promise<any> {
  await basePage.clickByText("Upload");
  await basePage.clickElement(".createProjectButton-2LwOb");
  await (
    await basePage.findBySelector(
      "div[class='ui fluid input idseq-ui'] input[type='text']",
    )
  ).fill(name);
  await basePage.clickElement('text="Private Project"');
  await (await basePage.findBySelector(".textarea-3GDxH")).fill(name);
  await basePage.clickElement("button[class='ui primary button idseq-ui']");
}
