import { Page } from "@playwright/test";

export abstract class PageObject {
  public page: Page;
  public baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = process.env.BASEURL
  }

  // #region Keyboard
  public async pressEscape() {
    await this.page.keyboard.press("Escape");
  }
  // #endregion Keyboard

  public async close() {
    this.page.close()
  }
}
