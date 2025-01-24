import { WORKFLOWS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_1_PAIRED_R1,
  SAMPLE_FILE_1_PAIRED_R2,
} from "@e2e/constants/sample";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

const CT20K_SAMPLE_FILES = [SAMPLE_FILE_1_PAIRED_R1, SAMPLE_FILE_1_PAIRED_R2];
const SAMPLE_1_PAIRED = "Sample_1_Paired";
const CT20K_SAMPLE_NAMES = [SAMPLE_1_PAIRED];
const WAIT_FOR_PIPELINE = false;

const TEST_TIMEOUT = 60 * 1000 * 8;

/*
 * SC2 Delete samples
 */
test.describe("SC2 Delete samples: Functional: P-0", () => {
  /*
   * SC2 Delete samples
   * Sample view list
   */
  test("SNo SC2-47: Delete SC2 sample from sample view list Bulk download removed", async ({
    page,
  }) => {
    // #region Setup
    test.setTimeout(TEST_TIMEOUT);
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject("SNo_SC2-47");
    await setupSamples(
      page,
      project,
      CT20K_SAMPLE_FILES,
      CT20K_SAMPLE_NAMES,
      WORKFLOWS.SC2,
      {
        hostOrganism: "Human",
        taxon: "Unknown",
        runPipeline: true,
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // Run again so we have an extra sample for deleting later
    await setupSamples(
      page,
      project,
      CT20K_SAMPLE_FILES,
      CT20K_SAMPLE_NAMES,
      WORKFLOWS.SC2,
      {
        hostOrganism: "Human",
        taxon: "Unknown",
        runPipeline: true,
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion Setup

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    await projectPage.fillSearchMyDataInput(project.name);

    const projectsTableBefore =
      await projectPage.getProjectsTableOrderedByName();
    expect(projectsTableBefore[project.name]["Counts"]).toBeDefined();
    expect(projectsTableBefore[project.name]["Counts"].toString()).toMatch(
      /[0-9]+ Sample(s)?/,
    );

    let projectsTableSampleCountBefore =
      projectsTableBefore[project.name]["Counts"][0];
    projectsTableSampleCountBefore = projectsTableSampleCountBefore.includes(
      "Samples",
    )
      ? projectsTableSampleCountBefore.replace("Samples", "")
      : projectsTableSampleCountBefore.replace("Sample", "");
    const projectsTableSampleNumberCountBefore = parseInt(
      projectsTableSampleCountBefore,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Open [floo WGS1] Project
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);

    const projectSamplesBefore = await projectPage.getSamplesCount();
    // #endregion 2. Open [floo WGS1] Project

    // #region 3. Navigate to Consensus Genome tab
    await projectPage.clickConsensusGenomeTab();
    // #endregion 3. Navigate to Consensus Genome tab

    // #region 4. Select SC2 samples - ""Ct20K"", ""Sample_1_Paired""
    const selectSamples = await projectPage.selectCompletedSamples(1);
    const sampleToDelete = selectSamples[0];

    const consensusGenomesCountBefore =
      await projectPage.getConsensusGenomesCount();
    // #endregion 4. Select SC2 samples - ""Ct20K"", ""Sample_1_Paired""

    // #region 5. Click on Download icon (cloud) and start the following downloads: Consensus Genome, Intermediate Output Files
    await projectPage.clickDownloadButton();
    await projectPage.clickDownloadType("Consensus Genome");
    await projectPage.clickFilterDropdown();
    await projectPage.clickFilterOption("Single file (Concatenated)");
    const consensusGenomeDownloadId =
      await projectPage.clickStartGeneratingDownloadButton();
    await projectPage.clickDismissButton();

    await projectPage.clickDownloadButton();
    await projectPage.clickDownloadType("Intermediate Output Files");
    const intermediateOutputFilesDownloadId =
      await projectPage.clickStartGeneratingDownloadButton();
    // #endregion 5. Click on Download icon (cloud) and start the following downloads: Consensus Genome, Intermediate Output Files

    // #region 6. Go to Download main user menu
    let downloadsPage = await projectPage.gotToDownloads();
    // #endregion 6. Go to Download main user menu

    // #region 7. Verify created Bulk Downloads complete
    // Bulk Download files created with samples selected
    await downloadsPage.waitForDownloadComplete(consensusGenomeDownloadId);
    await downloadsPage.waitForDownloadComplete(
      intermediateOutputFilesDownloadId,
    );
    // #endregion 7. Verify created Bulk Downloads complete

    // #region 8. Go back to [floo WGS1] Project
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 8. Go back to [floo WGS1] Project

    // #region 9. Select ""Sample_1_Paired"" sample and click on Trash icon
    await projectPage.clickSampleCheckbox(sampleToDelete);
    // #endregion 9. Select ""Sample_1_Paired"" sample and click on Trash icon

    // #region 10. Click on Delete button in deletion prompt windows
    await projectPage.clickDeleteButton();
    await projectPage.clickDeleteConfirmationButton();
    await projectPage.clickDismissButton();
    // #endregion 10. Click on Delete button in deletion prompt windows

    // #region 11. Go to Download main user menu
    downloadsPage = await projectPage.gotToDownloads();
    // #endregion 11. Go to Download main user menu

    // #region 12. Verify Bulk Download files created in step 5 are removed
    // Bulk download file records removed when a sample is deleted
    expect(
      await downloadsPage.isDownloadVisible(consensusGenomeDownloadId),
    ).toBeFalsy();
    expect(
      await downloadsPage.isDownloadVisible(intermediateOutputFilesDownloadId),
    ).toBeFalsy();
    // #endregion 12. Verify Bulk Download files created in step 5 are removed

    // #region 13. Verify Samples & Consensus Genomes tabs sample counts
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    const consensusGenomesCountAfter =
      await projectPage.getConsensusGenomesCount();

    // - Consensus Genomes tab count decreases by [X]
    expect(consensusGenomesCountAfter).toEqual(consensusGenomesCountBefore - 1);

    // - Samples general tab count decreases by [X]
    const projectSamplesAfter = await projectPage.getSamplesCount();
    expect(projectSamplesAfter).toEqual(projectSamplesBefore - 1);
    // #endregion 13. Verify Samples & Consensus Genomes tabs sample counts

    // #region 14. Verify Discovery View Project sample count
    await projectPage.navigateToMyData();
    await projectPage.fillSearchMyDataInput(project.name);
    const projectsTableAfter =
      await projectPage.getProjectsTableOrderedByName();

    // - Discovery view project sample count total and CG count decreases by [X]
    let projectsTableSampleCountAfter =
      projectsTableAfter[project.name]["Counts"][0];
    projectsTableSampleCountAfter = projectsTableSampleCountAfter.includes(
      "Samples",
    )
      ? projectsTableSampleCountAfter.replace("Samples", "")
      : projectsTableSampleCountAfter.replace("Sample", "");

    const projectsTableSampleNumberCountAfter = parseInt(
      projectsTableSampleCountAfter,
    );
    expect(projectsTableSampleNumberCountAfter).toEqual(
      projectsTableSampleNumberCountBefore - 1,
    );
    // #endregion 14. Verify Discovery View Project sample count
  });

  /*
   * SC2 Delete samples
   * Sample report
   */
  test("SNo SC2-48: Delete SC2 sample from sample report Bulk download removed", async ({
    page,
  }) => {
    // #region Setup
    test.setTimeout(TEST_TIMEOUT);
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject("SNo_SC2-48");
    await setupSamples(
      page,
      project,
      CT20K_SAMPLE_FILES,
      CT20K_SAMPLE_NAMES,
      WORKFLOWS.SC2,
      {
        hostOrganism: "Human",
        taxon: "Unknown",
        runPipeline: true,
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // Run again so we have an extra sample for deleting later
    await setupSamples(
      page,
      project,
      CT20K_SAMPLE_FILES,
      CT20K_SAMPLE_NAMES,
      WORKFLOWS.SC2,
      {
        hostOrganism: "Human",
        taxon: "Unknown",
        runPipeline: true,
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion Setup

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    await projectPage.fillSearchMyDataInput(project.name);

    const projectsTableBefore =
      await projectPage.getProjectsTableOrderedByName();
    expect(projectsTableBefore[project.name]["Counts"]).toBeDefined();
    expect(projectsTableBefore[project.name]["Counts"].toString()).toMatch(
      /[0-9]+ Sample(s)?/,
    );

    let projectsTableSampleCountBefore =
      projectsTableBefore[project.name]["Counts"][0];
    projectsTableSampleCountBefore = projectsTableSampleCountBefore.includes(
      "Samples",
    )
      ? projectsTableSampleCountBefore.replace("Samples", "")
      : projectsTableSampleCountBefore.replace("Sample", "");
    const projectsTableSampleNumberCountBefore = parseInt(
      projectsTableSampleCountBefore,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Open [floo WGS1] Project
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);

    const projectSamplesBefore = await projectPage.getSamplesCount();
    // #endregion 2. Open [floo WGS1] Project

    // #region 3. Navigate to Consensus Genome tab
    await projectPage.clickConsensusGenomeTab();
    // #endregion 3. Navigate to Consensus Genome tab

    // #region 4. Select SC2 samples - ""Ct20K"", ""Sample_1_Paired""
    const selectSamples = await projectPage.selectCompletedSamples(1);
    const sampleToDelete = selectSamples[0];

    const consensusGenomesCountBefore =
      await projectPage.getConsensusGenomesCount();
    // #endregion 4. Select SC2 samples - ""Ct20K"", ""Sample_1_Paired""

    // #region 5. Click on Download icon (cloud) and start the following downloads: Consensus Genome, Intermediate Output Files
    await projectPage.clickDownloadButton();
    await projectPage.clickDownloadType("Consensus Genome");
    await projectPage.clickFilterDropdown();
    await projectPage.clickFilterOption("Single file (Concatenated)");
    const consensusGenomeDownloadId =
      await projectPage.clickStartGeneratingDownloadButton();
    await projectPage.clickDismissButton();

    await projectPage.clickDownloadButton();
    await projectPage.clickDownloadType("Intermediate Output Files");
    const intermediateOutputFilesDownloadId =
      await projectPage.clickStartGeneratingDownloadButton();
    // #endregion 5. Click on Download icon (cloud) and start the following downloads: Consensus Genome,Intermediate Output Files

    // #region 6. Go to Download main user menu
    let downloadsPage = await projectPage.gotToDownloads();
    // #endregion 6. Go to Download main user menu

    // #region 7. Verify created Bulk Downloads complete
    // Bulk Download files created with samples selected
    await downloadsPage.waitForDownloadComplete(consensusGenomeDownloadId);
    await downloadsPage.waitForDownloadComplete(
      intermediateOutputFilesDownloadId,
    );
    // #endregion 7. Verify created Bulk Downloads complete

    // #region 8. Go back to [floo WGS1] Project
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 8. Go back to [floo WGS1] Project

    // #region 9. Click on ""Sample_1_Paired"" sample report
    const samplePage = await projectPage.clickSample(sampleToDelete);
    // #endregion 9. Click on ""Sample_1_Paired"" sample report

    // #region 10. Click on ""Delete CG Run"" from meatballs menu (3 dots)
    await samplePage.clickMeatballsMenu();
    await samplePage.clickDeleteCGRunButton();
    // #endregion 10. Click on ""Delete CG Run"" from meatballs menu (3 dots)

    // #region 11. Click on Delete button in deletion prompt windows
    await samplePage.clickDeleteButtonConfirmation();
    await samplePage.clickDismissButton();
    // #endregion 11. Click on Delete button in deletion prompt windows

    // #region 12. Go to Download main user menu
    downloadsPage = await projectPage.gotToDownloads();
    // #endregion 12. Go to Download main user menu

    // #region 13. Verify Bulk Download files created in step 5 are removed
    // Bulk download file records removed when a sample is deleted
    expect(
      await downloadsPage.isDownloadVisible(consensusGenomeDownloadId),
    ).toBeFalsy();
    expect(
      await downloadsPage.isDownloadVisible(intermediateOutputFilesDownloadId),
    ).toBeFalsy();
    // #endregion 13. Verify Bulk Download files created in step 5 are removed

    // #region 14. Verify Samples & Consensus Genomes tabs sample counts
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    const consensusGenomesCountAfter =
      await projectPage.getConsensusGenomesCount();

    // - Consensus Genomes tab count decreases by [X]
    expect(consensusGenomesCountAfter).toEqual(consensusGenomesCountBefore - 1);

    // - Samples general tab count decreases by [X]
    const projectSamplesAfter = await projectPage.getSamplesCount();
    expect(projectSamplesAfter).toEqual(projectSamplesBefore - 1);
    // #endregion 14. Verify Samples & Consensus Genomes tabs sample counts

    // #region 15. Verify Discovery View Project sample count
    await projectPage.navigateToMyData();
    await projectPage.fillSearchMyDataInput(project.name);
    const projectsTableAfter =
      await projectPage.getProjectsTableOrderedByName();

    // - Discovery view project sample count total and CG count decreases by [X]
    let projectsTableSampleCountAfter =
      projectsTableAfter[project.name]["Counts"][0];
    projectsTableSampleCountAfter = projectsTableSampleCountAfter.includes(
      "Samples",
    )
      ? projectsTableSampleCountAfter.replace("Samples", "")
      : projectsTableSampleCountAfter.replace("Sample", "");

    const projectsTableSampleNumberCountAfter = parseInt(
      projectsTableSampleCountAfter,
    );
    expect(projectsTableSampleNumberCountAfter).toEqual(
      projectsTableSampleNumberCountBefore - 1,
    );
    // #endregion 15. Verify Discovery View Project sample count
  });
});
