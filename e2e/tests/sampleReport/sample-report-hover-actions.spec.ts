import { test, expect } from "@playwright/test";
import { stubRequest } from "../../utils/api";
import { chooseBackgroundModel } from "../../utils/report";
const sampleId = 25745;

const createConsensusGenomeApi = `/samples/${sampleId}/kickoff_workflow`;
const successResponse = [{
    id: 1,
    workflow: "consensus-genome",
    status: "RUNNING",
    executed_at: "2021-08-05T18:00:00.000Z",
  }];
const createConsensusGenomeModal = "create-consensus-genome-modal";

test.describe("Hover Actions on Sample Report", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);
    await chooseBackgroundModel(page);

    // expand taxon parent
    await page.getByTestId("expand-taxon-parent").first().click();
    expect(page.getByText("Rhinovirus C")).toBeVisible();

    // expand taxon parent all
    await page.getByTestId("expand-taxon-parent-all").click();
    expect(page.getByText("Human immunodeficiency virus 1")).toBeVisible();
    expect(page.getByText("Chikungunya virus")).toBeVisible();
  });

  test("Should verify Create CG modal flow on click of hover action", async ({ page }) => {
    // hover on taxon name
    await page.getByText("Rhinovirus C").hover();

    // click on that taxon's CG icon
    await page.getByTestId("hover-action-consensus-genome-463676").click();
    expect(page.getByTestId(createConsensusGenomeModal)).toBeVisible();

    const createButton = page.getByText("Create Consensus Genome");

    // create button should be disabled when no accession is selected
    await createButton.hover({ force: true });
    await expect(createButton).toBeDisabled();

    // choose accession
    await page.getByText("Select a reference accession").click();
    await page.getByTestId("dropdown-rhinovirus-c-isolate-co-03302015-polyprotein-m-rna-complete-cds").click();
    await expect(createButton).toBeEnabled();

    // Stub out the API response so we don't actually create a new CG run
    await stubRequest(page, createConsensusGenomeApi, 200, successResponse);

    // click on create button
    await createButton.click();

    // the modal should close and a toast should appear
    expect(page.getByTestId(createConsensusGenomeModal)).not.toBeVisible();
    // the toast should have a link to the CG tab
    expect(page.getByText("View Consensus Genome")).toBeVisible();
  });

  test("Should verify Previous CG modal flow on click of hover action", async ({ page }) => {
    // expand taxon parent
    await page.getByTestId("expand-taxon-parent").nth(2).click();
    // hover on taxon name
    await page.getByText("Human immunodeficiency virus 1").hover();

    // click on that taxon's CG icon
    await page.getByTestId("hover-action-consensus-genome-11676").click();
    expect(page.getByTestId("previous-consensus-genome-modal")).toBeVisible();

    // from Previous CG modal, click on Create new CG to open create new CG modal
    await page.getByText("Create a New Consensus Genome").click();
    expect(page.getByTestId(createConsensusGenomeModal)).toBeVisible();

    // from Create new CG modal, click on x to close the modal
    await page
      .getByTestId(createConsensusGenomeModal)
      .getByTestId("modal-close-icon")
      .click();

    // from Previous CG modal, click on CG to take you to that CG tab
    await page.getByText("L31963.1 - Human immunodeficiency virus type 1 (individual isolate: TH4-7-5) gene").click();
    expect(page.getByText("Is my consensus genome complete?"));
  });
});
