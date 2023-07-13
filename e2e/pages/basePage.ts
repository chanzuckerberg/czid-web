import * as path from "path";
import { Page } from "@playwright/test";
/**
 * Base class with convenience wrappers for interactions
 * with page elements
 */
export class BasePage {
  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly page: Page) {}

  async gotoUrl(url: string) {
    try {
      await this.page.goto(url);
    } catch (error) {
      // console.log
    }
  }

  async clickByTypeName(type: string, name: string) {
    await this.page.click(`${type}[name="${name}"]`);
  }

  async clickByTypeAndLabel(type: string, label: string) {
    await this.page.click(`${type}[label="${label}"]`);
  }

  async typeByPlaceHolder(placeholder: string, value: string) {
    await this.page.type(`[placeholder="${placeholder}"]`, value, {
      delay: 1000,
    });
  }
  async fillById(id: string, value: string) {
    await this.page.fill(`[id="${id}"]`, value);
  }
  async fillByTestId(id: string, value: string) {
    await this.page.fill(`[data-testid="${id}"]`, value);
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
    await this.page.fill(`[data-testid="${testId}"]`, value);
  }
  async fillByText(text: string, value: string) {
    await this.page.fill(`text=${text}`, value);
  }
  async findByClassName(className: string) {
    return this.page.locator(`[class="${className}"]`);
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

  async findByLocator(name: string, i: number) {
    return this.page.locator(name).nth(i);
  }
  async findBySelector(name: string) {
    return this.page.locator(name);
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
    await this.page.waitForSelector(selector, { timeout: waitTime });
  }

  async waitForTimeout(timeout: number) {
    await this.page.waitForTimeout(timeout);
  }

  async selectFile(filePath: string) {
    this.page.setInputFiles("input[type='file']", path.resolve(filePath));
  }

  async queryElement(selector: string) {
    return this.page.$(selector);
  }

  async waitForResponse(path: string) {
    const resp = await this.page.waitForResponse(
      response =>
        response.url().includes(`/${path}/`) && response.status() === 200,
    );
    return resp.json();
  }
  async findByTextRole(name: string) {
    return this.page.getByRole("textbox", { name: name });
  }
  async findByComboBoxRole() {
    return this.page.getByRole("combobox");
  }
  async findByCheckboxRole(name: string) {
    return this.page.getByRole("checkbox", { name: name });
  }

  async takeScreenshot(path: string) {
    this.page.screenshot({ path: path });
  }

  async pause() {
    return this.page.pause();
  }
  async waitForDomContent() {
    await this.page.waitForLoadState("domcontentloaded");
  }
  async waitForNetwrokIdle() {
    await this.page.waitForLoadState("networkidle");
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
