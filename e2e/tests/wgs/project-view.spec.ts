import { WORKFLOWS } from "@e2e/constants/common";
import { SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2 } from "@e2e/constants/sample";
import { Graphqlfed } from "@e2e/page-objects/graphqlfed";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage } from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";
import { setupSamples } from "../../page-objects/user-actions";

const WGS_SARS_COV2_NO_HOST_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const SARS_CoV2_NO_HOST = "wgs_SARS_CoV2_no_host";
const SARS_CoV2_SAMPLE_NAMES = [SARS_CoV2_NO_HOST];
const RUN_PIPELINE = true;
const WAIT_FOR_PIPELINE = false;
const timeout = 60 * 1000 * 2;


/*
 * Project View: Functional: P-1
 */
test.describe("Project View: Functional: P-1", () => {

  test.beforeEach(async () => {
    test.setTimeout(timeout);
  });

  /**
   * SNo WGS - 38: Filter Samples Through Taxon
   */
  test("SNo WGS - 38: Filter Samples Through Taxon", async ({ page }) => {
    // #region 1. Log in to Project
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(`SNo_WGS-38_${WORKFLOWS.WGS}`);

    const taxons = (await projectPage.getSearchSuggestions("coronavirus", "taxon", "Viruses", "my_data")).Taxon.results;
    const coronavirus = taxons[Math.floor(Math.random() * taxons.length)];
    await setupSamples(
      page,
      project,
      WGS_SARS_COV2_NO_HOST_FILES,
      SARS_CoV2_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      {hostOrganism: "Human", taxon: coronavirus.title,runPipeline: RUN_PIPELINE, waitForPipeline: WAIT_FOR_PIPELINE},
    );
    await projectPage.navigateToMyData();
    await projectPage.pause(1);
    // #endregion 1. Log in to Project

    // #region 2. Navigate to Consensus Genome tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Navigate to Consensus Genome tab

    // #region 3. Type in a Taxon string and select a suggested option (ex. Severe acute respiratory syndrome-related coronavirus)
    await projectPage.fillTaxonFilter([coronavirus.title]);
    // #endregion 3. Type in a Taxon string and select a suggested option (ex. Severe acute respiratory syndrome-related coronavirus)

    // #region 4. Click Apply
    await projectPage.clickApplyButton();

    // Taxon Filters - Taxon filter applied and Consensus Genome sample list is filtered with filtering criteria
    const graphqlfed = new Graphqlfed(page);
    const expectedSampleNames = await graphqlfed.projectSamplesByTaxon(project, coronavirus);

    const samplesTable = await projectPage.getSamplesTable();
    for (const tableRow of samplesTable) {
      expect(tableRow["Reference Accession"][1]).toContain(coronavirus.title);
      expect(expectedSampleNames).toContain(tableRow["Sample"][0]);
    }
    // #endregion 4. Click Apply
  });

  /**
   * SNo WGS - 39: Filter Samples Through Annotation
   */
  test("SNo WGS - 39: Filter Samples Through Annotation", async ({ page }) => {
    // #region 1. Log in to Project
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.WGS}`);
    // #endregion 1. Log in to Project

    // #region 2. Navigate to Consensus Genome tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Navigate to Consensus Genome tab

    // #region 3. Observe Annotation Taxon Filter
    const isAnnotationFilterDisabled = await projectPage.isAnnotationFilterDisabled();

    // Taxon Filters - Annotation filtering is greyed out and disabled
    expect(isAnnotationFilterDisabled).toBeTruthy();

    await projectPage.hoverOverAnnotationFilter();
    const disabledTooltip = await projectPage.getDisabledTooltip();
    expect(disabledTooltip).toEqual("Not available for Consensus Genomes.");
    // #endregion 3. Observe Annotation Taxon Filter
  });

  /**
   * SNo WGS - 40: Filter Samples Through Location
   */
  test("SNo WGS - 40: Filter Samples Through Location", async ({ page }) => {
    // #region 1. Log in to Project
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(`SNo_WGS-40_${WORKFLOWS.WGS}`);

    const chars = "abcdefghijklmnopqrstuvwxyz".split("");
    const randomLetter = chars[Math.floor(Math.random() * chars.length)];

    const locations = await projectPage.getLocationsExternalSearch(randomLetter);
    const location = locations[Math.floor(Math.random() * locations.length)];
    await setupSamples(
      page,
      project,
      WGS_SARS_COV2_NO_HOST_FILES,
      SARS_CoV2_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      {collectionLocation: location.name, runPipeline: RUN_PIPELINE, waitForPipeline: WAIT_FOR_PIPELINE},
    );
    // #endregion 1. Log in to Project

    // #region 2. Navigate to Consensus Genome tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Navigate to Consensus Genome tab

    // #region 3. Select a Location option from list and observe
    const locationOptions = await projectPage.getLocationFilterOptions();
    const locationName = locationOptions[Math.floor(Math.random() * locationOptions.length)];
    await projectPage.fillLocationFilter([locationName]);

    // Metadata Filters - LOCATION filter applied and Consensus Genome sample list is filtered with filtering criteria.
    // Sample count will reduce in the sample details panel. Location graph will reduce in the sample details panel.
    const graphqlfed = new Graphqlfed(page);
    const expectedSampleNames = await graphqlfed.projectSamplesByCollectionLocation(project, locationName);

    const consensusGenomesCount = await projectPage.getConsensusGenomesCount();
    expect(consensusGenomesCount).toEqual(expectedSampleNames.length);

    const samplesTable = await projectPage.getSamplesTable();
    for (const tableRow of samplesTable) {
      expect(tableRow["Location"]).toContain(locationName);
      expect(expectedSampleNames).toContain(tableRow["Sample"][0]);
    }
    // #endregion 3. Select a Location option from list and observe
  });

  /**
   * SNo WGS - 41: Filter Samples Through TimeFrame
   */
  test("SNo WGS - 41: Filter Samples Through TimeFrame", async ({ page }) => {
    // #region 1. Log in to Project
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.WGS}`);
    // #endregion 1. Log in to Project

    // #region 2. Navigate to Consensus Genome tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Navigate to Consensus Genome tab

    // #region 3. Select a Time Frame option from list and observe
    const timeframes = await projectPage.getTimeframeFilterOptions();
    const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
    const expectedDate = new Date();
    switch (timeframe) {
      case "Last Week":
        expectedDate.setUTCDate(expectedDate.getDate() - 7);
        break;
      case "Last Month":
        expectedDate.setUTCMonth(expectedDate.getUTCMonth() - 1);
        break;
      case "Last 3 Months":
        expectedDate.setUTCMonth(expectedDate.getUTCMonth() - 3);
        break;
      case "Last 6 Months":
        expectedDate.setUTCMonth(expectedDate.getUTCMonth() - 6);
        break;
      case "Last Year":
        expectedDate.setUTCFullYear(expectedDate.getUTCFullYear() - 1);
        break;
    }
    expectedDate.setUTCHours(0,0,0,0);
    await projectPage.fillTimeframeFilter(timeframe);

    // Metadata Filters - TIMEFRAME filter applied and Consensus Genome sample list is filtered with filtering criteria.
    // Sample count will reduce in the sample details panel.
    let expectedSamples = await new SamplesPage(page).getSamples(project.name);
    expectedSamples = expectedSamples.filter(s => new Date(s.created_at) >= expectedDate);

    const expectedSampleNames = expectedSamples.map(s => s.name);
    const samplesTable = await projectPage.getSamplesTable();
    for (const tableRow of samplesTable) {
      // expect(new Date(tableRow["Created On"][0])).toBeGreaterThanOrEqual(expectedDate)
      expect(expectedSampleNames).toContain(tableRow["Sample"][0]);
    }
    // #endregion 3. Select a Time Frame option from list and observe
  });

  /**
   * SNo WGS - 42: Filter Samples Through Visibility
   */
  test("SNo WGS - 42: Filter Samples Through Visibility", async ({ page }) => {
    // #region 1. Log in to Project
    const projectPage = new ProjectPage(page);
    const privateProject = await projectPage.getOrCreateProject(`private_SNo_WGS-42_${WORKFLOWS.WGS}`, 0);
    const publicProject = await projectPage.getOrCreateProject(`public_SNo_WGS-42_${WORKFLOWS.WGS}`, 1);
    await setupSamples(
      page,
      privateProject,
      WGS_SARS_COV2_NO_HOST_FILES,
      SARS_CoV2_SAMPLE_NAMES,
      WORKFLOWS.WGS,
    );
    await setupSamples(
      page,
      publicProject,
      WGS_SARS_COV2_NO_HOST_FILES,
      SARS_CoV2_SAMPLE_NAMES,
      WORKFLOWS.WGS,
    );
    // #endregion 1. Log in to Project

    // #region 2. Navigate to Consensus Genome tab
    await projectPage.navigateToSamples(privateProject.id, WORKFLOWS.WGS, "my_data");
    // #endregion 2. Navigate to Consensus Genome tab

    // #region 3. Select a Visibility option from list and observe
    // Metadata Filters - VISIBILITY filter applied and Consensus Genome sample list is filtered with filtering criteria.
    // Sample count will reduce in the sample details panel."
    await projectPage.fillVisibilityFilter("Private");
    let privateCount = await projectPage.getConsensusGenomesCount();

    await projectPage.fillVisibilityFilter("Public");
    let publicCount = await projectPage.getConsensusGenomesCount();

    expect(publicCount).toEqual(0);
    expect(privateCount).toBeGreaterThanOrEqual(1);

    await projectPage.navigateToSamples(publicProject.id, WORKFLOWS.WGS, "my_data");

    await projectPage.fillVisibilityFilter("Private");
    privateCount = await projectPage.getConsensusGenomesCount();

    await projectPage.fillVisibilityFilter("Public");
    publicCount = await projectPage.getConsensusGenomesCount();

    expect(privateCount).toEqual(0);
    expect(publicCount).toBeGreaterThanOrEqual(1);
    // #endregion 3. Select a Visibility option from list and observe
  });

  /**
   * SNo WGS - 43: Filter Samples Through Host
   */
  test("SNo WGS - 43: Filter Samples Through Host", async ({ page }) => {
    // #region 1. Log in to Project
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(`SNo_WGS-43_${WORKFLOWS.WGS}`);

    const hostOrganism = await new UploadPage(page).getRandomHostOrganism();
    await setupSamples(
      page,
      project,
      WGS_SARS_COV2_NO_HOST_FILES,
      SARS_CoV2_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      {hostOrganism: hostOrganism, runPipeline: RUN_PIPELINE, waitForPipeline: WAIT_FOR_PIPELINE},
    );
    // #endregion 1. Log in to Project

    // #region 2. Navigate to Consensus Genome tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Navigate to Consensus Genome tab

    // #region 3. Select a Host option from list and observe
    await projectPage.fillHostFilter([hostOrganism]);

    // Metadata Filters - HOST filter applied and Consensus Genome sample list is filtered with filtering criteria
    // Sample count will reduce in the sample details panel."
    const graphqlfed = new Graphqlfed(page);
    const expectedSampleNames = await graphqlfed.projectSamplesByHostOrganism(project, hostOrganism);

    const consensusGenomesCount = await projectPage.getConsensusGenomesCount();
    expect(consensusGenomesCount).toEqual(expectedSampleNames.length);

    const samplesTable = await projectPage.getSamplesTable();
    for (const tableRow of samplesTable) {
      expect(tableRow["Host"]).toContain(hostOrganism);
      expect(expectedSampleNames).toContain(tableRow["Sample"][0]);
    }
    // #endregion 3. Select a Host option from list and observe
  });

  /**
   * SNo WGS - 44: Filter Samples Through Sample Type
   */
  test("SNo WGS - 44: Filter Samples Through Sample Type", async ({ page }) => {
    // #region 1. Log in to Project
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(`SNo_WGS-44_${WORKFLOWS.WGS}`);

    // #region Get sample type counts
    const sampleType = await new UploadPage(page).getRandomSampleTissueType();
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    await projectPage.fillSampleTypeFilter([sampleType]);
    const consensusGenomesCountBefore = await projectPage.getConsensusGenomesCount();
    const expectedSampleNames = await projectPage.getSampleNames();
    await projectPage.fillSampleTypeFilter([sampleType]);
    // #endregion Get sample type counts

    const samples = await setupSamples(
      page,
      project,
      WGS_SARS_COV2_NO_HOST_FILES,
      SARS_CoV2_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      {sampleTissueType: sampleType, runPipeline: RUN_PIPELINE, waitForPipeline: WAIT_FOR_PIPELINE},
    );
    // Add the newly created samples to the expectedSampleNames
    for (const sample of samples) {
      expectedSampleNames.push(sample.name);
    }
    // #endregion 1. Log in to Project

    // #region 2. Navigate to Consensus Genome tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Navigate to Consensus Genome tab

    // #region 3. Select a Sample Type option from list and observe
    const consensusGenomesCountNoFilter = await projectPage.getConsensusGenomesCount();
    await projectPage.selectPlusColumnOptions(["Sample Type"]);
    await projectPage.fillSampleTypeFilter([sampleType]);

    // Metadata Filters - SAMPLE TYPE filter applied and Consensus Genome sample list is filtered with filtering criteria.
    // Sample count will reduce in the sample details panel."
    const consensusGenomesCountWithFilter = await projectPage.getConsensusGenomesCount();
    expect(consensusGenomesCountWithFilter).toBeLessThan(consensusGenomesCountNoFilter);

    // The current consensusGenomesCount is equal to the consensusGenomesCountBefore + samples.length
    expect(consensusGenomesCountWithFilter).toEqual(consensusGenomesCountBefore + samples.length);

    const samplesTable = await projectPage.getSamplesTable();
    for (const tableRow of samplesTable) {
      expect(tableRow["Sample Type"]).toContain(sampleType);
      expect(expectedSampleNames).toContain(tableRow["Sample"][0]);
    }
    // #endregion 3. Select a Sample Type option from list and observe
  });
});