import { PageObject } from "./page-object";

const HEADER_LOGIN = "[data-testid='home-top-nav-login']";
const INTRO_TEXT = "[class*='introTextWrap']";
const MAP_CONTAINER = "[class*='mapContainer']";
const COUNTRY_SHOWCASE_ITEM_NAMES = "[class*='countryShowcaseContainer'] [class*='countryScrollItem-'] h3";
const COUNTRY_SHOWCASE_TITLE = "[class*='countryShowcaseWindowProjectTitle']";
const COUNTRY_SHOWCASE_DESCRIPTION = "[class*='countryShowcaseWindowDescriptionContainer']";

export class ImpactPage extends PageObject {

    public async navigateToPage(timeout = 30_000) {
      await this.page.goto(`${process.env.BASEURL}/impact`, {timeout: timeout})
    }

    public async isIntroTextVisible() {
      await this.page.locator(INTRO_TEXT).waitFor({state: "visible"}).catch(() => null);
      return this.page.locator(INTRO_TEXT).isVisible();
    }

    public async isHeaderLoginVisible() {
      return this.page.locator(HEADER_LOGIN).isVisible();
    }

    public async isMapContainerVisible() {
      return this.page.locator(MAP_CONTAINER).isVisible();
    }

    public async isCountryShowcaseTitleVisible() {
      return this.page.locator(COUNTRY_SHOWCASE_TITLE).isVisible();
    }

    public async isCountryShowcaseDescriptionVisible() {
      return this.page.locator(COUNTRY_SHOWCASE_DESCRIPTION).isVisible();
    }

    public async getCountryShowcaseItemNames() {
      this.page.locator(COUNTRY_SHOWCASE_ITEM_NAMES).first().waitFor();
      return this.page.locator(COUNTRY_SHOWCASE_ITEM_NAMES).allTextContents();
    }
}