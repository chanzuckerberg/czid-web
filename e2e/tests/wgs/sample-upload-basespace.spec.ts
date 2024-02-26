import { WORKFLOWS } from "@e2e/constants/common";
import { SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2 } from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage, REF_FILENAME, TRIM_PRIMER_FILENAME } from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const TEST_TIMEOUT = 60 * 1000 * 40;

const REFERENCE_ACCESSION = "Reference Accession";
const BASESPACE_PROJECT_NAME = "Mark Test Project";
const UPLOAD_STARTED = "We have started uploading your sample files from Basespace. After the upload is complete, your samples will automatically start processing.";
const EXPECTED_STATUS = "COMPLETE - ISSUE";

/*
 * WGS - Sample upload
 * Local file
 */
test.describe("WGS - Sample upload (web) Basespace project | Functional: P-0", () => {
  test.setTimeout(TEST_TIMEOUT); // Inclease default timeout for uploads to complete

  // https://czi-sci.slack.com/archives/C05NKGCD2E8/p1707934454896459?thread_ts=1706730894.886719&cid=C05NKGCD2E8
  test("SNo 5: Basespace Viral Consensus Genome - No trim", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check "Viral Consensus Genome" Analysis Type checkbox
    const project = await projectPage.getOrCreateProject("Test_SNo_5");
    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.WGS);
    // #endregion 3. Select a project and check "Viral Consensus Genome" Analysis Type checkbox

    // #region 4. Select ""Betacoronavirus 1 (species)"" Taxon Name option
    await uploadPage.setUploadTaxonFilter("Betacoronavirus 1 (species)");
    // #endregion 4. Select ""Betacoronavirus 1 (species)"" Taxon Name option

    // #region 5. Select and upload a Reference Sequence file (see Data section)
    await uploadPage.uploadRefSequence(REF_FILENAME);
    // #endregion 5. Select and upload a Reference Sequence file (see Data section)

    // #region 6. Go to Basespace Tab, connect to Basespace repository and select some samples
    await uploadPage.clickBasespaceButton();
    const illuminaPage = await uploadPage.clickConnectToBasespaceButton();
    // #endregion 6. Go to Basespace Tab, connect to Basespace repository and select some samples

    // #region 7. Click on Authorize
    await illuminaPage.authorize();

    await uploadPage.selectBasespaceProject(BASESPACE_PROJECT_NAME);
    await uploadPage.clickConnectToProject();
    // #endregion 7. Click on Authorize

    // #region 8. Enter required Metadata and click on Continue
    const sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(WGS_SAMPLE_FILES, sampleNames);
    await uploadPage.setManualInputs(inputs);

    await uploadPage.clickContinue();
    await uploadPage.pause(10); // stablizes test
    // #endregion 8. Enter required Metadata and click on Continue

    // #region 9. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForBasespaceUploadComplete();

    // Uploading screen displays with:
    // - (x) samples successfully created
    expect(await uploadPage.getBasespaceUploadWindowTitle()).toEqual(
      `${sampleNames.length} samples successfully created`);
    expect(await uploadPage.getBasespaceUploadWindowDescription()).toEqual(UPLOAD_STARTED);

    // - Go to Project button enabled / displayed
    expect(await uploadPage.isGoToProjectButtonEnabled()).toBeTruthy();
    // #endregion 9. Check on Terms and Privacy policies checkbox and click Start Upload

    // #region 10. Click on Go to Project in Uploads completed! page
    await uploadPage.clickGoToProjectButton();
    // #endregion 10. Click on Go to Project in Uploads completed! page

    // #region 11. Verify Samples Status and Reference Accession value once finished processing
    const samplesPage = new SamplesPage(page);
    await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
    await projectPage.waitForSamplesComplete(project.id, WORKFLOWS.WGS, sampleNames, TEST_TIMEOUT);

    // At Project Sample view list:
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // - Reference Accession reads: (dash) + Betacoronavirus 1 (species)
    const samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      expect(samplesTable[sampleName]["Sample"][1]).toEqual(EXPECTED_STATUS);
      expect(samplesTable[sampleName][REFERENCE_ACCESSION]).toEqual([ "—", "—" ]);
    }
    // #endregion 11. Verify Samples Status and Reference Accession value once finished processing
  });

  // https://czi-sci.slack.com/archives/C05NKGCD2E8/p1707934454896459?thread_ts=1706730894.886719&cid=C05NKGCD2E8
  test("SNo 6: Basespace Viral Consensus Genome - with trim", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check "Viral Consensus Genome" Analysis Type checkbox
    const project = await projectPage.getOrCreateProject("Test_SNo_6");
    const uploadPage = new UploadPage(page);
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.WGS);
    // #endregion 3. Select a project and check "Viral Consensus Genome" Analysis Type checkbox

    // #region 4. Select ""Unkown"" Taxon Name option
    await uploadPage.setUploadTaxonFilter("Unknown");
    // #endregion 4. Select ""Unkown"" Taxon Name option

    // #region 5. Select and upload a Reference Sequence file (see Data section)
    await uploadPage.uploadRefSequence(REF_FILENAME);
    // #endregion 5. Select and upload a Reference Sequence file (see Data section)

    // #region 6. Select and upload a Trim Primers file (see Data section)
    await uploadPage.uploadTrimPrimer(TRIM_PRIMER_FILENAME);
    // #endregion 6. Select and upload a Trim Primers file (see Data section)

    // #region 7. Go to Basespace Tab, connect to Basespace repository and select some samples
    await uploadPage.clickBasespaceButton();
    const illuminaPage = await uploadPage.clickConnectToBasespaceButton();
    // #endregion 7. Go to Basespace Tab, connect to Basespace repository and select some samples

    // #region 8. Click on Authorize
    await illuminaPage.authorize();

    await uploadPage.selectBasespaceProject(BASESPACE_PROJECT_NAME);
    await uploadPage.clickConnectToProject();
    // #endregion 8. Click on Authorize

    // #region 9. Enter required Metadata and click on Continue
    const sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(WGS_SAMPLE_FILES, sampleNames);
    await uploadPage.setManualInputs(inputs);

    await uploadPage.clickContinue();
    await uploadPage.pause(10); // stablizes test
    // #endregion 9. Enter required Metadata and click on Continue

    // #region 10. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForBasespaceUploadComplete();

    // Uploading screen displays with:
    // - (x) samples successfully created
    expect(await uploadPage.getBasespaceUploadWindowTitle()).toEqual(
      `${sampleNames.length} samples successfully created`);
    expect(await uploadPage.getBasespaceUploadWindowDescription()).toEqual(UPLOAD_STARTED);

    // - Go to Project button enabled / displayed
    expect(await uploadPage.isGoToProjectButtonEnabled()).toBeTruthy();
    // #endregion 10. Check on Terms and Privacy policies checkbox and click Start Upload

    // #region 11. Click on Go to Project in Uploads completed! page
    await uploadPage.clickGoToProjectButton();
    // #endregion 11. Click on Go to Project in Uploads completed! page

    // #region 12. Verify Samples Status and Reference Accession value once finished processing
    const samplesPage = new SamplesPage(page);
    await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
    await projectPage.waitForSamplesComplete(project.id, WORKFLOWS.WGS, sampleNames, TEST_TIMEOUT);

    // At Project Sample view list:
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    const samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      // - Sample uploads COMPLETE status (in green)
      expect(samplesTable[sampleName]["Sample"][1]).toEqual(EXPECTED_STATUS);
      // - Reference Accession reads: (dashes)
      expect(samplesTable[sampleName][REFERENCE_ACCESSION]).toEqual([ "—", "—" ]);
    }
    // #endregion 12. Verify Samples Status and Reference Accession value once finished processing
  });

  // https://czi-sci.slack.com/archives/C05NKGCD2E8/p1707934454896459?thread_ts=1706730894.886719&cid=C05NKGCD2E8
  test("SNo 7: Basespace Viral Consensus Genome - No trim + mNGS - Ilumina", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check ""Metagenomics"" analysis type checkbox
    const project = await projectPage.getOrCreateProject("Test_SNo_7");
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

    // #region 8. Go to Basespace Tab, connect to Basespace repository and select some samples
    await uploadPage.clickBasespaceButton();
    const illuminaPage = await uploadPage.clickConnectToBasespaceButton();
    // #endregion 8. Go to Basespace Tab, connect to Basespace repository and select some samples

    // #region 9. Click on Authorize
    await illuminaPage.authorize();

    await uploadPage.selectBasespaceProject(BASESPACE_PROJECT_NAME);
    await uploadPage.clickConnectToProject();
    // #endregion 9. Click on Authorize

    // #region 10. Enter required Metadata and click on Continue
    const sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(WGS_SAMPLE_FILES, sampleNames);
    await uploadPage.setManualInputs(inputs);

    await uploadPage.clickContinue();
    await uploadPage.pause(10); // stablizes test
    // #endregion 10. Enter required Metadata and click on Continue

    // #region 11. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForBasespaceUploadComplete();

    // Uploading screen displays with:
    // - (x) samples successfully created
    expect(await uploadPage.getBasespaceUploadWindowTitle()).toEqual(
      `${sampleNames.length} samples successfully created`);
    expect(await uploadPage.getBasespaceUploadWindowDescription()).toEqual(UPLOAD_STARTED);

    // - Go to Project button enabled / displayed
    expect(await uploadPage.isGoToProjectButtonEnabled()).toBeTruthy();
    // #endregion 11. Check on Terms and Privacy policies checkbox and click Start Upload

    // #region 12. Click on Go to Project in Uploads completed! page
    await uploadPage.clickGoToProjectButton();
    // #endregion 12. Click on Go to Project in Uploads completed! page

    // #region 13. Verify Samples Status and Reference Accession value once finished processing
    const samplesPage = new SamplesPage(page);
    await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
    await projectPage.waitForSamplesComplete(project.id, WORKFLOWS.WGS, sampleNames, TEST_TIMEOUT);

    // At Project Sample view list:
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    const samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      // - Sample uploads COMPLETE status (in green)
      expect(samplesTable[sampleName]["Sample"][1]).toEqual(EXPECTED_STATUS);
      // - Reference Accession reads: (dash) + Betacoronavirus (genus)
      expect(samplesTable[sampleName][REFERENCE_ACCESSION]).toEqual([ "—", "—" ]);
    }
    // #endregion 13. Verify Samples Status and Reference Accession value once finished processing
  });

  // https://czi-sci.slack.com/archives/C05NKGCD2E8/p1707934454896459?thread_ts=1706730894.886719&cid=C05NKGCD2E8
  test("SNo 8: Basespace Viral Consensus Genome - with trim + mNGS - Ilumina", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Upload
    await projectPage.clickUploadHeaderLink();
    // #endregion 2. Click on Upload

    // #region 3. Select a project and check ""Metagenomics"" analysis type checkbox
    const project = await projectPage.getOrCreateProject("Test_SNo_8");
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

    // #region 8. Select and upload a Trim Primers file (see Data section)
    await uploadPage.uploadTrimPrimer(TRIM_PRIMER_FILENAME);
    // #endregion 8. Select and upload a Trim Primers file (see Data section)

    // #region 9. Go to Basespace Tab, connect to Basespace repository and select some samples
    await uploadPage.clickBasespaceButton();
    const illuminaPage = await uploadPage.clickConnectToBasespaceButton();
    // #endregion 9. Go to Basespace Tab, connect to Basespace repository and select some samples

    // #region 10. Click on Authorize
    await illuminaPage.authorize();

    await uploadPage.selectBasespaceProject(BASESPACE_PROJECT_NAME);
    await uploadPage.clickConnectToProject();
    // #endregion 10. Click on Authorize

    // #region 11. Enter required Metadata and click on Continue
    const sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(WGS_SAMPLE_FILES, sampleNames);
    await uploadPage.setManualInputs(inputs);

    await uploadPage.clickContinue();
    await uploadPage.pause(10); // stablizes test
    // #endregion 11. Enter required Metadata and click on Continue

    // #region 12. Check on Terms and Privacy policies checkbox and click Start Upload
    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForBasespaceUploadComplete();

    // Uploading screen displays with:
    // - (x) samples successfully created
    expect(await uploadPage.getBasespaceUploadWindowTitle()).toEqual(
      `${sampleNames.length} samples successfully created`);
    expect(await uploadPage.getBasespaceUploadWindowDescription()).toEqual(UPLOAD_STARTED);

    // - Go to Project button enabled / displayed
    expect(await uploadPage.isGoToProjectButtonEnabled()).toBeTruthy();
    // #endregion 12. Check on Terms and Privacy policies checkbox and click Start Upload

    // #region 13. Click on Go to Project in Uploads completed! page
    await uploadPage.clickGoToProjectButton();
    // #endregion 13. Click on Go to Project in Uploads completed! page

    // #region 14. Verify Samples Status and Reference Accession value once finished processing
    const samplesPage = new SamplesPage(page);
    await samplesPage.waitForAllReportsComplete(project.name, sampleNames);
    await projectPage.waitForSamplesComplete(project.id, WORKFLOWS.WGS, sampleNames, TEST_TIMEOUT);

    // At Project Sample view list:
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    const samplesTable = await projectPage.getSamplesTableOrderedByName();
    for (const sampleName of sampleNames) {
      // - Sample uploads COMPLETE status (in green)
      expect(samplesTable[sampleName]["Sample"][1]).toEqual(EXPECTED_STATUS);
    // - Reference Accession reads: (dashes)"
      expect(samplesTable[sampleName][REFERENCE_ACCESSION]).toEqual([ "—", "—" ]);
    }
    // #endregion 14. Verify Samples Status and Reference Accession value once finished processing
  });

});
