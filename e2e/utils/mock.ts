import path from "path";
import { BrowserContext, expect, Page } from "@playwright/test";
import dotenv from "dotenv";
import { getFixture } from "./common";
import { API } from "./constants";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const baseUrl = process.env.BASEURL as string;
/**
 * This function intercepts the response for a API call and stub it with mocked data
 * It helps testing functionalities listing listing and filtering, where we need to know the
 * data so we can validate
 * @param api the endpoint to be intercepted
 * @param url the page url that triggers the API call
 * @param mockData data for stubbing response
 * @param page the page object which makes the API and displays the response
 * @param context PW browser context, used for intercepting the route
 * @param elementToCheckOnThePage - optionally, we can verify that the expected data is displayed
 */
export async function mockResponse(
  page: Page,
  context: BrowserContext,
  elementToCheckOnThePage?: string
) {
  const workflowData = getFixture("workflows");
  const projectData = getFixture("projects");
  const locationData = getFixture("sampleLocations");
  const projectApi = `${baseUrl}/${API.PROJECT}`;
  const workflowApi = `${baseUrl}/${API.WORKFLOW}`;
  const locationApi = `${baseUrl}/${API.SAMPLE_LOCATION}`;
  const projectUrl = `${baseUrl}/public`;

  await Promise.all([
    await context.route(locationApi, async (route) => {
      const response = await context.request.get(locationApi);
      expect(response.ok()).toBeTruthy();
      route.fulfill({
        response,
        body: JSON.stringify(locationData),
      });
    }),
    await context.route(workflowApi, async (route) => {
      const response = await context.request.get(workflowApi);
      expect(response.ok()).toBeTruthy();
      route.fulfill({
        response,
        body: JSON.stringify(workflowData),
      });
    }),
    await context.route(projectApi, async (route) => {
      const response = await context.request.get(projectApi);
      expect(response.ok()).toBeTruthy();
      route.fulfill({
        response,
        body: JSON.stringify(projectData),
      });
    }),
    page.waitForResponse(
      (resp) =>
        resp.url().includes(`${API.SAMPLE_LOCATION}`) && resp.status() === 200
    ),
    page.waitForResponse(
      (resp) => resp.url().includes(`${API.PROJECT}`) && resp.status() === 200
    ),
    page.waitForResponse(
      (resp) => resp.url().includes(`${API.WORKFLOW}`) && resp.status() === 200
    ),

    await page.goto(projectUrl),
  ]);

  if (elementToCheckOnThePage !== undefined) {
    await page.waitForSelector(elementToCheckOnThePage, {
      timeout: 300000,
    });
  }
}
