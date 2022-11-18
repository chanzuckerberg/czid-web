import { Page } from "@playwright/test";
import { findByTextRole } from "./page";
import { getByTestID } from "./selectors";

export async function createProject(
  page: Page,
  name: string,
  privateAccess: boolean = true,
  description: string,
): Promise<any> {
  await page.locator(getByTestID("menu-item-upload")).click();

  await page.locator(getByTestID("create-project")).click();
  await page
    .locator('input[type="text"]')
    .nth(1)
    .fill(name);
  if (privateAccess) {
    await page.locator(getByTestID("private-project")).click();
  } else {
    await page.locator(getByTestID("public-project")).click();
  }
  await page.locator(getByTestID("project-description")).fill(description);
  await page.locator(getByTestID("create-project-btn")).click();

  //todo: assert project is created
}

export async function findProject(page: Page, name: string): Promise<any> {
  await page.locator(getByTestID("menu-item-upload")).click();
  await page.getByText("Select project").click();
  await (await findByTextRole(page, "Search")).fill(name);

  return page.getByText(name);
}
