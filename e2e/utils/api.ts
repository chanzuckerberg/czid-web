import { expect, Page, BrowserContext } from "@playwright/test";

export async function makeApiCall(
  url: string,
  endpoint: string,
  page: Page,
  context: BrowserContext
) {
  let json = "";
  let response;
  //create an intercept
  await context.route(endpoint, async (route) => {
    response = await context.request.get(endpoint);
    expect(response.ok()).toBeTruthy(); //check we get response 200
    //json = await response();
  });
  // make the actual call, wait until all responses have been received
  //await page.goto(url, { waitUntil: "networkidle" });
  return response;
}
