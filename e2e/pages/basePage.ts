import { Page } from "@playwright/test";
import * as path from "path";

/**
 * Base class with convenience wrappers for interactions
 * with page elements
 */
export class BasePage {
  constructor(public readonly page: Page) {}

  async gotoUrl(url: string, option?: any) {
    if (option) {
      this.page.goto(url, option);
    } else {
      this.page.goto(url);
    }
  }

  async url() {
    return this.page.url();
  }
  /**
   * Convenience method to press the enter key
   */
  async pressEnter() {
    this.page.keyboard.press("Enter");
  }

  /**
   * Convenience method to press the escape key.
   */
  async pressEsc() {
    this.page.keyboard.press("Escape");
  }

  /**
   * Convenience method to press key.
   */
  async pressKey(key: string) {
    this.page.keyboard.press(key, { delay: 100 });
  }
  /**
   * Convenience method to press the tab key.
   */
  async pressTab() {
    this.page.keyboard.press("Tab");
  }

  async clickElement(selector: string) {
    await this.page.click(selector);
  }

  /**
   * Convenience method to click by text
   * @param value text value
   */
  async clickByText(value: string) {
    await this.page.click(`text=${value}`);
  }

  /**
   * Convenience method to click by id. not to be confused with data-testid or data-test-id
   * @param value id attribute of an element
   */
  async clickById(value: string) {
    await this.page.click(`[id="${value}"]`);
  }

  /**
   * Convenience method to click by data-test-id
   * @param value test ids added specifically for testing
   */
  async clickByTestId(value: string) {
    await this.page.click(`[data-test-id="${value}"]`);
  }

  async clickCheckBox(index: number) {
    await this.page
      .locator('input[type="checkbox"]')
      .nth(index)
      .click();
  }

  /**
   * Convenince method to click by name
   * @param value name attribute of the element
   */
  async clickByName(value: string) {
    await this.page.click(`[name="${value}"]`);
  }

  async clickByTypeName(type: string, name: string) {
    await this.page.click(`${type}[name="${name}"]`);
  }

  async clickByTypeAndLabel(type: string, label: string) {
    await this.page.click(`${type}[label="${label}"]`);
  }

  async fillByPlaceHolder(placeholder: string, value: string) {
    await this.page.fill(`[placeholder="${placeholder}"]`, value);
  }

  async fillById(id: string, value: string) {
    await this.page.fill(`[id="${id}"]`, value);
  }

  async fillByName(name: string, value: string) {
    await this.page.fill(`[name="${name}"]`, value);
  }
  async fillByTypeAndName(type: string, name: string, value: string) {
    await this.page.fill(`${type}[name="${name}"]`, value);
  }
  async fillByTypeAndLabel(type: string, name: string, value: string) {
    await this.page.fill(`${type}[label="${name}"]`, value);
  }
  async fillTestId(testId: string, value: string) {
    await this.page.fill(`[data-test-id="${testId}"]`, value);
  }
  async fillByText(text: string, value: string) {
    await this.page.fill(`text=${text}`, value);
  }

  async findElement(selector: string) {
    return this.page.locator(`${selector}`);
  }
  async findByLabel(label: string) {
    return this.page.locator(`[label="${label}"]`);
  }
  async findByTypeAndLabel(type: string, label: string) {
    return this.page.locator(`${type}[label="${label}"]`);
  }
  async findByTypeAndName(type: string, name: string) {
    return this.page.locator(`${type}[label="${name}"]`);
  }

  async findByName(name: string) {
    return this.page.locator(`[name="${name}"]`);
  }
  async findByDataName(name: string) {
    return this.page.locator(`[data-name="${name}"]`);
  }

  async findByText(text: string) {
    return this.page.locator(`text="${text}"`);
  }
  async findLinkByText(text: string) {
    return this.page.locator(`a:has-text("${text}")`);
  }
  async findById(id: string) {
    return this.page.locator(`[id="${id}"]`);
  }
  async findByTestId(testId: string) {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  async findClassName(className: string) {
    return this.page.locator(`css = ${className}`);
  }

  async findByPlaceHolder(placeholder: string) {
    return this.page.locator(`[placeholder="${placeholder}"]`);
  }

  async findByInputName(name: string) {
    return this.page.locator(`input[name="${name}"]`);
  }

  async waitForSelector(selector: string, waitTime = 120000) {
    return this.page.waitForSelector(selector, { timeout: waitTime });
  }

  async waitForTimeout(timeout: number) {
    return this.page.waitForTimeout(timeout);
  }

  async selectFile(filePath: string) {
    this.page.setInputFiles("input[type='file']", path.resolve(filePath));
    await this.page.waitForTimeout(3000);
  }

  async queryElement(selector: string) {
    return this.page.$(selector);
  }
  /**
   * Convenience method for this.page.keyboard.type.  Note that this requires
   * an already focused input to type into.  Normally via click or focus.
   * @param value The text to type on the keyboard
   */
  async typeText(value: string) {
    await this.page.keyboard.type(value);
  }
}
