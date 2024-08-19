import { ImpactPage } from "@e2e/page-objects/impact-page";
import { test, expect } from "@playwright/test";


/*
 * Smoke Test: Impact
 *
 * The test should ensure that the elements 
 * on the page render properly
 */
test.describe("Smoke Test: impact page", () => {

  test("Ensure the elements on the page render properly", async ({ page }) => {
    const impactPage = new ImpactPage(page);

    // #region Navigate to the Impact page
    await impactPage.navigateToPage();
    // #endregion Navigate to the Impact page

    // #region Validate the intro text and map container elements are visible
    expect(impactPage.isIntroTextVisible()).toBeTruthy();
    expect(impactPage.isMapContainerVisible()).toBeTruthy();
    // #endregion Validate the intro text and map container elements are visible

    // #region Validate the Country Showcase elements are visible
    expect(impactPage.getCountryShowcaseItemNames()).not.toEqual([]);
    expect(impactPage.isCountryShowcaseTitleVisible()).toBeTruthy();
    expect(impactPage.isCountryShowcaseDescriptionVisible()).toBeTruthy();
    // #endregion Validate the Country Showcase elements are visible

    // #region Validate the header login element is visible
    await impactPage.isHeaderLoginVisible();
    // #endregion Validate the header login element is visible
  });

});