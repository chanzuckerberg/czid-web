import { PageObject } from "./page-object";

const LOGIN_EMAIL_INPUT = "input[id='login']";
const LOGIN_PASSWORD_INPUT = "input[name='password']";
const SIGNIN_BUTTON_INPUT = "input[value='Sign In']";
const CLOSE_WINDOW_BUTTON = "//button[text()='Close Window']";

const CONNECTED =
  "You've successfully authorized CZ ID to connect to Basespace!";

export class IlluminaPage extends PageObject {
  public async fillLoginEmail(value: string) {
    await this.page.locator(LOGIN_EMAIL_INPUT).fill(value);
  }

  public async fillLoginPassword(value: string) {
    await this.page.locator(LOGIN_PASSWORD_INPUT).fill(value);
  }

  public async clickSigninButton() {
    await this.page.locator(SIGNIN_BUTTON_INPUT).click();
  }

  public async clickCloseWindowButton() {
    await this.page
      .locator(CLOSE_WINDOW_BUTTON)
      .click()
      .catch(error => {
        if (!error.message.includes("Target closed")) {
          throw error;
        }
      });
  }

  public async isAuthorized() {
    let connected: any;
    connected = await this.page
      .getByText(CONNECTED)
      .waitFor({ timeout: 10_000 })
      .catch(() => false);
    if (connected !== false) {
      connected = await this.page.getByText(CONNECTED).isVisible();
    }
    return connected;
  }

  public async authorize() {
    await this.fillLoginEmail(process.env.BASESPACE_USERNAME);
    await this.fillLoginPassword(process.env.BASESPACE_PASSWORD);
    await this.clickSigninButton();
    await this.clickCloseWindowButton();
  }
}
