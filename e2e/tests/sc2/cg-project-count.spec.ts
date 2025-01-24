import { SEQUENCING_PLATFORMS, WORKFLOWS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_NO_HOST_1,
  SAMPLE_FILE_NO_HOST_2,
} from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

const SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const SAMPLE_NAME = "wgs_SARS_CoV2_no_host";
const SAMPLE_NAMES = [SAMPLE_NAME];

const RUN_PIPELINE = true;
const WAIT_FOR_PIPELINE = false;

const TEST_TIMEOUT = 60 * 1000 * 40; // Inclease the test runtime to let the workflow run

/*
 * CG - Project Count
 * Run from mNGS
 */
test.describe("CG - Project Count Run from mNGS: Functional: P-0", () => {
  /*
   * SNo SC2-42: Project count when CG running from mNGS
   */
  test(`SNo SC2-42: Project count when CG running from mNGS`, async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select ""floo sp100"" project
    const project = await projectPage.getOrCreateProject("SNo_SC2-42");
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);

    const originalConsensusGenomeTabCount =
      await projectPage.getConsensusGenomesCount();
    const originalGeneralSamplesTabCount = await projectPage.getSamplesCount();

    await setupSamples(
      page,
      project,
      SAMPLE_FILES,
      SAMPLE_NAMES,
      WORKFLOWS.MNGS,
      {
        hostOrganism: "Human",
        taxon: "Betacoronavirus 1",
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS,
        runPipeline: RUN_PIPELINE,
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    await projectPage.pause(10); // Allow time for the Samples column count to update
    await projectPage.reload();
    // #endregion 2. At Project tab, select ""floo sp100"" project

    // #region 3. Click on ""CoVOC43_95UHR_Thermo_cDNA_Synthesis_Unenriched_Rep1"" sample
    const sampleName = (await projectPage.selectCompletedSamples(1))[0];
    await projectPage.clickSample(sampleName);
    // #endregion 3. Click on ""CoVOC43_95UHR_Thermo_cDNA_Synthesis_Unenriched_Rep1"" sample

    // #region 4. Expand ""Betacoronavirus"" taxon record
    const samplePage = new SamplesPage(page);
    await samplePage.fillSearchBar("Betacoronavirus");

    const betacoronavirus = "Betacoronavirus (genus)";
    await samplePage.clickSearchResult(betacoronavirus);
    // #endregion 4. Expand ""Betacoronavirus"" taxon record

    // #region 5. Hover over ""Betacoronavirus 1"" species row and click on Consensus Genome icon
    await samplePage.clickExpandAll();
    const knownPathongen =
      "Severe acute respiratory syndrome-related coronavirus";
    await samplePage.clickConsensusGenomeIcon(knownPathongen);
    const isCreateANewConsensusGenomeButtonVisible =
      await samplePage.isCreateANewConsensusGenomeButtonVisible();
    if (isCreateANewConsensusGenomeButtonVisible) {
      await samplePage.clickCreateANewConsensusGenome();
    }
    // #endregion 5. Hover over ""Betacoronavirus 1"" species row and click on Consensus Genome icon

    // #region 6. Select ""Human coronavirus OC43, complete genome - 99.6%id, Complete Sequence, 31.5x coverage"" Reference Accession option from dropdown list
    const selectedReferenceAccession =
      await samplePage.selectRandomReferenceAccession();
    expect(await samplePage.getSelectedReferenceAccessionOption()).toEqual(
      selectedReferenceAccession,
    );
    // #endregion 6. Select ""Human coronavirus OC43, complete genome - 99.6%id, Complete Sequence, 31.5x coverage"" Reference Accession option from dropdown list

    // #region 7. Cilck on ""Create Consensus Genome"" button
    await samplePage.clickCreateConsensusGenomeButton();
    // #endregion 7. Cilck on ""Create Consensus Genome"" button

    // #region 8. Click on ""VIEW CONSENSUS GENOME"" link in blue toast message
    await samplePage.clickViewConsensusGenomeLink();
    await samplePage.waitForNotInProgress();

    // - CG Pipeline was successfully kicked off and loads a sample report.
    const isMyConsensusGenomeComplete =
      await samplePage.getIsMyConsensusGenomeCompleteTable();
    expect(isMyConsensusGenomeComplete).not.toEqual([]);
    // #endregion 8. Click on ""VIEW CONSENSUS GENOME"" link in blue toast message

    // #region 9. Click back on ""floo sp100"" project link at CG in progress page
    await samplePage.clickBackToProject(project.name);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 9. Click back on ""floo sp100"" project link at CG in progress page

    // #region 10. Observe Consensus Genome tab count
    await projectPage.pause(10); // Allow time for the Consensus Genome tab count to update
    await projectPage.reload();

    const consensusGenomeTabCount =
      await projectPage.getConsensusGenomesCount();
    // #endregion 10. Observe Consensus Genome tab count

    // #region 11. Observe Samples general tab count
    const generalSamplesTabCount = await projectPage.getSamplesCount();
    // #endregion 11. Observe Samples general tab count

    // #region - Consensus Genomes tab count increases by 1
    expect(consensusGenomeTabCount).toEqual(
      originalConsensusGenomeTabCount + 1,
    );
    expect(generalSamplesTabCount).toEqual(originalGeneralSamplesTabCount + 1);
    // #endregion - Consensus Genomes tab count increases by 1
  });
});
