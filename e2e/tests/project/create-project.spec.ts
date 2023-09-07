import { QA_TEST_PROJECTS } from "@e2e/constants/common";
import {
  HELP_CENTER_PROJECT_URL,
  PROJECT_NAME_NOT_AVAILABLE_ERROR,
} from "@e2e/constants/upload";
import { stubRequest } from "@e2e/utils/api";
import { expect, test } from "@playwright/test";

const baseUrl = process.env.BASEURL;
const projectApi = "projects.json";
const CREATE_PROJECT_BTN = "create-project-btn";
const UI_INPUT = ".idseq-ui input[type='text']";
const PUBLIC_PROJECT = "public-project";
const PROJECT_DESCRIPTION = "project-description";

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

const ENV = `${process.env.NODE_ENV}`;
const EXISTING_PROJECT = QA_TEST_PROJECTS[ENV.toUpperCase()];
test.describe("Sample project tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/samples/upload`);
    await page.getByTestId("create-project").click();
    // Create Project modal should be visible
    await expect(page.getByText("New Project")).toBeVisible();
  });

  test("Should create new project", async ({ page }) => {
    const projectName = "Test project " + new Date().getTime();
    const data = {
      id: 934,
      name: projectName,
      description: "This is the project description; up to 700 characters",
    };

    // Stub out the API response so we don't actually create a project in the DB
    const response = createResponse(data);

    // call our interceptor function
    await stubRequest(page, projectApi, 200, response);

    // Fill in project name
    await page.locator(UI_INPUT).fill(data.name);

    // Select public project
    await page.getByTestId(PUBLIC_PROJECT).click();

    // Fill in project description
    await page.getByTestId(PROJECT_DESCRIPTION).fill(data.description);

    await expect(page.getByTestId(CREATE_PROJECT_BTN)).toBeEnabled();

    // Submit
    await page.getByTestId(CREATE_PROJECT_BTN).click();

    await page.waitForTimeout(2000);

    // Modal should close and new project name should be visible in dropdown
    expect(await page.getByTestId("filter-value").textContent()).toContain(
      data.name,
    );
  });

  test("Should not create duplicate project", async ({ page }) => {
    // Fill in project name that already exists in test db

    await page.locator(UI_INPUT).fill(EXISTING_PROJECT);
    await page.getByTestId(PUBLIC_PROJECT).click();
    await page
      .getByTestId(PROJECT_DESCRIPTION)
      .fill("test project description");
    await page.getByTestId(CREATE_PROJECT_BTN).click();

    // Modal should display error that project name is not available
    await expect(
      page.getByText(PROJECT_NAME_NOT_AVAILABLE_ERROR),
    ).toBeVisible();
  });

  test("Should enforce mandatory fields", async ({ page }) => {
    await page.locator(UI_INPUT).fill(`Test project`);
    await expect(page.getByTestId(CREATE_PROJECT_BTN)).toBeDisabled();
    await page.getByTestId(PUBLIC_PROJECT).click();
    await expect(page.getByTestId(CREATE_PROJECT_BTN)).toBeDisabled();
    await page
      .getByTestId(PROJECT_DESCRIPTION)
      .fill("test project description");

    // Create project button is only enabled after all fields are filled out
    await expect(page.getByTestId(CREATE_PROJECT_BTN)).toBeEnabled();
  });

  test("Should close modal window", async ({ page }) => {
    await page.getByTestId("cancel-btn").click();
    // Modal should no longer be visible
    await expect(page.getByText("New Project")).toHaveCount(0);
  });

  // todo: there is a conditional popup that blocks; need a way to prevent this via cookies
  test("Should redirect to Help Center", async ({ page, context }) => {
    // Clicking Learn more opens a new tab, so get the new page
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      page.locator("a").getByText("Learn more").first().click(),
    ]);
    // New page should be help center
    expect(newPage.url()).toContain(HELP_CENTER_PROJECT_URL);
  });

  // todo: needs testid to propagate to staging for test to work in staging
  test("Should toggle visibility of project guidelines", async ({ page }) => {
    await page.getByTestId("more-less-info-btn").click();
    await expect(page.getByTestId("project-description-info")).toBeVisible();
    await page.getByTestId("more-less-info-btn").click();
    await expect(page.getByTestId("project-description-info")).toHaveCount(0);
  });
});
