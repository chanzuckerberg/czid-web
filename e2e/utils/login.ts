import { Page } from "@playwright/test";
import { getByName } from "./selectors";
import { BasePage } from "../pages/basePage";
export async function login(
  page: Page,
  username?: string,
  password?: string,
): Promise<void> {
  await page.locator(getByName("email")).fill(username as string);
  await page.locator(getByName("password")).fill(password as string);
  await Promise.all([
    page.waitForNavigation(),
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
