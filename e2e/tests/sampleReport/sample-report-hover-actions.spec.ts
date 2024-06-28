import { SEARCH_BAR } from "@e2e/constants/sample";
import { stubRequest } from "@e2e/utils/api";
import { acceptCookies } from "@e2e/utils/page";
import { chooseBackgroundModel } from "@e2e/utils/report";
import { expect, test } from "@playwright/test";

const sampleId = 25745;

const createConsensusGenomeApi = `/samples/${sampleId}/kickoff_workflow`;
const successResponse = [
  {
    id: 1,
    workflow: "consensus-genome",
    status: "RUNNING",
    executed_at: "2021-08-05T18:00:00.000Z",
  },
];
const createConsensusGenomeModal = "create-consensus-genome-modal";

test.describe("Report hover action tests", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);

    await acceptCookies(page);
    await chooseBackgroundModel(page);

    // expand taxon parent
    await page.getByTestId("expand-taxon-parent").first().click();
    expect(page.getByText("Rhinovirus C")).toBeVisible();

    // expand taxon parent all
    await page.getByTestId("expand-taxon-parent-all").click();
    expect(page.getByText("Human immunodeficiency virus 1")).toBeVisible();
    expect(page.getByText("Chikungunya virus")).toBeVisible();
  });

  test("Should verify Create CG modal flow on click of hover action", async ({
    page,
  }) => {
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
    await page
      .getByTestId(
        "dropdown-rhinovirus-c-isolate-co-03302015-polyprotein-m-rna-complete-cds",
      )
      .click();
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

  test("Should verify Previous CG modal flow on click of hover action", async ({
    page,
  }) => {
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
    await page
      .getByText(
        "L31963.1 - Human immunodeficiency virus type 1 (individual isolate: TH4-7-5) gene",
      )
      .click();
    expect(page.getByText("Is my consensus genome complete?"));
  });
});

test.describe("Report blast hover action tests", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);
    await acceptCookies(page);
  });

  test.skip("Should verify BlastN modal flow on click of hover action", async ({
    page,
    context,
  }) => {
    // hover on taxon name
    await page.locator('[class*="taxonName"]').getByText("Klebsiella").click();
    await acceptCookies(page);
    // click on that taxon's Blast icon
    await page.getByTestId("hover-action-blast-570-v-1").click();
    // expect(page.getByTestId("blast-selection-modal")).toBeVisible();

      // for the BlastN flow
      await page.getByText("blastn", { exact: true }).click();
      await page.getByText("Continue").click();

      // select contig
      await page.getByText("NODE_25_length_597_cov_0.916974").click();
      await page.getByText("Continue").click();

      // expect(page.getByTestId("blast-redirection-modal")).toBeVisible();

      const pagePromise = context.waitForEvent("page");
      await page.getByText("Continue", { exact: true }).nth(1).click();
      const newPage = await pagePromise;
      await newPage.waitForLoadState();
      expect(await newPage.url()).toContain("https://blast.ncbi.nlm.nih.gov/");
      await newPage.close();

      // toast is visible
      expect(page.getByRole("alert"));
    },
  );

  test.skip("Should verify BlastX modal flow on click of hover action", async ({
    page,
    context,
  }) => {
    // hover on taxon name
    await page.locator('[class*="taxonName"]').getByText("Klebsiella").click();
    // click on that taxon's Blast icon
    await page.getByTestId("hover-action-blast-570-v-1").click();
    // expect(page.getByTestId("blast-selection-modal")).toBeVisible();

      // for the BlastX flow
      await page.getByText("blastx", { exact: true }).click();
      await page.getByText("Continue").click();

      // select continue
      await page.getByText("NODE_25_length_597_cov_0.916974").click();
      await page.getByText("NR Hits").click();
      await page.getByText("NODE_35_length_534_cov_1.135699").click();
      await page.getByText("Continue").click();

      // expect(page.getByTestId("blast-redirection-modal")).toBeVisible();

      // Start waiting for new page before clicking.
      const pagePromise = context.waitForEvent("page");
      await page.getByText("Continue", { exact: true }).nth(1).click();
      const newPage = await pagePromise;
      await newPage.waitForLoadState();
      expect(newPage.url()).toContain("https://blast.ncbi.nlm.nih.gov/");
      await newPage.close();

      // toast is visible
      expect(page.getByText("Dismiss")).toBeVisible();
    },
  );

  test.fixme(
    "BlastN is disabled and 5 reads have been selected",
    async ({ page }) => {
      // search for Salmonella
      await page.locator(SEARCH_BAR).fill("Salmonella");
      await page.getByText("Salmonella (genus)").click();

      // hover and click on blast icon
      await page.getByText("Salmonella", { exact: true }).hover();
      await page.getByTestId("hover-action-blast-590-v-1").click();

      // verify blast selection modal functionality
      // expect(page.getByTestId("blast-selection-modal")).toBeVisible();
      await page.getByText("blastx", { exact: true }).click();
      await page.getByText("Continue").click();

      // verify contig selection modal functionality
      expect(page.getByText("NT hits", { exact: true })).toBeDisabled();
      expect(
        page.getByText("Up to 5 NR reads have been selected."),
      ).toBeVisible();
    },
  );
});
