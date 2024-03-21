import { Page } from "@playwright/test";

export abstract class PageObject {
  public page: Page;
  public baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = process.env.BASEURL;
  }

  // #region Keyboard
  public async pressEscape() {
    await this.page.keyboard.press("Escape");
  }

  public async pressEnter() {
    await this.page.keyboard.press("Enter");
  }
  // #endregion Keyboard

  // #region Get
  public async getLocator(locatorString: string) {
    return this.page.locator(locatorString);
  }

  public async getTable(headerColumnLocator: string, tableRowsLocator: string, tableDataLocator: string) {
    const DEFAULT_WAIT = 30 * 1000;
    await this.page.locator(headerColumnLocator).first().waitFor({timeout: DEFAULT_WAIT}).catch(() => null);
    await this.pause(1);
    const tableHeaders = await this.page.locator(headerColumnLocator).allTextContents().catch(() => {return [];});
    const tableRowElements = await this.page.locator(tableRowsLocator).all().catch(() => {return [];});
    const tableRowsText = [];
    for (const row of tableRowElements) {
      const tdElements = await row.locator(tableDataLocator).all();
      const tdText = [];
      for (const td of tdElements) {
        const tdInnerText = await td.innerText();
        const innerTextArray = tdInnerText.split("\n");
        const text = innerTextArray.length === 1 ? innerTextArray[0] : innerTextArray;
        tdText.push(text);
      }
      const tdValues = {};
      for (let i = 0; i < tableHeaders.length; i++) {
        tdValues[tableHeaders[i]] = tdText[i];
      }
      if (Object.keys(tdValues).length > 0) {
        tableRowsText.push(tdValues);
      }
    }
    return tableRowsText;
  }
  // #endregion Get

  // #region Click
  public async clickElement(locatorString: string) {
    (await this.getLocator(locatorString)).click();
  }
  // #endregion Click

  public async close() {
    await this.page.close();
  }

  public async url() {
    return this.page.url();
  }

  public async reload() {
    await this.page.reload();
  }

  public async pause(seconds: number) {
    await this.page.waitForTimeout(seconds * 1000);
  }

  public async scrollToElement(locator: string, direction: "up" | "down", rowsLocator: string, indexAttribute: string) {
    const startTime = Date.now();
    const timeout = 30000;
    const scrollAmount = direction === "up" ? -500 : 500;

    while ((Date.now() - startTime) < timeout) {
      const element = this.page.locator(locator).first();
      const isElementVisible = await element.isVisible();

      if (isElementVisible) {
        break;
      }
      await this.page.locator(rowsLocator).last().hover();
      await this.page.locator(rowsLocator).last().focus();

      const lastRow = await this.page.locator(rowsLocator).last().getAttribute(indexAttribute);

      await this.page.mouse.wheel(0, scrollAmount);

      const lastRowAfterScroll = await this.page.locator(rowsLocator).last().getAttribute(indexAttribute);
      if (lastRow === lastRowAfterScroll) {
        // The list has not advanced, assume we reached the end of the list
        break;
      }

    }
  }

  public async scrollUpToElement(locator: string, rowsLocator: string, indexAttribute: string) {
    await this.scrollToElement(locator, "up", rowsLocator, indexAttribute);
  }

  public async scrollDownToElement(locator: string, rowsLocator: string, indexAttribute: string) {
    await this.scrollToElement(locator, "down", rowsLocator, indexAttribute);
  }
}