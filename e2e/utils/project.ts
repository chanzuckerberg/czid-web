import { Page } from "@playwright/test";
import { sample } from "lodash";
import { Project } from "../types/project";
import { getFixture, getRandomNumber } from "./common";
import { getByPlaceholder } from "./selectors";

const trueOrFalse = [true, false];
const zeroOrOne = [0, 1];
const metadataFixture = getFixture("metadata");
/**
 * Function generates data for mocking project response data
 * @param projectName
 * @returns Project object that will be passed to the mock service
 */
export function generateProjectData(projectName: string): Project {
  const today = new Date();
  const min = 1;
  const max = 5;
  const d = today;
  const randomNumber = getRandomNumber(min, max);
  d.setFullYear(d.getFullYear() - randomNumber);
  const hosts = Array<string>();
  for (let i = 1; i < randomNumber; i++) {
    hosts.push(sample(metadataFixture["Host Organism"]));
  }
  return {
    id: getRandomNumber(100, 999),
    name: projectName,
    description: "QA automation",
    created_at: d.toISOString(),
    public_access: sample(zeroOrOne) as number,
    hosts: hosts,
    locations: ["London", "Yew York"],
    editable: sample(trueOrFalse) as boolean,
    users: [
      {
        name: "CZID Test Account",
        email: "czid-e2e@chanzuckerberg.com",
      },
    ],
    creator: "CZID Test Account",
    creator_id: getRandomNumber(0, 10),
    owner: "CZID Test Account",
    tissues: ["Mixed Tissue"],
    sample_counts: {
      number_of_samples: getRandomNumber(0, 10),
      mngs_runs_count: getRandomNumber(0, 10),
      cg_runs_count: getRandomNumber(0, 10),
    },
  } as Project;
}

/**
 * Helper function to search and display project samples
 * @param page
 * @param projectName
 */
export async function goToProjectSamples(
  page: Page,
  projectName: string,
  workflowIndex: number,
  myData = false,
) {
  const dataType = myData ? "my_data" : "public";
  const placeholderText = myData ? "Search My Data..." : "Search Public...";
  await page.goto(`${process.env.BASEURL}/${dataType}`);
  await page.waitForTimeout(2000);
  await page.locator(getByPlaceholder(placeholderText)).fill(projectName);
  await page.keyboard.press("Enter");
  await page
    .getByText(projectName)
    .nth(0)
    .click();

  // select workflow type
  await page
    .locator(".tabLabel-3vqpD")
    .nth(workflowIndex)
    .click();
}
