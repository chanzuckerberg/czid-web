import { expect, test, Page } from "@playwright/test";

import {
  HELP_CENTER_PROJECT_URL,
  PROJECT_NAME_NOT_AVAILABLE_ERROR,
} from "../../constants/upload.const";
import { getByTestID, getByText } from "../../utils/selectors";

const baseUrl = process.env.BASEURL;
const projectApi = "projects.json";

type Project = {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  public_access?: number;
  url?: string;
};

// creates response for stubbing the request
function createResponse(project: Project) {
  const date =
    project.created_at !== undefined
      ? project.created_at
      : "2023-02-17T06:05:30.000-08:00";
  const access =
    project.public_access !== undefined ? project.public_access : 1;
  return {
    id: project.id,
    name: project.name,
    created_at: date,
    updated_at: date,
    description: project.description,
    public_access: access,
    url: `${baseUrl}/projects/${project.id}.json`,
  };
}

async function stubRequest(
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

test.describe("Create project test", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/samples/upload`);
    await page.locator(getByTestID("create-project")).click();
    // Create Project modal should be visible
    await expect(page.locator(getByText("New Project"))).toBeVisible();
    // Create Project button should be disabled
    await expect(
      page.locator(getByTestID("create-project-btn")),
    ).toBeDisabled();
  });

  test("Creating Project is successful for happy path", async ({ page }) => {
    const data = {
      id: 934,
      name: "Project 3",
      description: "This is the project description; up to 700 characters",
    };

    // Stub out the API response so we don't actually create a project in the DB
    const response = createResponse(data);

    // call our interceptor function
    await stubRequest(page, projectApi, 200, response);

    // Fill in project name
    await page.locator("input[type='text']").nth(1).fill(data.name);

    // Select public project
    await page.locator(getByTestID("public-project")).click();

    // Fill in project description
    await page
      .locator(getByTestID("project-description"))
      .fill(data.description);

    await expect(page.locator(getByTestID("create-project-btn"))).toBeEnabled();

    // Submit
    await page.locator(getByTestID("create-project-btn")).click();

    // Modal should close and new project name should be visible in dropdown
    await expect(page.locator(getByText(data.name))).toBeVisible();
  });

  test("Will not create project with a name that already exists", async ({
    page,
  }) => {
    // Fill in project name that already exists in test db
    await page.locator("input[type='text']").nth(1).fill(`Test project`);
    await page.locator(getByTestID("public-project")).click();
    await page
      .locator(getByTestID("project-description"))
      .fill("test project description");
    await page.locator(getByTestID("create-project-btn")).click();

    // Modal should display error that project name is not available
    await expect(
      page.locator(getByText(PROJECT_NAME_NOT_AVAILABLE_ERROR)),
    ).toBeVisible();
  });

  test("Create project button should be disabled if any of the fields are not filled in", async ({
    page,
  }) => {
    await page.locator("input[type='text']").nth(1).fill(`Test project`);
    await expect(
      page.locator(getByTestID("create-project-btn")),
    ).toBeDisabled();
    await page.locator(getByTestID("public-project")).click();
    await expect(
      page.locator(getByTestID("create-project-btn")),
    ).toBeDisabled();
    await page
      .locator(getByTestID("project-description"))
      .fill("test project description");

    // Create project button is only enabled after all fields are filled out
    await expect(page.locator(getByTestID("create-project-btn"))).toBeEnabled();
  });

  test("Clicking Cancel button closes modal", async ({ page }) => {
    await page.locator(getByTestID("cancel-btn")).click();
    // Modal should no longer be visible
    await expect(page.locator(getByText("New Project"))).toHaveCount(0);
  });

  // todo: there is a conditional popup that blocks; need a way to prevent this via cookies
  test.skip("Clicking Learn more button redirects to Help Center", async ({
    page,
    context,
  }) => {
    // Clicking Learn more opens a new tab, so get the new page
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      page.locator(getByText("Learn more")).first().click(),
    ]);
    // New page should be help center
    expect(newPage.url()).toContain(HELP_CENTER_PROJECT_URL);
  });

  // todo: needs testid to propagate to staging for test to work in staging
  test("Clicking more info and less info toggles visibility of project description guidelines", async ({
    page,
  }) => {
    await page.locator(getByTestID("more-less-info-btn")).click();
    await expect(
      page.locator(getByTestID("project-description-info")),
    ).toBeVisible();
    await page.locator(getByTestID("more-less-info-btn")).click();
    await expect(
      page.locator(getByTestID("project-description-info")),
    ).toHaveCount(0);
  });
});
