import { expect } from "@playwright/test";
import { PageObject } from "./page-object";

export class ArticlesPage extends PageObject {

  public async validateUrlIncludesLinkText(linkText: string) {
      expect(this.page.url().includes(linkText)).toBeTruthy();
  }
}