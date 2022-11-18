import { Page } from "@playwright/test";
import * as path from "path";

export async function pressKey(page: Page, key: string) {
  await page.keyboard.press(key, { delay: 100 });
}

export async function findElement(page: Page, selector: string) {
  return page.locator(selector);
}

export async function selectFile(page: Page, filePath: string) {
  await page.setInputFiles("input[type='file']", path.resolve(filePath));
}

export async function findByTextRole(page: Page, name: string) {
  return page.getByRole("textbox", { name: name });
}
export async function findByComboBoxRole(page: Page) {
  return page.getByRole("combobox");
}
export async function findByCheckboxRole(page: Page, name: string) {
  return page.getByRole("checkbox", { name: name });
}

export async function fileChooser(page: Page, filePath: string) {
  const [fileChooser] = await Promise.all([
    // It is important to call waitForEvent before click to set up waiting.
    page.waitForEvent("filechooser"),
    // Opens the file chooser.
    page.locator(".csvUpload-1c9NS").click(),
  ]);
  await fileChooser.setFiles([path.resolve(filePath)]);
}
