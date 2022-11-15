import { BrowserContext, expect, Page } from "@playwright/test";

/**
 * This function intercepts the response for a API call and stub it with mocked data
 * It helps testing functionalities listing listinf and filtering, where we need to know the
 * data so we can validate
 * @param api the endpoing to be intercepted
 * @param url the page url that triggers the API call
 * @param mockData data for stubbing response
 * @param page the page object which makes the API and displays the response
 * @param context PW browser context, used for intercepting the route
 * @param elementToCheckOnThePage - optionally, we can verify that the expected data is displayed
 */
export async function mockResponse(
  api: string,
  url: string,
  mockData: any,
  page: Page,
  context: BrowserContext,
  elementToCheckOnThePage?: string,
) {
  //create an intercept to stub response with mock data once we get response with status 200
  await context.route(api, async route => {
    const response = await context.request.get(api);
    //check we get response 200, but we could also abort the call (route.abort() : route.continue();)
    expect(response.ok()).toBeTruthy();
    //retain original response but replace body part with stubbed data we created
    route.fulfill({
      response,
      body: JSON.stringify(mockData),
    });
  });
  // make the actual call, wait until all responses have been received
  await page.goto(url, { waitUntil: "networkidle" });

  if (elementToCheckOnThePage !== undefined) {
    await page.waitForSelector(elementToCheckOnThePage, {
      timeout: 300000,
    });
  }
}
