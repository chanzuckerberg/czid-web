import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  CONTINUE,
  WORKFLOWS,
  NUCLEOTIDES,
  FIXTURE_DIR,
  FIXTURE_METADATA_DIR,
  UPLOAD_METADATA,
  SEQUENCING_PLATFORMS,
} from "@e2e/constants/common";
import { expect } from "@playwright/test";
import { PageObject } from "./page-object";

const REF_FILENAME = "consensus_papilloma.fa";
const REF_FILE = `./fixtures/reference_sequences/${REF_FILENAME}`;

const SAMPLE_NAME_LOCATOR = "[class*='sampleUploadTable'] [role='gridcell'][title]";
const COOKIE_BANNER_LOCATOR = "[id='onetrust-accept-btn-handler']:visible";
const SEARCH_PROJECT_INPUT = 'input[placeholder="Search"]';
const UPLOAD_CONFIRMATION_TEXT = "[data-testid='drop-sample-files'] div[class*='title']";
const FILE_INPUT_SELECTOR = "[data-testid='drop-sample-files'] input";
const SEQUENCING_TECHNOLOGY_PARTIAL_TESTID = "sequencing-technology-";
const GUPPY_BASECALLER_SETTING_LOCATOR = "//div[text()='Guppy Basecaller Setting:']/following-sibling::div";
const GUPPY_BASECALLER_SETTING_OPTIONS_TESTIDS = {
  FAST: "fast",
  HAC: "hac",
  SUPER: "super",
};
const UPLOAD_TAXON_FILTER_TESTID = "upload-taxon-filter";
const CLEAR_UPLOADED_FILE_BUTTON_TESTID = "clear-uploaded-file-button";
const TAXON_FILTER_VALUE_TESTID = "filter-value";
const REFERENCE_SEQUENCE_FILE_UPLOAD_TESTID = "reference-sequence-file-upload";
const PORTAL_DROPDOWN_LOCATOR = "[class*='portalDropdown']";

// Metadata locators
const METADATA_FILENAMES_LOCATORS = "[class*='fileName']";
const METADATA_HOST_ORGANISM_TESTID = "host-organism";
const METADATA_SAMPLE_TYPE_TESTID = "sample_type";
const METADATA_WATER_CONTROL_TESTID = "water_control";
const METADATA_NUCLEOTIDE_TYPE_TESTID = "nucleotide_type";
const METADATA_COLLECTION_DATE_TESTID = "collection_date";
const METADATA_COLLECTION_LOCATION_TESTID = "collection_location_v2";
const METADATA_APPLY_TO_ALL_LOCATOR = "[class*='applyToAll']";

// Review locators
const REVIEW_FILENAMES_LOCATORS = "[data-testid='input-files'] [class*='file-']";
const REVIEW_HOST_ORGANISM_LOCATOR = "//span[text()='Sample Info']/parent::div/following-sibling::div//td[@data-testid='host-organism']";
const REVIEW_WATER_CONTROL_TESTID = "water-control";
const REVIEW_SAMPLE_TYPE_TESTID = "sample-type";
const REVIEW_NUCLEOTIDE_TYPE_TESTID = "nucleotide-type";
const REVIEW_COLLECTION_DATE_TESTID = "collection-date";
const REVIEW_COLLECTION_LOCATION_LOCATOR = "//div[contains(@class, 'reviewHeader')]//following-sibling::div//td[@data-testid='collection-location']";
const REVIEW_CSV_UPLOAD_TESTID = "csv-upload";
const REVIEW_CSV_FILE_INPUT_SELECTOR = "[class*='metadataCSVUpload'] [data-testid='drop-sample-files'] input";
const ANALYSIS_REVIEW_TESTID = "upload-input-review";
const PROJECT_INFO_REVIEW_LOCATOR = "//span[text()='Project Info']/parent::div/following-sibling::div[1]";
const TERMS_AGREEMENT_LOCATOR = "[class*='termsAgreement'] [class*='checkbox']";
const START_UPLOAD_BUTTON_LOCATOR = "//button[text()='Start Upload']";
const UPLOAD_COMPLETE = "Uploads completed!";

export class UploadPage extends PageObject {

  // #region Navigate
  public async goto() {
    await this.page.goto(`${process.env.BASEURL}/samples/upload`);
  }
  // #endregion Navigate

  // #region Api
  public async getOrCreateProject(projectName: string) {
    let project = await this.getProjects(projectName);
    if (project.length < 1) {
      const payload = {
        "project":{
          "name": projectName,
          "public_access": 1, // Public
          "description": "created by automation",
        },
      };
      await this.page.context().request.post(
        `${process.env.BASEURL}/projects.json`, {data: payload},
      );
      project = await this.getProjects(projectName);
    }
    return project.filter(p => p.name === projectName)[0];
  }

  public async getProjects(searchTerm: string) {
    const response = await this.page.context().request.get(
      `${process.env.BASEURL}/projects.json?search=${searchTerm}`,
    );
    const responseJson = await response.json();
    return responseJson.projects;
  }

  public async getAllHostGenomesPublic() {
    const response = await this.page.context().request.get(
      `${process.env.BASEURL}/host_genomes/index_public`,
    );
    return response.json();
  }

  public async getAllSampleTypes() {
    const response = await this.page.context().request.get(
      `${process.env.BASEURL}/sample_types.json`,
    );
    return response.json();
  }

  public async getPublicProjects() {
    const response = await this.page.context().request.get(
      `${process.env.BASEURL}/projects.json?domain=public`,
    );
    const responseJson = await response.json();
    return responseJson.projects;
  }
  // #endregion Api

  // #region Click

  // #region Samples
  public async clickSelectProject() {
    await this.page
      .getByText("Select project", { exact: true })
      .click({ timeout: 10000 });
  }

  public async clickCookieBanner() {
    await this.clickElement(COOKIE_BANNER_LOCATOR);
  }

  public async clickCheckboxForWorkflow(workflow: string) {
    (await this.getCheckboxForWorkflow(workflow.toLocaleLowerCase())).click();
  }

  public async clickProjectName(projectName: string) {
    await this.page.getByText(projectName, {exact: true}).click();
  }

  public async clickSequencingPlatform(platformName: string) {
    await this.page.getByTestId(`${SEQUENCING_TECHNOLOGY_PARTIAL_TESTID}${platformName}`).click();
  }

  public async clickGuppyBasecallerSettingDropDown() {
    await this.page.locator(GUPPY_BASECALLER_SETTING_LOCATOR).click();
  }

  public async clickGuppyBasecallerSettingOption(option: string) {
    const testId = GUPPY_BASECALLER_SETTING_OPTIONS_TESTIDS[option.toUpperCase()];
    await this.page.getByTestId(testId).click();
  }

  public async clickUploadTaxonFilter() {
    await this.page.getByTestId(UPLOAD_TAXON_FILTER_TESTID).click();
  }

  public async clickClearUploadedFile() {
    await this.page.getByTestId(CLEAR_UPLOADED_FILE_BUTTON_TESTID).getByTestId("ClearIcon").click();
  }

  public async clickTaxonFilter() {
    await this.page.getByTestId(TAXON_FILTER_VALUE_TESTID).last().click();
  }

  public async clickContinue() {
    await this.page.getByText(CONTINUE).last().click();
  }
  // #endregion Samples

  // #region Metadata
  public async clickHostOrganismDropDown(index = 0) {
    await this.page.getByTestId(METADATA_HOST_ORGANISM_TESTID).locator("input").nth(index).click();
  }

  public async clickSampleTissueTypeDropDown(index = 0) {
    await this.page.getByTestId(METADATA_SAMPLE_TYPE_TESTID).locator("input").nth(index).click();
  }

  public async clickApplyToAll() {
    await this.page.locator(METADATA_APPLY_TO_ALL_LOCATOR).click();
  }

  public async clickCSVUpload() {
    await this.page.getByTestId(REVIEW_CSV_UPLOAD_TESTID).click();
  }
  // #endregion Metadata

  // #region Review
  public async clickTermsAgreementCheckbox() {
    await this.page.locator(TERMS_AGREEMENT_LOCATOR).click();
  }

  public async clickStartUploadButton() {
    await this.page.locator(START_UPLOAD_BUTTON_LOCATOR).click();
  }
  // #endregion Review

  // #endregion Click

  // #region Get
  public async getCheckboxForWorkflow(workflow: string) {
    return this.page.getByTestId(`analysis-type-${workflow}`).locator("input");
  }

  public async getSampleName(index = 0) {
    return this.page.locator(SAMPLE_NAME_LOCATOR).nth(index).textContent();
  }

  public async getRandomizedSampleInputs(inputFiles: Array<string>, sampleName: string) {
    const inputs = [];
    inputs.push({
      sampleFile: sampleName,
      inputFiles: inputFiles,

      hostOrganism: await this.getRandomHostOrganism(),
      sampleTissueType: await this.getRandomSampleTissueType(),

      waterControl: ["Yes", "No"][Math.floor(Math.random() * 2)],
      nucleotideType: NUCLEOTIDES[Math.floor(Math.random() * NUCLEOTIDES.length)],
      collectionDate: new Date().toISOString().slice(0, 7), // YYYY-MM (BUG? front-end says YYYY-MM-DD)
      collectionLocation: ["New York", "Los Angeles"][Math.floor(Math.random() * 2)],
    });
    return inputs;
  }

  // #region Review
  public async getReviewInputFiles() {
    const inputFilesArray = [];
    await this.page.locator(REVIEW_FILENAMES_LOCATORS).first().waitFor({state: "visible"});
    const inputFiles = await this.page.locator(REVIEW_FILENAMES_LOCATORS).all();
    for (const attchedFile of inputFiles) {
      inputFilesArray.push(await attchedFile.textContent());
    }
    return inputFilesArray;
  }

  public async getReviewHostOrganismValue() {
    return this.page.locator(REVIEW_HOST_ORGANISM_LOCATOR).textContent();
  }

  public async getReviewSampleTissueTypeValue() {
    return this.page.getByTestId(REVIEW_SAMPLE_TYPE_TESTID).textContent();
  }

  public async getReviewWaterControlValue() {
    return this.page.getByTestId(REVIEW_WATER_CONTROL_TESTID).textContent();
  }

  public async getReviewNucleotideTypeValue() {
    return this.page.getByTestId(REVIEW_NUCLEOTIDE_TYPE_TESTID).textContent();
  }

  public async getReviewCollectionDateValue() {
    return this.page.getByTestId(REVIEW_COLLECTION_DATE_TESTID).textContent();
  }

  public async getReviewCollectionLocationValue() {
    return this.page.locator(REVIEW_COLLECTION_LOCATION_LOCATOR).textContent();
  }
  // #endregion Review

  // #region Metadata
  private async getPortalDropdownOptions() {
    const options = await this.page.locator(PORTAL_DROPDOWN_LOCATOR).locator("[class*='title']").all();
    const optionStringsArray = [];
    for (const option of options) {
        const text = await option.textContent();
        if (text.trim() !== "") {
          optionStringsArray.push(await option.textContent());
        }
    }
    return optionStringsArray;
  }

  public async getHostOrganismOptions() {
    await this.clickHostOrganismDropDown();

    const options = await this.getPortalDropdownOptions();

    await this.clickHostOrganismDropDown();
    return options;
  }

  public async getRandomHostOrganism() {
    const options = await this.getAllHostGenomesPublic();
    const option = options[Math.floor(Math.random() * options.length)];
    return option.name;
  }

  public async getSampleTissueTypeOptions() {
    await this.fillSampleTissueType(" ");
    await this.clickSampleTissueTypeDropDown();

    const options = await this.getPortalDropdownOptions();

    await this.clickSampleTissueTypeDropDown();
    return options;
  }

  public async getRandomSampleTissueType() {
    const options = await this.getAllSampleTypes();
    const option = options[Math.floor(Math.random() * options.length)];
    return option.name;
  }

  public async getAttachedInputFiles() {
    const attchedFilesArray = [];
    const attachedFiles = await this.page.locator(METADATA_FILENAMES_LOCATORS).all();
    for (const attchedFile of attachedFiles) {
        attchedFilesArray.push(await attchedFile.textContent());
    }
    return attchedFilesArray;
  }

  public async getMetadataHostOrganismValue(index = 0) {
    const element = this.page.getByTestId(METADATA_HOST_ORGANISM_TESTID).locator("input").nth(index);
    return element.getAttribute("value");
  }

  public async getMetadataSampleTissueTypeValue(index = 0) {
    const element = this.page.getByTestId(METADATA_SAMPLE_TYPE_TESTID).locator("input").nth(index);
    return element.getAttribute("value");
  }

  public async getMetadataWaterControlValue(index = 0) {
    return this.page.getByTestId(METADATA_WATER_CONTROL_TESTID).locator("label").nth(index).textContent();
  }

  public async getMetadataNucleotideTypeValue(index = 0) {
    return this.page.getByTestId(METADATA_NUCLEOTIDE_TYPE_TESTID).nth(index).textContent();
  }

  public async getMetadataCollectionDateValue(index = 0) {
    return this.page.getByTestId(METADATA_COLLECTION_DATE_TESTID).locator("input").nth(index).getAttribute("value");
  }

  public async getMetadataCollectionLocationValue(index = 0) {
    return this.page.getByTestId(METADATA_COLLECTION_LOCATION_TESTID).locator("input").nth(index).getAttribute("value");
  }
  // #endregion Metadata

  // #endregion Get

  // #region Fill
  public async fillProjectName(value: string) {
    await this.page.locator(SEARCH_PROJECT_INPUT).fill(value);
  }

  public async fillHostOrganism(value: string, index = 0) {
    await this.page.getByTestId(METADATA_HOST_ORGANISM_TESTID).locator("input").nth(index).fill(value);
  }

  public async fillSampleTissueType(value: string, index = 0) {
    await this.page.getByTestId(METADATA_SAMPLE_TYPE_TESTID).locator("input").nth(index).fill(value);
  }

  public async fillWaterControl(yesNo: string, index = 0) {
    const currentState = await this.page.getByTestId(METADATA_WATER_CONTROL_TESTID).locator("label").nth(index).textContent();
    if ((yesNo === "Yes") && (currentState !== "Yes") || (yesNo === "No") && (currentState !== "No")) {
      await this.page.getByTestId(METADATA_WATER_CONTROL_TESTID).nth(index).click();
    }
  }

  public async fillNucleotideType(value: string, index = 0) {
    await this.page.getByTestId(METADATA_NUCLEOTIDE_TYPE_TESTID).nth(index).click();
    await this.page.getByTestId(value.toLocaleLowerCase()).click();
  }

  public async fillCollectionDate(value: string, index = 0) {
    await this.page.getByTestId(METADATA_COLLECTION_DATE_TESTID).locator("input").nth(index).fill(value);
  }

  public async fillCollectionLocation(value: string, index = 0) {
    await this.page.getByTestId(METADATA_COLLECTION_LOCATION_TESTID).locator("input").nth(index).fill(value);
  }
  // #endregion Fill

  // #region Macro
  public async dismissCookieBanner() {
    const cookieBanner = await this.getLocator(COOKIE_BANNER_LOCATOR);
    if (await cookieBanner.count() > 0) {
      await this.clickCookieBanner();
    }
  }

  public async uploadRefSequence() {
    const [refSeqFileChooser] = await Promise.all([
      this.page.waitForEvent("filechooser"),
      this.page.getByTestId(REFERENCE_SEQUENCE_FILE_UPLOAD_TESTID).click(),
    ]);
    await this.pause(2);
    await refSeqFileChooser.setFiles(path.resolve(REF_FILE));
  };

  public async selectFiles(selector: string, filePath: string, files: string[]) {
    for (let i = 0; i < files.length; i++) {
      const fullPath = await path.join(filePath, files[i]);
      await this.page.setInputFiles(selector, fullPath);

      let confirmationText = "";
      if (files[i].endsWith("csv")) {
        confirmationText = `${files[i]} loaded`;
      } else {
        confirmationText = `${i + 1} File${i === 0? "": "s"} Selected For Upload`;
      }
      await this.page.locator(`text=${confirmationText}`).waitFor();
    };
  }

  public async selectProject(projectName: string) {
    await this.clickSelectProject();
    await this.fillProjectName(projectName);
    await this.clickProjectName(projectName);
  }

  public async uploadSampleFiles(sampleFiles: Array<string>) {
    await this.selectFiles(FILE_INPUT_SELECTOR, FIXTURE_DIR, sampleFiles);
  }

  public async uploadCSVMetaData(metadataFileName: string, inputs: any) {
    const templateFilePath = path.join(FIXTURE_METADATA_DIR, metadataFileName);
    const templateContent = await fs.readFile(templateFilePath, "utf8");

    const tempFileName = `${randomUUID()}_${metadataFileName}`;
    const tempFilePath = path.join(FIXTURE_METADATA_DIR, tempFileName);

    try {
      const csvContent = inputs.map(input => [
        input.sampleFile,
        input.hostOrganism,
        input.sampleTissueType,
        input.nucleotideType,
        input.collectionDate,
        input.waterControl,
        input.collectionLocation,
        ",,,,,,,,,,,,,,,,,",
      ].join(",")).join("\n");

      await fs.writeFile(tempFilePath, `${templateContent}\n${csvContent}\n`, "utf8");

      await this.selectFiles(REVIEW_CSV_FILE_INPUT_SELECTOR, FIXTURE_METADATA_DIR, [tempFileName]);

    } finally {
      fs.unlink(tempFilePath);
    }
  }

  public async setWorkFlow(analysisType: string) {
    if (analysisType === WORKFLOWS.MNGS) {
      // Illumina: Short read mNGS
      await this.clickCheckboxForWorkflow(analysisType);
      await this.clickSequencingPlatform(SEQUENCING_PLATFORMS.MNGS);
    }
    if (analysisType === WORKFLOWS.LMNGS) {
      // Nanopore: ONT (long read mNGS)
      await this.clickCheckboxForWorkflow(WORKFLOWS.MNGS);
      await this.clickSequencingPlatform(WORKFLOWS.LMNGS);

      await this.clickGuppyBasecallerSettingDropDown();
      await this.clickGuppyBasecallerSettingOption("fast");
    }
    if (analysisType === WORKFLOWS.AMR) {
      await this.clickCheckboxForWorkflow(analysisType);
    }
    if (analysisType === WORKFLOWS.WGS) {
      await this.clickCheckboxForWorkflow(analysisType);
      await this.setUploadTaxonFilter("Unknown");

      await this.uploadRefSequence();
    }
    if (analysisType === WORKFLOWS.SC2) {
      await this.clickCheckboxForWorkflow(analysisType);
      await this.clickSequencingPlatform(SEQUENCING_PLATFORMS.MNGS);

      await this.setTaxonFilter("VarSkip");
    }
    await this.pause(2); // Pause to stabilze test performance
  }

  public async setTaxonFilter(filterName: string) {
    await this.clickTaxonFilter();
    await this.page.getByText(filterName).click();
  }

  public async setUploadTaxonFilter(filterName: string) {
    await this.clickUploadTaxonFilter();
    await this.page.getByText(filterName).click();
  }

  public async setManualInputs(inputs: any)
  {
    for (let i = 0; i < inputs.length; i++) {
      await this.fillHostOrganism(inputs[i].hostOrganism, i);
      await this.fillSampleTissueType(inputs[i].sampleTissueType, i);
      await this.fillWaterControl(inputs[i].waterControl, i);
      await this.fillNucleotideType(inputs[i].nucleotideType, i);
      await this.fillCollectionDate(inputs[i].collectionDate, i);
      await this.fillCollectionLocation(inputs[i].collectionLocation, i);
    }
  }
  // #endregion Macro

  // #region Validation

  // #region Samples
  public async validateSampleUploadConfirmation(confirmationText: string) {
    await this.page.locator(`text=${confirmationText}`).waitFor({state: "visible", timeout: 30000});
    const actualConfirmationText = await this.page.locator(UPLOAD_CONFIRMATION_TEXT).textContent();

    expect(actualConfirmationText).toEqual(confirmationText);
  }

  public async validateAttachedInputFiles(sampleFiles: Array<string>) {
    expect(sampleFiles).toEqual(await this.getAttachedInputFiles());
  }

  public async validateSampleNames(sampleNames: Array<string>) {
    for (let i = 0; i < sampleNames.length; i++) {
      const sampleNameWithNumber = await this.getSampleName(i);
      expect(sampleNameWithNumber).toContain(sampleNames[i]);
    }
  }
  // #endregion Samples

  // #region Metadata
  public async validateUploadMetaDataVisible() {
    await expect(this.page.getByText(UPLOAD_METADATA)).toBeVisible({ timeout: 10000 });
  }

  public async validateManualInputsValues(inputs: any) {
    for (let i = 0; i < inputs.length; i++) {
      expect(inputs[i].hostOrganism).toEqual(await this.getMetadataHostOrganismValue(i));
      expect(inputs[i].sampleTissueType).toEqual(await this.getMetadataSampleTissueTypeValue(i));
      expect(inputs[i].waterControl).toEqual(await this.getMetadataWaterControlValue(i));
      expect(inputs[i].nucleotideType).toEqual(await this.getMetadataNucleotideTypeValue(i));
      expect(inputs[i].collectionDate).toEqual(await this.getMetadataCollectionDateValue(i));
      expect(inputs[i].collectionLocation).toEqual(await this.getMetadataCollectionLocationValue(i));
    }
  }
  // #endregion Metadata

  // #region Review
  public async validateProjectInfo(projectName: string, createdBy: string) {
    const projectInfo = this.page.locator(PROJECT_INFO_REVIEW_LOCATOR);
    await expect(projectInfo).toContainText(projectName);
    await expect(projectInfo).toContainText(`created by ${createdBy}`);
  }

  public async validateAnalysisInfo(sampleType: string) {
    const analysisReview = this.page.getByTestId(ANALYSIS_REVIEW_TESTID);
    let expectedResults = {};
    if (sampleType === WORKFLOWS.MNGS) {
      expectedResults = {
        "Sequencing Platform": "Illumina",
        "Analysis Type": "Metagenomics",
        "Pipeline Version": "8.3.0",
      };
    }
    else if (sampleType === WORKFLOWS.LMNGS) {
      expectedResults = {
        "Sequencing Platform": "Nanopore",
        "Analysis Type": "Metagenomics",
        "Guppy Basecaller Setting": "fast",
        "Pipeline Version": "0.7.5",
      };
    }
    else if (sampleType === WORKFLOWS.AMR) {
      expectedResults = {
        "Analysis Type": "Antimicrobial Resistance",
        "Pipeline Version": "1.3.2",
      };
    }
    else if (sampleType === WORKFLOWS.WGS) {
      expectedResults = {
        "Analysis Type": "Viral Consensus Genome",
        "Sequencing Platform": "Illumina",
        "Taxon Name": "unknown",
        "Reference Sequence": "consensus_papilloma.fa",
        "Trim Primer": "None provided",
        "Pipeline Version": "3.4.18",
      };
    }
    else if (sampleType === WORKFLOWS.SC2) {
      expectedResults = {
        "Analysis Type": "SARS-CoV-2 Consensus Genome",
        "Sequencing Platform": "Illumina",
        "Wetlab Protocol": "VarSkip",
        "Pipeline Version": "3.4.18",
      };
    }
    else {
        throw new Error(`Unsupported Sample Type: ${sampleType}`);
    }
    for (const analysis in expectedResults) {
      await expect(analysisReview).toContainText(expectedResults[analysis]);
    }
  }

  public async validateSampleInfo(inputs: Array<any>) {
    for (let i = 0; i < inputs.length; i++) {
      expect(inputs[i].inputFiles).toEqual(await this.getReviewInputFiles());
      expect(inputs[i].hostOrganism).toEqual(await this.getReviewHostOrganismValue());
      expect(inputs[i].sampleTissueType).toEqual(await this.getReviewSampleTissueTypeValue());
      expect(inputs[i].waterControl).toEqual(await this.getReviewWaterControlValue());
      expect(inputs[i].nucleotideType).toEqual(await this.getReviewNucleotideTypeValue());
      expect(inputs[i].collectionDate).toEqual(await this.getReviewCollectionDateValue());
      expect(inputs[i].collectionLocation).toEqual(await this.getReviewCollectionLocationValue());
    }
  }
  // #endregion Review

  // #endregion Validation

  // #region Wait
  public async waitForUploadComplete() {
    await this.page.getByText(UPLOAD_COMPLETE).waitFor();
  }
  // #endregion Wait
}