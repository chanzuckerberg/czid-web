import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_1_PAIRED_R1,
  SAMPLE_FILE_1_PAIRED_R2,
  SAMPLE_FILE_CT20K,
} from "@e2e/constants/sample";
import { ProjectPage } from "@e2e/page-objects/project-page";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage } from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import { kebabCase } from "lodash";

const SAMPLE_FILES = [SAMPLE_FILE_1_PAIRED_R1, SAMPLE_FILE_1_PAIRED_R2];
const UPLOAD_COMPLETE_LITERAL = "Uploads completed!";
const WAIT_FOR_PIPELINE = false;
const IN_PROGRESS = "IN PROGRESS";
const IN_PROGRESS_MESSAGE =
  "IN PROGRESSYour Consensus Genome is being generated!Learn about Consensus Genomes";
const EXPECTED_REFERENCE_ACCESSION = [
  "MN908947.3 - Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
  "Severe acute respiratory syndrome coronavirus 2",
];
const REFERENCE_ACCESSION = "Reference Accession";
const SEQUENCING_PLATFORM = "Sequencing Platform";
const WETLAB_PROTOCOL = "Wetlab Protocol";
const MEDAKA_MODEL = "Medaka Model";
const PLUS_COLUMNS = [SEQUENCING_PLATFORM, WETLAB_PROTOCOL, MEDAKA_MODEL];

const ARTIC_V4_1 = "ARTIC v4/ARTIC v4.1";
const ARTIC_V5_3_2 = "ARTIC v5.3.2";
const ILLUMINA_WET_LABS = [
  ARTIC_V4_1,
  ARTIC_V5_3_2,
  "ARTIC v3",
  "ARTIC v3 - Short Amplicons (275 bp)",
  "MSSPE",
  "Combined MSSPE & ARTIC v3",
  "SNAP",
  "AmpliSeq",
  "COVIDseq",
  "VarSkip",
  "Midnight",
  "Easyseq",
];
const NANOPORE_WET_LABS = [
  "ARTIC v3",
  "Midnight",
  ARTIC_V4_1,
  "VarSkip",
  ARTIC_V5_3_2,
];
const MEDAKA_MODELS = [
  "r941_prom_high_g330",
  "r103_prom_snp_g3210",
  "r941_prom_high_g303",
  "r941_prom_snp_g303",
  "r941_prom_snp_g360",
  "r941_prom_variant_g322",
  "r941_prom_variant_g360",
  "r941_min_high_g303",
  "r941_prom_high_g360",
  "r941_prom_fast_g303",
  "r941_prom_high_g344",
  "r941_min_high_g340_rle",
  "r103_prom_high_g360",
  "r941_min_high_g344",
  "r941_min_high_g351",
  "r103_prom_variant_g3210",
  "r941_prom_high_g4011",
  "r941_prom_snp_g322",
  "r941_prom_variant_g303",
  "r941_min_fast_g303",
  "r941_min_high_g330",
  "r941_min_high_g360",
];

let TEST_TIMEOUT = 60 * 1000 * 15;
const UPLOAD_TIMEOUT = 60 * 1000 * 10;

/*
 * Sample upload (web)
 */
test.describe("Sample upload (web): Functional: P-0", () => {
  // AUTOMATION COMMENT:
  // We need to run this Illumina TC with different Wetlab Protocol:
  for (const wetLab of ILLUMINA_WET_LABS) {
    /*
    Sample upload (web) - SC2  Illumina
    with different Wetlab Protocol
    */
    test(`SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab ${wetLab}`, async ({
      page,
    }) => {
      test.setTimeout(TEST_TIMEOUT);

      // #region 1. Login to CZ ID staging
      const projectPage = new ProjectPage(page);
      await projectPage.navigateToMyData();
      // #endregion 1. Login to CZ ID staging

      // #region 2. Click on Upload
      await projectPage.clickUploadHeaderLink();
      // #endregion 2. Click on Upload

      // #region 3. Select a project and check "SARS-CoV-2 Consensus Genome" Analysis Type checkbox
      const project = await projectPage.getOrCreateProject(
        `Wetlab_${kebabCase(wetLab)}`,
      );

      const uploadPage = new UploadPage(page);
      await uploadPage.selectProject(project.name);
      await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.SC2);
      // #endregion 3. Select a project and check "SARS-CoV-2 Consensus Genome" Analysis Type checkbox

      // #region 4. Select "Illumina" radio button
      await uploadPage.clickSequencingPlatform(SEQUENCING_PLATFORMS.MNGS);
      // #endregion 4. Select "Illumina" radio button

      // #region 5. Select "ARTIC v3" Wetlab Protocol from dropdown list
      await uploadPage.setWetLabFilter(wetLab);
      // #endregion 5. Select "ARTIC v3" Wetlab Protocol from dropdown list

      // #region 6. Select Sample files and click on Continue (see Data section)
      await uploadPage.uploadSampleFiles(SAMPLE_FILES, true, UPLOAD_TIMEOUT);
      await uploadPage.clickContinue();
      // #endregion 6. Select Sample files and click on Continue (see Data section)

      // #region 7. Enter required Metadata and click on Continue
      let sampleNames = await uploadPage.getMetadataSampleNames();
      const inputs = await uploadPage.getRandomizedSampleInputs(
        SAMPLE_FILES,
        sampleNames,
      );
      await uploadPage.setManualInputs(inputs);
      await uploadPage.clickContinue();
      // #endregion 7. Enter required Metadata and click on Continue

      // #region 8. Check on Terms and Privacy policies checkbox and click Start Upload
      await uploadPage.clickTermsAgreementCheckbox();
      await uploadPage.clickStartUploadButton();
      await uploadPage.waitForUploadComplete();

      // Uploading screen displays with:
      // - Upload progress bar(s) completed
      // - Sent to Pipeline status displayed
      // - Uploads completed! message displayed
      // - Go to Project button enabled / displayed
      for (const sampleName of sampleNames) {
        const hostSentToPipeline = await uploadPage.waitForSampleSentToPipeline(
          sampleName,
        );
        expect(hostSentToPipeline).toBeTruthy();

        const hostUploadProgress = await uploadPage.getSampleUploadProgress(
          sampleName,
        );
        expect(hostUploadProgress).toEqual(100);
      }
      const uploadWindowTitle = await uploadPage.getUploadWindowTitle();
      expect(uploadWindowTitle).toEqual(UPLOAD_COMPLETE_LITERAL);

      const goToProjectButtonEnabled =
        await uploadPage.isGoToProjectButtonEnabled();
      expect(goToProjectButtonEnabled).toBeTruthy();
      // #endregion 8. Check on Terms and Privacy policies checkbox and click Start Upload

      // #region 9. Click on Go to Project in Uploads completed! page
      await uploadPage.clickGoToProjectButton();
      // #endregion 9. Click on Go to Project in Uploads completed! page

      // #region 10. Click on Sample row and observe
      const samplesPage = new SamplesPage(page);

      await projectPage.scrollDownToSample(sampleNames[0]);
      await projectPage.clickSample(sampleNames[0]);

      // - Sample report displays "In Progress. Your Consensus Genome is being generated!" until completion
      const sampleStatusMessage = await samplesPage.getSampleStatusMessage(
        IN_PROGRESS,
      );

      expect(sampleStatusMessage).toEqual(IN_PROGRESS_MESSAGE);
      // #endregion 10. Click on Sample row and observe

      // #region 11. Go back to project and observe Sample status until it Completes
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);

      // At Project Sample view list:
      // - Sample statuses go from Created (grey) - Running (grey) - Complete (green)
      let samplesTable = await projectPage.getSamplesTableOrderedByName();
      for (const sampleName of sampleNames) {
        expect(samplesTable[sampleName]["Sample"][1]).toEqual("RUNNING");
      }

      if (WAIT_FOR_PIPELINE) {
        TEST_TIMEOUT = 60 * 1000 * 60;
        test.setTimeout(TEST_TIMEOUT);
        await projectPage.waitForSampleComplete(
          project.id,
          WORKFLOWS.WGS,
          sampleNames[sampleNames.length - 1],
        );
        await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
        await projectPage.waitForSampleComplete(
          project.id,
          WORKFLOWS.WGS,
          sampleNames[0],
        );
      } else {
        sampleNames = await projectPage.selectCompletedSamples(
          sampleNames.length,
        );
      }

      samplesTable = await projectPage.getSamplesTableOrderedByName();
      for (const sampleName of sampleNames) {
        expect(samplesTable[sampleName]["Sample"][1]).toEqual("COMPLETE");
      }
      // #endregion 11. Go back to project and observe Sample status until it Completes

      // #region 12. Hover over Reference Accession value in Sample View list

      // - Reference Accession reads:
      // MN908947.3 - Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome
      // Severe acute respiratory syndrome coronavirus 2
      for (const sampleName of sampleNames) {
        expect(samplesTable[sampleName][REFERENCE_ACCESSION]).toEqual(
          EXPECTED_REFERENCE_ACCESSION,
        );
      }
      // #endregion 12. Hover over Reference Accession value in Sample View list

      // #region 13. Click on (+) icon in Sample List column labels and add
      await projectPage.selectPlusColumnOptions(PLUS_COLUMNS);
      // #endregion 13. Click on (+) icon in Sample List column labels and add

      // #region 14. Observe new metadata column info added
      samplesTable = await projectPage.getSamplesTableOrderedByName();

      // - Sequencing Platform metadata reads: Illumina
      // - Wetlab Protocol reads: ARTIC
      // - Medaka Model reads: [empty]
      let expectedWetlab = wetLab;
      if (wetLab === "ARTIC v3") {
        expectedWetlab = "ARTIC";
      } else if (wetLab === "Combined MSSPE & ARTIC v3") {
        expectedWetlab = "Combined MSSPE ARTIC";
      } else if (wetLab === "ARTIC v3 - Short Amplicons (275 bp)") {
        expectedWetlab = "ARTIC Short Amplicons";
      } else if (wetLab === ARTIC_V4_1) {
        expectedWetlab = "ARTIC v4";
      } else if (wetLab === ARTIC_V5_3_2) {
        expectedWetlab = "ARTIC v5";
      }
      for (const sampleName of sampleNames) {
        const actualWetLab = samplesTable[sampleName][WETLAB_PROTOCOL];
        const expectedMatch = new RegExp(expectedWetlab, "i");
        expect(actualWetLab).toMatch(expectedMatch);
        expect(samplesTable[sampleName][MEDAKA_MODEL]).toEqual("");
      }
      // #endregion 14. Observe new metadata column info added
    });
  }

  /*
  Sample upload - SC2 Nanopore
  Clear Labs
  */
  test(`SNo SC2-3: SARS-CoV-2 Nanopore sample web upload (ARTIC v3 - r941_min_high_g360)`, async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check ""SARS-CoV-2 Consensus Genome"" Analysis Type checkbox
    const project = await projectPage.getOrCreateProject("SNo_SC2-3");

    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.SC2);
    // #endregion 3. Select a project and check ""SARS-CoV-2 Consensus Genome"" Analysis Type checkbox

    // #region 4. Select ""Nanopore"" radio button
    await uploadPage.clickSequencingPlatform(WORKFLOWS.LMNGS);
    // #endregion 4. Select ""Nanopore"" radio button

    // #region 5. Toggle ""Used Clear Labs"" to enabled
    await uploadPage.clickClearLabsToggle("Yes");
    // #endregion 5. Toggle ""Used Clear Labs"" to enabled

    // #region 6. Verify "WETLAB_PROTOCOL" and "MEDAKA_MODEL" values
    const actualWetlabDescription = await uploadPage.getWetlabDescription();
    const actualMedakaModelDescription =
      await uploadPage.getMedakaModelDescription();

    // Sample web upload process:
    // - Wetlab Protocol defaulted to ""ARTIC v3""
    // - Medaka Model defaulted to ""r941_min_high_g360""
    const expectedWetlabDescription = "ARTIC v3";
    const expectedMedakaModelDescription = "r941_min_high_g360";

    expect(actualWetlabDescription).toEqual(expectedWetlabDescription);
    expect(actualMedakaModelDescription).toEqual(
      expectedMedakaModelDescription,
    );
    // #endregion 6. Verify "WETLAB_PROTOCOL" and "MEDAKA_MODEL" values

    // #region 7. Select Sample files and click on Continue (see Data section)
    // SC2 Nanopore sample:
    // https://drive.google.com/drive/folders/1msCAsIQl75N7wmL6JYwSA2zmk5hhahoy?usp=sharing
    await uploadPage.uploadSampleFiles(
      [SAMPLE_FILE_CT20K],
      true,
      UPLOAD_TIMEOUT,
    );
    await uploadPage.clickContinue();
    // #endregion 7. Select Sample files and click on Continue (see Data section)

    // #region 8. Enter required Metadata and click on Continue
    let sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(
      [SAMPLE_FILE_CT20K],
      sampleNames,
    );
    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();
    // #endregion 8. Enter required Metadata and click on Continue

    // #region 9. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForUploadComplete();

    // Uploading screen displays with:
    // - Upload progress bar(s) completed
    // - Sent to Pipeline status displayed
    // - Uploads completed! message displayed
    // - Go to Project button enabled / displayed
    for (const sampleName of sampleNames) {
      const hostSentToPipeline = await uploadPage.waitForSampleSentToPipeline(
        sampleName,
      );
      expect(hostSentToPipeline).toBeTruthy();

      const hostUploadProgress = await uploadPage.getSampleUploadProgress(
        sampleName,
      );
      expect(hostUploadProgress).toEqual(100);
    }
    const uploadWindowTitle = await uploadPage.getUploadWindowTitle();
    expect(uploadWindowTitle).toEqual(UPLOAD_COMPLETE_LITERAL);

    const goToProjectButtonEnabled =
      await uploadPage.isGoToProjectButtonEnabled();
    expect(goToProjectButtonEnabled).toBeTruthy();
    // #endregion 9. Check on Terms and Privacy policies checkbox and click Start Upload

    // #region 10. Click on Go to Project in Uploads completed! page
    await uploadPage.clickGoToProjectButton();
    // #endregion 10. Click on Go to Project in Uploads completed! page

    // #region 11. Click on Sample row and observe
    const samplesPage = new SamplesPage(page);

    await projectPage.scrollDownToSample(sampleNames[0]);
    await projectPage.clickSample(sampleNames[0]);

    // - Sample report displays "In Progress. Your Consensus Genome is being generated!" until completion
    const sampleStatusMessage = await samplesPage.getSampleStatusMessage(
      IN_PROGRESS,
    );

    expect(sampleStatusMessage).toEqual(IN_PROGRESS_MESSAGE);
    // #endregion 11. Click on Sample row and observe

    // #region 12. Go back to project and observe Sample status until it Completes
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);

    // At Project Sample view list:
    // - Sample statuses go from Created (grey) - Running (grey) - Complete (green)
    let samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      expect(samplesTable[sampleName]["Sample"][1]).toEqual("RUNNING");
    }

    if (WAIT_FOR_PIPELINE) {
      TEST_TIMEOUT = 60 * 1000 * 60;
      test.setTimeout(TEST_TIMEOUT);
      await projectPage.waitForSampleComplete(
        project.id,
        WORKFLOWS.WGS,
        sampleNames[sampleNames.length - 1],
      );
      await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
      await projectPage.waitForSampleComplete(
        project.id,
        WORKFLOWS.WGS,
        sampleNames[0],
      );
    } else {
      sampleNames = await projectPage.selectCompletedSamples(
        sampleNames.length,
      );
    }

    samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      expect(samplesTable[sampleName]["Sample"][1]).toEqual("COMPLETE");
    }
    // #endregion 12. Go back to project and observe Sample status until it Completes

    // #region 13. Hover over Reference Accession value in Sample View list

    // - Reference Accession reads:
    // MN908947.3 - Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome
    // Severe acute respiratory syndrome coronavirus 2
    for (const sampleName of sampleNames) {
      expect(samplesTable[sampleName][REFERENCE_ACCESSION]).toEqual(
        EXPECTED_REFERENCE_ACCESSION,
      );
    }
    // #endregion 13. Hover over Reference Accession value in Sample View list

    // #region 14. Click on (+) icon in Sample List column labels and add ""Sequencing Platform"", "WETLAB_PROTOCOL", "MEDAKA_MODEL" metadata options
    await projectPage.selectPlusColumnOptions(PLUS_COLUMNS);
    // #endregion 14. Click on (+) icon in Sample List column labels and add ""Sequencing Platform"", "WETLAB_PROTOCOL", "MEDAKA_MODEL" metadata options

    // #region 15. Observe new metadata column info added
    samplesTable = await projectPage.getSamplesTableOrderedByName();

    for (const sampleName of sampleNames) {
      // - Sequencing Platform metadata reads: Nanopore
      expect(samplesTable[sampleName][SEQUENCING_PLATFORM]).toEqual("Nanopore");
      // - Wetlab Protocol reads: ARTIC
      expect(samplesTable[sampleName][WETLAB_PROTOCOL]).toEqual("ARTIC");
      // - Medaka Model reads: r941_min_high_g360
      expect(samplesTable[sampleName][MEDAKA_MODEL]).toEqual(
        "r941_min_high_g360",
      );
    }
    // #endregion 15. Observe new metadata column info added
  });

  /*
  Sample upload - SC2 Nanopore
  Midnight
  */
  test(`SNo SC2-4: SARS-CoV-2 Nanopore sample web upload (Midnight - Medaka Model)`, async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check "SARS-CoV-2 Consensus Genome" Analysis Type checkbox
    const project = await projectPage.getOrCreateProject("SNo_SC2-4");

    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.SC2);
    // #endregion 3. Select a project and check "SARS-CoV-2 Consensus Genome" Analysis Type checkbox

    // #region 4. Select "Nanopore" radio button
    await uploadPage.clickSequencingPlatform(WORKFLOWS.LMNGS);
    // #endregion 4. Select "Nanopore" radio button

    // #region 5. Verify "Used Clear Labs" toggle is disabled
    const usedClearLabs = await uploadPage.getClearLabsValue();
    expect(usedClearLabs).toEqual("No");
    // #endregion 5. Verify "Used Clear Labs" toggle is disabled

    // #region 6. Select Wetlab Protocol "Midnight" option
    // - Wetlab Protocol defaulted to ""ARTIC v3""
    const nanoporeTechnologyDescriptio =
      await uploadPage.getNanoporeTechnologyDescription();
    expect(nanoporeTechnologyDescriptio).toEqual(
      "We are using the ARTIC network’s nCoV-2019 novel coronavirus bioinformatics protocol for nanopore sequencing, which can be found here.",
    );

    // We want to verify that Medaka Model choices appear, as well as wetlab protocol
    const wetlabOptions = await uploadPage.getWetlabOptions();
    expect(wetlabOptions.sort()).toEqual(NANOPORE_WET_LABS.sort());

    const wetLab = "Midnight";
    await uploadPage.setWetLabFilter(wetLab);
    // #endregion 6. Select Wetlab Protocol "Midnight" option

    // #region 7. Select Medaka Model "r941_prom_high_g330" option
    // - Medaka Model defaulted to ""r941_min_high_g360""
    const medakaModelDefault = await uploadPage.getMedakaModelFilterValue();
    expect(medakaModelDefault).toEqual("r941_min_high_g360");

    // We want to verify that Medaka Model choices appear, as well as wetlab protocol
    const medakaModelFilterOptions =
      await uploadPage.getMedakaModelFilterOptions();
    expect(medakaModelFilterOptions.sort()).toEqual(MEDAKA_MODELS.sort());

    const medakaModel = "r941_prom_high_g330";
    await uploadPage.setMedakaModelFilter(medakaModel);
    // #endregion 7. Select Medaka Model "r941_prom_high_g330" option

    // #region 8. Select Sample files and click on Continue (see Data section)
    // SC2 Nanopore sample:
    // https://drive.google.com/drive/folders/1msCAsIQl75N7wmL6JYwSA2zmk5hhahoy?usp=sharing
    await uploadPage.uploadSampleFiles(
      [SAMPLE_FILE_CT20K],
      true,
      UPLOAD_TIMEOUT,
    );
    await uploadPage.clickContinue();
    // #endregion 8. Select Sample files and click on Continue (see Data section)

    // #region 9. Enter required Metadata and click on Continue
    let sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(
      [SAMPLE_FILE_CT20K],
      sampleNames,
    );
    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();
    // #endregion 9. Enter required Metadata and click on Continue

    // #region 10. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForUploadComplete();

    // Uploading screen displays with:
    // - Upload progress bar(s) completed
    // - Sent to Pipeline status displayed
    // - Uploads completed! message displayed
    // - Go to Project button enabled / displayed
    for (const sampleName of sampleNames) {
      const hostSentToPipeline = await uploadPage.waitForSampleSentToPipeline(
        sampleName,
      );
      expect(hostSentToPipeline).toBeTruthy();

      const hostUploadProgress = await uploadPage.getSampleUploadProgress(
        sampleName,
      );
      expect(hostUploadProgress).toEqual(100);
    }
    const uploadWindowTitle = await uploadPage.getUploadWindowTitle();
    expect(uploadWindowTitle).toEqual(UPLOAD_COMPLETE_LITERAL);

    const goToProjectButtonEnabled =
      await uploadPage.isGoToProjectButtonEnabled();
    expect(goToProjectButtonEnabled).toBeTruthy();
    // #endregion 10. Check on Terms and Privacy policies checkbox and click Start Upload

    // #region 11. Click on Go to Project in Uploads completed! page
    await uploadPage.clickGoToProjectButton();
    // #endregion 11. Click on Go to Project in Uploads completed! page

    // #region 12. Click on Sample row and observe
    const samplesPage = new SamplesPage(page);

    await projectPage.scrollDownToSample(sampleNames[0]);
    await projectPage.clickSample(sampleNames[0]);

    // - Sample report displays "In Progress. Your Consensus Genome is being generated!" until completion
    const sampleStatusMessage = await samplesPage.getSampleStatusMessage(
      IN_PROGRESS,
    );

    expect(sampleStatusMessage).toEqual(IN_PROGRESS_MESSAGE);
    // #endregion 12. Click on Sample row and observe

    // #region 13. Go back to project and observe Sample status until it Completes
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);

    // At Project Sample view list:
    // - Sample statuses go from Created (grey) - Running (grey) - Complete (green)
    let samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      expect(samplesTable[sampleName]["Sample"][1]).toEqual("RUNNING");
    }

    if (WAIT_FOR_PIPELINE) {
      TEST_TIMEOUT = 60 * 1000 * 60;
      test.setTimeout(TEST_TIMEOUT);
      await projectPage.waitForSampleComplete(
        project.id,
        WORKFLOWS.WGS,
        sampleNames[sampleNames.length - 1],
      );
      await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
      await projectPage.waitForSampleComplete(
        project.id,
        WORKFLOWS.WGS,
        sampleNames[0],
      );
    } else {
      sampleNames = await projectPage.selectCompletedSamples(
        sampleNames.length,
      );
    }

    samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      expect(samplesTable[sampleName]["Sample"][1]).toEqual("COMPLETE");
    }
    // #endregion 13. Go back to project and observe Sample status until it Completes

    // #region 14. Hover over Reference Accession value in Sample View list
    // - Reference Accession reads:
    // MN908947.3 - Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome
    // Severe acute respiratory syndrome coronavirus 2
    for (const sampleName of sampleNames) {
      expect(samplesTable[sampleName][REFERENCE_ACCESSION]).toEqual(
        EXPECTED_REFERENCE_ACCESSION,
      );
    }
    // #endregion 14. Hover over Reference Accession value in Sample View list

    // #region 15. Click on (+) icon in Sample List column labels and add "Sequencing Platform", WETLAB_PROTOCOL, MEDAKA_MODEL metadata options
    await projectPage.selectPlusColumnOptions(PLUS_COLUMNS);
    // #endregion 15. Click on (+) icon in Sample List column labels and add "Sequencing Platform", WETLAB_PROTOCOL, MEDAKA_MODEL metadata options

    // #region 16. Observe new metadata column info added
    samplesTable = await projectPage.getSamplesTableOrderedByName();

    for (const sampleName of sampleNames) {
      // - Sequencing Platform metadata reads: Nanopore
      expect(samplesTable[sampleName][SEQUENCING_PLATFORM]).toEqual("Nanopore");
      // - Wetlab Protocol reads: Midnight
      expect(samplesTable[sampleName][WETLAB_PROTOCOL]).toEqual(
        wetLab.toUpperCase(),
      );
      // - Medaka Model reads: r941_prom_high_g330
      expect(samplesTable[sampleName][MEDAKA_MODEL]).toEqual(medakaModel);
    }
    // #endregion 16. Observe new metadata column info added
  });
});

/*
 * Sample upload (web) - SC2  Illumina
 * LINKS
 */
test.describe("Sample upload (web) - SC2  Illumina: Functional: P-1", () => {
  /*
   * Verify Sample upload process LINKS
   */
  test(`SNo SC2-2: Verify Sample upload process LINKS`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check ""SARS-CoV-2 Consensus Genome"" Analysis Type checkbox
    const project = await projectPage.getOrCreateProject("SNo_SC2-2");

    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.SC2);
    // #endregion 3. Select a project and check ""SARS-CoV-2 Consensus Genome"" Analysis Type checkbox

    // #region 4. Select ""Illumina"" radio button
    await uploadPage.clickSequencingPlatform(SEQUENCING_PLATFORMS.MNGS);
    // #endregion 4. Select ""Illumina"" radio button

    // #region 5. Cilck on Github ""here"" LINK
    let linkedPage = await uploadPage.clickGithubHereLink();

    // For Illumina option:
    // - Github ""here"" link opens Githbu new tab:
    // https://github.com/chanzuckerberg/czid-workflows/tree/main/workflows/consensus-genome
    expect(await linkedPage.url()).toEqual(
      "https://github.com/chanzuckerberg/czid-workflows/tree/main/workflows/consensus-genome",
    );
    await linkedPage.close();
    // #endregion 5. Cilck on Github ""here"" LINK

    // #region 6. Observe Pipeline Version
    let pipelineVersion = await uploadPage.getPipelineVersion();

    // - Pipeline version displays latest 3.X.X version
    expect(pipelineVersion).toMatch(/3.\d.\d/);
    // #endregion 6. Observe Pipeline Version

    // #region 7. Click on Learn More LINK
    linkedPage = await uploadPage.clickIlluminaLearnMoreLink();

    // - Learn More link opens Help Center new tab:
    // https://chanzuckerberg.zendesk.com/hc/en-us/articles/360059656311-Upload-Data-and-Assemble-SARS-CoV-2-Genomes-Using-the-Web-App
    expect(await linkedPage.url()).toEqual(
      "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360059656311-Upload-Data-and-Assemble-SARS-CoV-2-Genomes-Using-the-Web-App",
    );
    await linkedPage.close();
    // #endregion 7. Click on Learn More LINK

    // #region 8. Select ""Nanopore"" radio button
    await uploadPage.clickSequencingPlatform(WORKFLOWS.LMNGS);
    // #endregion 8. Select ""Nanopore"" radio button

    // #region 9. Click on Nanopore sequencing ""here"" LINK
    linkedPage = await uploadPage.clickArticNetworkLink();

    // For Nanopore option:
    // - Nanopore sequencing ""here"" link opens new tab:
    // https://artic.network/ncov-2019/ncov2019-bioinformatics-sop.html
    expect(await linkedPage.url()).toEqual(
      "https://artic.network/ncov-2019/ncov2019-bioinformatics-sop.html",
    );
    await linkedPage.close();
    // #endregion 9. Click on Nanopore sequencing ""here"" LINK

    // #region 10. Observe Pipeline Version
    pipelineVersion = await uploadPage.getPipelineVersion();

    // - Pipeline version displays latest 3.X.X version
    expect(pipelineVersion).toMatch(/3.\d.\d/);
    // #endregion 10. Observe Pipeline Version

    // #region 11. Click on Learn More LINK
    linkedPage = await uploadPage.clickNanoporeLearnMoreLink();

    // - Learn More link opens Help Center new tab:
    // https://chanzuckerberg.zendesk.com/hc/en-us/articles/360059656311-Upload-Data-and-Assemble-SARS-CoV-2-Genomes-Using-the-Web-App
    expect(await linkedPage.url()).toEqual(
      "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360059656311-Upload-Data-and-Assemble-SARS-CoV-2-Genomes-Using-the-Web-App",
    );
    await linkedPage.close();
    // #endregion 11. Click on Learn More LINK

    // #region 12. Hover over ""Used Clear Labs:"" information icon and click on Learn More LINK
    await uploadPage.hoverOverClearLabsInfoIcon();
    let columnTooltip = await uploadPage.getColumnTooltip();

    // For ""Used Clear Labs"" info icon
    // Information tooltip reads:
    // ""Pipeline will be adjusted to accomodate Clear Lab fastq files shich have undergone the length filtering and trimming steps. Learn More {LINK}""
    expect(columnTooltip).toEqual(
      "Pipeline will be adjusted to accomodate Clear Lab fastq files which have undergone the length filtering and trimming steps. Learn more.",
    );

    // - Learn more link opens ClearLabs new tab:
    // https://www.clearlabs.com/
    linkedPage = await uploadPage.clickClearHereLink();
    expect(await linkedPage.url()).toEqual("https://www.clearlabs.com/");
    await linkedPage.close();
    await uploadPage.pressEscape(); // closes tooltip
    // #endregion 12. Hover over ""Used Clear Labs:"" information icon and click on Learn More LINK

    // #region 13. Hover over ""Medaka Model:"" information icon and click on Learn More LINK
    await uploadPage.hoverOverMedakaModelInfoIcon();
    columnTooltip = await uploadPage.getColumnTooltip();

    // For ""Medaka Model"" info icon
    // Information tooltip reads:
    // ""For best results, specify the correct model. Where a version of Guppy has been used without a corresponding model, choose a model with the highest version equal to or less than the Guppy version. Learn more. {LINK}""
    expect(columnTooltip).toEqual(
      "For best results, specify the correct model. Where a version of Guppy has been used without a corresponding model, choose a model with the highest version equal to or less than the Guppy version. Learn more.",
    );

    // - Learn more link opens ClearLabs new tab:
    linkedPage = await uploadPage.clickMedakaModelHereLink();
    expect(await linkedPage.url()).toEqual(
      "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360059656311-Upload-Data-and-Assemble-SARS-CoV-2-Genomes-Using-the-Web-App",
    );
    // #endregion 13. Hover over ""Medaka Model:"" information icon and click on Learn More LINK
  });
});
