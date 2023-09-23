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

  public async pressEnter() {
    await this.page.keyboard.press("Enter");
  }
  // #endregion Keyboard

  public async close() {
    this.page.close()
  }

  public async pause(seconds: number) {
    await this.page.waitForTimeout(seconds * 1000);
  }

  public async scrollToElement(locator: string, direction: 'up' | 'down') {
    const startTime = Date.now();
    const oneMinute = 60000; 
    const scrollAmount = direction === 'up' ? -500 : 500;

    while (true) {
        const element = await this.page.locator(locator).first();
        const isElementVisible = await element.isVisible();

        if (isElementVisible) {
            break; 
        }

        if (Date.now() - startTime > oneMinute) {
            console.warn('Stopped scrolling after 1 minute.');
            break;
        }

        await this.page.mouse.wheel(0, scrollAmount);
    }
  }

  public async scrollUpToElement(locator: string) {
    await this.scrollToElement(locator, 'up');
  }

  public async scrollDownToElement(locator: string) {
    await this.scrollToElement(locator, 'down');
  }
}
