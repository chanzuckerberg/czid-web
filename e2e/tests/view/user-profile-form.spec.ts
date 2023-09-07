import path from "path";
import { expect, Page, test } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const COMPLETE_SETUP_BTN = "complete-setup-btn";
const MAX_USERNAME_LENGTH = 128; // 127 characters for First and Last Name + 1 space

test.describe("User Profile Form tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/user_profile_form`);

    // Complete Setup button should be disabled
    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeDisabled();
  });

  const data = {
    firstName: "First",
    lastName: "Last",
    country: "United States",
    institution: "Chan Zuckerberg Initiative (United States)",
  };

  // Full Name text field
  async function completeFullName(
    page: Page,
    firstName: string,
    lastName: string,
  ) {
    await page.getByPlaceholder("First Name").fill(firstName);
    await page.getByPlaceholder("Last Name").fill(lastName);
  }

  // Country dropdown
  async function selectCountry(page: Page) {
    const countryDropdown = await page.getByPlaceholder("Choose Country");
    await countryDropdown.click();
    const country = data.country.substring(0, 6);
    await countryDropdown.fill(country);
    while (!((await countryDropdown.getAttribute("value")) === country)) {
      await countryDropdown.fill(country);
    }
    await page.getByText(data.country).click(); // Select country from autocomplete dropdown menu
  }

  // Institution dropdown
  async function selectInstitution(page: Page) {
    const institutionDropdown = await page.getByPlaceholder("Institution Name");
    await institutionDropdown.click();
    await institutionDropdown.fill(data.institution.substring(0, 4)); // Type "Chan"
    await page.getByText(data.institution).click(); // Select institution from autocomplete dropdown menu
  }

  // Usecase multi-select (select up to 3)
  async function selectUseCases(page: Page) {
    const checkboxes = await page.getByTestId("czid-usecase-checkbox");
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();
  }

  // Sequencing Expertise single-select
  async function selectExpertise(page: Page) {
    const radioButtons = await page.getByTestId("expertise-option");
    await radioButtons.nth(0).click();
  }

  test("Should enable submit button if required questions are complete", async ({
    page,
  }) => {
    // Complete required questions
    await completeFullName(page, data.firstName, data.lastName);
    await selectCountry(page);
    await selectInstitution(page);
    await selectUseCases(page);
    await selectExpertise(page);

    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeEnabled();
  });

  test("Should disable submit button if name is missing", async ({ page }) => {
    // Complete all required questions except Full Name
    await selectCountry(page);
    await selectInstitution(page);
    await selectUseCases(page);
    await selectExpertise(page);

    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeDisabled();

    // Spaces-only inputs are considered incomplete
    await completeFullName(page, " ", data.lastName);
    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeDisabled();

    await completeFullName(page, data.firstName, " ");
    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeDisabled();
  });

  test("Should disable submit button if name contains invalid characters", async ({
    page,
  }) => {
    // Complete all required questions except Full Name
    await selectCountry(page);
    await selectInstitution(page);
    await selectUseCases(page);
    await selectExpertise(page);

    // Only letters, apostrophes, dashes, and spaces are allowed characters
    await completeFullName(page, "First M.", "Last");

    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeDisabled();
  });

  test("Should disable submit button if name exceeds character limit", async ({
    page,
  }) => {
    // Complete all required questions except Full Name
    await selectCountry(page);
    await selectInstitution(page);
    await selectUseCases(page);
    await selectExpertise(page);

    // Full Name should not exceed max character limit
    await completeFullName(page, "X".repeat(MAX_USERNAME_LENGTH - 1), "Y"); // 129 characters
    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeDisabled();

    await completeFullName(page, "X".repeat(MAX_USERNAME_LENGTH - 2), "Y"); // 128 characters
    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeEnabled();
  });

  test("Should disable submit button if country is missing", async ({
    page,
  }) => {
    // Complete all required questions except Country
    await completeFullName(page, data.firstName, data.lastName);
    await selectInstitution(page);
    await selectUseCases(page);
    await selectExpertise(page);

    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeDisabled();
  });

  test("Should disable submit button if institution is missing", async ({
    page,
  }) => {
    // Complete all required questions except Institution
    await completeFullName(page, data.firstName, data.lastName);
    await selectCountry(page);
    await selectUseCases(page);
    await selectExpertise(page);

    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeDisabled();

    // Spaces-only inputs are considered incomplete
    await page.getByPlaceholder("Institution Name").fill(" ");

    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeDisabled();
  });

  test("Should disable submit button if use cases are missing", async ({
    page,
  }) => {
    // Complete all required questions except Use Cases
    await completeFullName(page, data.firstName, data.lastName);
    await selectCountry(page);
    await selectInstitution(page);
    await selectExpertise(page);

    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeDisabled();
  });

  test("Should disallow selecting more than 3 use cases", async ({ page }) => {
    const checkboxes = await page.locator(
      '[data-testid="czid-usecase-checkbox"] input',
    );
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();
    await checkboxes.nth(3).click();

    // First 3 checkboxes should be checked
    expect(await checkboxes.nth(0).isChecked()).toBeTruthy();
    expect(await checkboxes.nth(1).isChecked()).toBeTruthy();
    expect(await checkboxes.nth(2).isChecked()).toBeTruthy();

    // 4th checkbox should not be checked
    expect(await checkboxes.nth(3).isChecked()).toBeFalsy();
  });

  test("Should disable submit button if expertise is missing", async ({
    page,
  }) => {
    // Complete all required questions except Expertise
    await completeFullName(page, data.firstName, data.lastName);
    await selectCountry(page);
    await selectInstitution(page);
    await selectUseCases(page);

    await expect(page.getByTestId(COMPLETE_SETUP_BTN)).toBeDisabled();
  });
});
