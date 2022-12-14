import { test } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { mockResponse } from "../utils/mock";
import { Project } from "../types/project";
import { generateProjectData } from "../utils/project";
import { getRandomNumber } from "../utils/common";
import { Workflow } from "../types/workflow";
import { generateWorkflowData } from "../utils/workflow";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const baseUrl = process.env.BASEURL as string;
const projectApi = `${baseUrl}/projects.json?domain=my_data&limit=50&listAllIds=true&offset=0`;
const sampleApi = `${baseUrl}/workflow_runs.json?projectId=869&domain=my_data&listAllIds=true&mode=with_sample_info&limit=50&offset=0&workflow=amr`;
const projectUrl = `${baseUrl}/my_data`;
const sampleUrl = `${baseUrl}/my_data?currentDisplay=table&currentTab=samples&mapSidebarTab=samples&projectId=869&showFilters=true&workflow=amr`;

const MIN = 3;
const MAX = 5;

test.describe("Project discovery page tests", () => {
  test("Should display projects", async ({ page, context }) => {
    const numberOfProjects = Math.floor(Math.random() * MAX + MIN);
    let projects = Array<Project>();
    let projectIds = Array<number>();
    for (let i = 0; i < numberOfProjects; i++) {
      const projectName = "QA-" + getRandomNumber(10000, 99999);
      const project = generateProjectData(projectName);
      projects.push(project);
      projectIds.push(project.id);
    }
    const projectMockData = {
      projects: projects,
      all_projects_ids: projectIds
    };
    await page.goto(baseUrl);
    //intercept request and stub response
    await mockResponse(projectApi, projectUrl, projectMockData, page, context);
  });

  test("Should display workflows", async ({ page, context }) => {
    const numberOfWorkflows = Math.floor(Math.random() * MAX + MIN);
    let workflows = Array<Workflow>();
    let workflowIds = Array<number>();
    for (let i = 0; i < numberOfWorkflows; i++) {
      const sampleName = `RR004_water_2_S23A_${i}`;
      const workflow = generateWorkflowData("amr", 869, sampleName);
      workflows.push(workflow);
      workflowIds.push(workflow.id);
    }
    const workflowMockData = {
      workflow_runs: workflows,
      all_workflow_run_ids: workflowIds
    };
    await page.goto(baseUrl);
    //intercept request and stub response
    await mockResponse(sampleApi, sampleUrl, workflowMockData, page, context);
  });
});
