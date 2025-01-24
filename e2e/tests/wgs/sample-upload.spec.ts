import { WORKFLOWS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_NO_HOST_1,
  SAMPLE_FILE_NO_HOST_2,
} from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage, REF_FILENAME } from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

const COMPLETE_LITERAL = "COMPLETE";
const UPLOAD_COMPLETE_LITERAL = "Uploads completed!";
const REFERENCE_ACCESSION_LITERAL = "Reference Accession";
const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];

const TEST_TIMEOUT = 60 * 1000 * 60;
const UPLOAD_TIMEOUT = 60 * 1000 * 5;

/*
 * WGS - Sample upload
 * Local file
 */
test.describe("WGS - Sample upload | Functional: P-0", () => {
  test("SNo 1: Viral Consensus Genome - No trim", async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT); // Increase default timeout for reports to complete
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check "Viral Consensus Genome" Analysis Type checkbox
    const project = await projectPage.getOrCreateProject("Test_SNo_1");
    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.WGS);
    // #endregion 3. Select a project and check "Viral Consensus Genome" Analysis Type checkbox

    // #region 4. Select "Unkown" Taxon Name option
    await uploadPage.setUploadTaxonFilter("Unknown");
    // #endregion 4. Select "Unkown" Taxon Name option

    // #region 5. Select and upload a Reference Sequence file (see Data section)
    await uploadPage.uploadRefSequence(REF_FILENAME); // https://drive.google.com/drive/folders/1m3pRArWJSCjffMtm5oWD3EZ1OHKwmOu3?usp=sharing
    // #endregion 5. Select and upload a Reference Sequence file (see Data section)

    // #region 6. Select sample Input Files and click on Continue (see Data section)
    await uploadPage.uploadSampleFiles(WGS_SAMPLE_FILES, true, UPLOAD_TIMEOUT); // https://drive.google.com/drive/folders/1xldUUMAMGn5baDH-BfrTTASDmGsJkxhX?usp=sharing
    const sampleNames = await uploadPage.getSampleNames();
    await uploadPage.clickContinue();
    // #endregion 6. Select sample Input Files and click on Continue (see Data section)

    // #region 7. Enter required Metadata and click on Continue
    const inputs = await uploadPage.getRandomizedSampleInputs(
      WGS_SAMPLE_FILES,
      sampleNames,
    );
    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();
    // #endregion 7. Enter required Metadata and click on Continue

    // #region 8. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    /*
    Uploading screen displays with:
    - Upload progress bar(s) completed
    - Sent to Pipeline status displayed
    - Uploads completed! message displayed
    - Go to Project button enabled / displayed
    */
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

    // #region 10. Verify Samples Status and Reference Accession value once finished processing
    /*
    At Project Sample view list:
    - Sample uploads COMPLETE status (in green)
    - Reference Accession reads: (dashes)
    */
    const samplesPage = new SamplesPage(page);
    await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    const samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      const row = samplesTable[sampleName];
      expect(row["Sample"][1]).toEqual(COMPLETE_LITERAL);
      expect(row[REFERENCE_ACCESSION_LITERAL]).toEqual(["—", "—"]);
    }
    // #endregion 10. Verify Samples Status and Reference Accession value once finished processing
  });

  test("SNo 2: Viral Consensus Genome - with trim", async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT); // Increase default timeout for reports to complete
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check "Viral Consensus Genome" Analysis Type checkbox
    const project = await projectPage.getOrCreateProject("Test_SNo_2");
    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.WGS);
    // #endregion 3. Select a project and check "Viral Consensus Genome" Analysis Type checkbox

    // #region 4. Select "Betacoronavirus 1 (species)" Taxon Name option
    await uploadPage.setUploadTaxonFilter("Betacoronavirus 1 (species)");
    // #endregion 4. Select "Betacoronavirus 1 (species)" Taxon Name option

    // #region 5. Select and upload a Reference Sequence file (see Data section)
    await uploadPage.uploadRefSequence(REF_FILENAME); // https://drive.google.com/drive/folders/1m3pRArWJSCjffMtm5oWD3EZ1OHKwmOu3?usp=sharing
    // #endregion 5. Select and upload a Reference Sequence file (see Data section)

    // #region 6. Select and upload a Trim Primers file (see Data section)
    await uploadPage.uploadTrimPrimer("Primer_K.bed"); // https://drive.google.com/drive/folders/1G1fKG_Q66Zb890E_2203FnmTWwO3SDXW?usp=sharing
    // #endregion 6. Select and upload a Trim Primers file (see Data section)

    // #region 7. Select sample Input Files and click on Continue (see Data section)
    await uploadPage.uploadSampleFiles(WGS_SAMPLE_FILES, true, UPLOAD_TIMEOUT); // https://drive.google.com/drive/folders/1xldUUMAMGn5baDH-BfrTTASDmGsJkxhX?usp=sharing
    const sampleNames = await uploadPage.getSampleNames();
    await uploadPage.clickContinue();
    // #endregion 7. Select sample Input Files and click on Continue (see Data section)

    // #region 8. Enter required Metadata and click on Continue
    const inputs = await uploadPage.getRandomizedSampleInputs(
      WGS_SAMPLE_FILES,
      sampleNames,
    );
    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();
    // #endregion 8. Enter required Metadata and click on Continue

    // #region 9. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();

    /*
    Uploading screen displays with:
    - Upload progress bar(s) completed
    - Sent to Pipeline status displayed
    - Uploads completed! message displayed
    - Go to Project button enabled / displayed
    */
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

    // #region 11. Verify Samples Status and Reference Accession value once finished processing
    /*
    At Project Sample view list:
    - Sample uploads COMPLETE status (in green)
    - Reference Accession reads: (dash) + Betacoronavirus 1
    */
    const samplesPage = new SamplesPage(page);
    await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    const samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      const row = samplesTable[sampleName];
      expect(row["Sample"][1]).toEqual(COMPLETE_LITERAL);
      expect(row[REFERENCE_ACCESSION_LITERAL]).toEqual([
        "—",
        "Betacoronavirus 1",
      ]);
    }
    // #endregion 11. Verify Samples Status and Reference Accession value once finished processing
  });

  test("SNo 3: Viral Consensus Genome - No trim + mNGS - Ilumina", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT); // Increase default timeout for reports to complete
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check ""Metagenomics"" analysis type checkbox
    const project = await projectPage.getOrCreateProject("Test_SNo_3");
    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.MNGS);
    // #endregion 3. Select a project and check ""Metagenomics"" analysis type checkbox

    // #region 4. Select ""Illumina"" sequencing platform radio button
    await uploadPage.clickSequencingPlatform("Illumina");
    // #endregion 4. Select ""Illumina"" sequencing platform radio button

    // #region 5. Check ""Viral Consensus Genome"" Analysis Type checkbox
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.WGS);
    // #endregion 5. Check ""Viral Consensus Genome"" Analysis Type checkbox

    // #region 6. Select ""Unkown"" Taxon Name option
    await uploadPage.setUploadTaxonFilter("Unknown");
    // #endregion 6. Select ""Unkown"" Taxon Name option

    // #region 7. Select and upload a Reference Sequence file (see Data section)
    await uploadPage.uploadRefSequence(REF_FILENAME); // https://drive.google.com/drive/folders/1m3pRArWJSCjffMtm5oWD3EZ1OHKwmOu3?usp=sharing
    // #endregion 7. Select and upload a Reference Sequence file (see Data section)

    // #region 8. Select sample Input Files and click on Continue (see Data section)
    await uploadPage.uploadSampleFiles(WGS_SAMPLE_FILES, true, UPLOAD_TIMEOUT); // https://drive.google.com/drive/folders/1xldUUMAMGn5baDH-BfrTTASDmGsJkxhX?usp=sharing
    const sampleNames = await uploadPage.getSampleNames();
    await uploadPage.clickContinue();
    // #endregion 8. Select sample Input Files and click on Continue (see Data section)

    // #region 9. Enter required Metadata and click on Continue
    const inputs = await uploadPage.getRandomizedSampleInputs(
      WGS_SAMPLE_FILES,
      sampleNames,
    );
    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();
    // #endregion 9. Enter required Metadata and click on Continue

    // #region 10. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();

    /*
    Uploading screen displays with:
    - Upload progress bar(s) completed
    - Sent to Pipeline status displayed
    - Uploads completed! message displayed
    - Go to Project button enabled / displayed
    */
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

    // #region 12. Verify Samples Status and Reference Accession value once finished processing
    /*
    At Project Sample view list:
    - Sample uploads COMPLETE status (in green)
    - Reference Accession reads: (dashes)
    */
    const samplesPage = new SamplesPage(page);
    await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    const samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      const row = samplesTable[sampleName];
      expect(row["Sample"][1]).toEqual(COMPLETE_LITERAL);
      expect(row[REFERENCE_ACCESSION_LITERAL]).toEqual(["—", "—"]);
    }
    // #endregion 12. Verify Samples Status and Reference Accession value once finished processing
  });

  test("SNo 4: Viral Consensus Genome - with trim + mNGS - Ilumina", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT); // Increase default timeout for reports to complete
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check ""Metagenomics"" analysis type checkbox
    const project = await projectPage.getOrCreateProject("Test_SNo_4");
    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.MNGS);
    // #endregion 3. Select a project and check ""Metagenomics"" analysis type checkbox

    // #region 4. Select ""Illumina"" sequencing platform radio button
    await uploadPage.clickSequencingPlatform("Illumina");
    // #endregion 4. Select ""Illumina"" sequencing platform radio button

    // #region 5. Check ""Viral Consensus Genome"" Analysis Type checkbox
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.WGS);
    // #endregion 5. Check ""Viral Consensus Genome"" Analysis Type checkbox

    // #region 6. Select ""Betacoronavirus (genus)"" Taxon Name option
    await uploadPage.setUploadTaxonFilter("Betacoronavirus (genus)");
    // #endregion 6. Select ""Betacoronavirus (genus)"" Taxon Name option

    // #region 7. Select and upload a Reference Sequence file (see Data section)
    await uploadPage.uploadRefSequence(REF_FILENAME); // https://drive.google.com/drive/folders/1m3pRArWJSCjffMtm5oWD3EZ1OHKwmOu3?usp=sharing
    // #endregion 7. Select and upload a Reference Sequence file (see Data section)

    // #region 8. Select and upload a Trim Primers file (see Data section)
    await uploadPage.uploadTrimPrimer("Primer_K.bed"); // https://drive.google.com/drive/folders/1G1fKG_Q66Zb890E_2203FnmTWwO3SDXW?usp=sharing
    // #endregion 8. Select and upload a Trim Primers file (see Data section)

    // #region 9. Select sample Input Files and click on Continue (see Data section)
    await uploadPage.uploadSampleFiles(WGS_SAMPLE_FILES, true, UPLOAD_TIMEOUT); // https://drive.google.com/drive/folders/1xldUUMAMGn5baDH-BfrTTASDmGsJkxhX?usp=sharing
    const sampleNames = await uploadPage.getSampleNames();
    await uploadPage.clickContinue();
    // #endregion 9. Select sample Input Files and click on Continue (see Data section)

    // #region 10. Enter required Metadata and click on Continue
    const inputs = await uploadPage.getRandomizedSampleInputs(
      WGS_SAMPLE_FILES,
      sampleNames,
    );
    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();
    // #endregion 10. Enter required Metadata and click on Continue

    // #region 11. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();

    /*
    Uploading screen displays with:
    - Upload progress bar(s) completed
    - Sent to Pipeline status displayed
    - Uploads completed! message displayed
    - Go to Project button enabled / displayed
    */
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
    // #endregion 11. Check on Terms and Privacy policies checkbox and click Start Upload

    // #region 12. Click on Go to Project in Uploads completed! page
    await uploadPage.clickGoToProjectButton();
    // #endregion 12. Click on Go to Project in Uploads completed! page

    // #region 13. Verify Samples Status and Reference Accession value once finished processing

    /*
    At Project Sample view list:
    - Sample uploads COMPLETE status (in green)
    - Reference Accession reads: (dash) + Betacoronavirus
    */
    const samplesPage = new SamplesPage(page);
    await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    const samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      const row = samplesTable[sampleName];
      expect(row["Sample"][1]).toEqual(COMPLETE_LITERAL);
      expect(row[REFERENCE_ACCESSION_LITERAL]).toEqual([
        "—",
        "Betacoronavirus",
      ]);
    }
    // #endregion 13. Verify Samples Status and Reference Accession value once finished processing
  });
});
