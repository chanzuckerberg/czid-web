import { PageObject } from "./page-object";

const QUERY = "[class='hidden query']";
const GENBANK_ID = "[class='itemid']";
const GENBANK = "[class='genbank']";

export class NCBIPage extends PageObject {
  public async getQueryValues() {
    let queryValues = {};
    const queryValue = await this.page.locator(QUERY).nth(1).textContent();

    const regex = new RegExp(/\{.+\}/);
    const match = queryValue.match(regex);

    if (match.length) {
      queryValues = JSON.parse(match[0]);
    } else {
      const queryArray = queryValue.split(":");
      for (let i = 0; i < queryArray.length; i += 2) {
        queryValues[queryArray[i]] = queryArray[i + 1];
      }
    }
    return queryValues;
  }

  public async getGenbankID() {
    const genbankValue = await this.page.locator(GENBANK_ID).textContent();
    return genbankValue.replace("GenBank: ", "");
  }

  public async getGenbankText() {
    return this.page.locator(GENBANK).textContent();
  }
}
