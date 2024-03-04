import { expect } from "@playwright/test";
import { PageObject } from "./page-object";

export class ArticlesPage extends PageObject {

  public async validateUrlIncludesLinkText(linkText: string) {
    const pageUrl = this.page.url();
    expect(pageUrl.includes(linkText)).toBeTruthy();
  }

}