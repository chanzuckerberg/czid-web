import { expect, Page, BrowserContext } from "@playwright/test";

export async function makeApiCall(
  _: string,
  endpoint: string,
  __: Page,
  context: BrowserContext,
) {
  // const json = "";
  let response;
  // create an intercept
  await context.route(endpoint, async () => {
    response = await context.request.get(endpoint);
    expect(response.ok()).toBeTruthy(); // check we get response 200
    // json = await response();
  });
  // make the actual call, wait until all responses have been received
  // await page.goto(url, { waitUntil: "networkidle" });
  return response;
}

export async function stubRequest(
  page: Page,
  api: string,
  statusCode: number,
  response: object,
): Promise<void> {
  await page.route(api, async route => {
    route.fulfill({
      status: statusCode,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}
