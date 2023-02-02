import path from "path";
import { test } from "@playwright/test";
import dotenv from "dotenv";
import { Project } from "../types/project";
import { Workflow } from "../types/workflow";
import { getRandomNumber } from "../utils/common";
import { mockResponse } from "../utils/mock";
import { generateProjectData } from "../utils/project";
import { generateWorkflowData } from "../utils/workflow";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const baseUrl = process.env.BASEURL as string;

const MIN = 3;
const MAX = 5;

test.describe("Project discovery page tests", () => {
  test("Should display projects", async ({ page, context }) => {
    const numberOfProjects = Math.floor(Math.random() * MAX + MIN);
    const projects = Array<Project>();
    const projectIds = Array<number>();
    for (let i = 0; i < numberOfProjects; i++) {
      const projectName = "QA-" + getRandomNumber(10000, 99999);
      const project = generateProjectData(projectName);
      projects.push(project);
      projectIds.push(project.id);
    }
    const projectMockData = {
      projects: projects,
      all_projects_ids: projectIds,
    };
    await page.goto(baseUrl);
    // intercept request and stub response
    await mockResponse(page, context);
  });

  test("Should display workflows", async ({ page, context }) => {
    const numberOfWorkflows = Math.floor(Math.random() * MAX + MIN);
    const workflows = Array<Workflow>();
    const workflowIds = Array<number>();
    for (let i = 0; i < numberOfWorkflows; i++) {
      const sampleName = `RR004_water_2_S23A_${i}`;
      const workflow = generateWorkflowData("amr", 869, sampleName);
      workflows.push(workflow);
      workflowIds.push(workflow.id);
    }
    const workflowMockData = {
      workflow_runs: workflows,
      all_workflow_run_ids: workflowIds,
    };
    await page.goto(baseUrl);
    // intercept request and stub response
    await mockResponse(page, context);
  });
});
