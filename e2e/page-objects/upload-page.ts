import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import * as path from "path";
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
import { IlluminaPage } from "./illumina-page";
import { PageObject } from "./page-object";

const ERRORS = "[class*='errors']";
const CONSENSUS_GENOME_PIPELINE_MAJOR_VERSION = "3";
export const SARS_COV2_REF_FILENAME = "wgs_SARS_CoV2_reference.fa";
export const SARS_COV2_TRIM_PRIMER_FILENAME = "wgs_SARS_CoV2_primers_regions.bed";
export const REF_FILENAME = "consensus_TEST_SC2.fa";
export const TRIM_PRIMER_FILENAME = "Primer_K.bed";
export const WETLAB_PROTOCOL = "ARTIC v4/ARTIC v4.1";
const REF_FILE = (refFilename: string) => `./fixtures/reference_sequences/${refFilename}`;
const TRIM_PRIMER_FILE = (trimPrimerFilename: string) => `./fixtures/trim_primers/${trimPrimerFilename}`;
const METADATA_FILE_NAME = "metadata_template.csv";

// Upload Samples
const SELECTED_SAMPLES = "//*[contains(@class, 'sampleUploadTable')]//*[@data-testid='check-box']/ancestor::*[@role='gridcell']/following-sibling::*[1]";
const PIPELINE_VERSION = "[class*='technologyContent'] [class*='version']";
const ILLUMINA_LEARN_MORE_LINK = "//*[text()='Learn More' and @href]";
const GITHUB_HERE_LINK = "[href*='github.com/chanzuckerberg']";
const CLEAR_HERE_LINK = "[href*='clearlabs']";
const ARTIC_NETWORK_LINK = "[href*='artic.network']";
const NANOPORE_LEARN_MORE_LINK = "//*[contains(@href, 'chanzuckerberg.zendesk') and text()='Learn More']";
const SELECT_BASESPACE_PROJECT_DROPDOWN = "[class*='basespaceSampleImport'] [class*='dropdownTrigger']";
const SELECT_BASESPACE_PROJECT_OPTIONS = "[class*='basespaceSampleImport'] [role*='option']";
const BASESPACE_UPLOAD_WINDOW_TITLE = "[class*='titleWithIcon']";
const BASESPACE_UPLOAD_WINDOW_DESCRIPTION = "[class*='instructions']";
const BASESPACE_AUTHORIZE = "//button[text()='Authorize']";
const BASESPACE_CONNECT_TO_PROJECT = "//button[text()='Connect to Project']";
const BASESPACE_BUTTON = "[data-testid='basespace']";
const CONNECT_TO_BASESPACE_BUTTON = "//button[text()='Connect to Basespace']";
const CONTINUE_BUTTON = "//button[text()='Continue']";
const ROW_FILENAMES = "[aria-label='row'] [class*='fileName'] ";
const FILE_ERROR_INFO_ICON = "[class*='fileName'] svg";
const COLUMN_TOOLTIP = "[data-testid='column-tooltip']";
const COLUMN_TOOLTIP_LINK = "[data-testid='column-tooltip'] a";
const FILE_INPUT_SELECTOR = "[data-testid='drop-sample-files'] input";
const SAMPLE_NAME_LOCATOR = "[class*='sampleUploadTable'] [role='gridcell'][title]";
const COOKIE_BANNER_LOCATOR = "[id='onetrust-accept-btn-handler']:visible";
const SEARCH_PROJECT_INPUT = 'input[placeholder="Search"]';
const UPLOAD_CONFIRMATION_TEXT = "[data-testid='drop-sample-files'] div[class*='title']";
const SEQUENCING_TECHNOLOGY_PARTIAL_TESTID = "sequencing-technology-";
const GUPPY_BASECALLER_SETTING_LOCATOR = "//div[text()='Guppy Basecaller Setting:']/following-sibling::div";
const GUPPY_BASECALLER_SETTING_OPTIONS_TESTIDS = {
  FAST: "fast",
  HAC: "hac",
  SUPER: "super",
};
const UPLOAD_TAXON_FILTER_TESTID = "upload-taxon-filter";
const UPLOAD_TAXON_FILTER_INPUT = "[class*='FormControl'] input[type='search']";
const CLEAR_UPLOADED_FILE_BUTTON_TESTID = "clear-uploaded-file-button";
const CLEAR_LABS_TOGGLE = "[class*='clearLabs'] [class*='checkbox']";
const CLEAR_LABS_INFO_ICON = "[class*='clearLabs'] [class*='subheader'] svg";
const TAXON_FILTER_VALUE_TESTID = "filter-value";
const WETLAB_FILTER = "//*[text()='Wetlab Protocol:']/following-sibling::*//*[@data-testid='filters']";
const WETLAB_FILTER_VALUE = "//*[text()='Wetlab Protocol:']/following-sibling::*//*[@data-testid='filters']//*[@data-testid='filter-value']";
const WETLAB_OPTION = (wetlab: string) =>`//*[@data-testid="dropdown-menu"]//*[@role="option" and text()="${wetlab}"]`;
const WETLAB_OPTIONS = "//*[text()='Wetlab Protocol:']/following-sibling::*//*[@data-testid='dropdown-menu']//*[@role='option']";
const WETLAB_DESCRIPTION = "//*[text()='Wetlab Protocol:']/following-sibling::*[contains(@class, 'description')]";
const MEDAKA_MODEL_FILTER = "//*[text()='Medaka Model:']/parent::*//*[@data-testid='filters']";
const MEDAKA_MODEL_INFO_ICON = "//*[text()='Medaka Model:']/span";
const MEDAKA_MODEL_OPTION = (medakaModel: string) => `//*[text()='Medaka Model:']/parent::*//*[contains(@class, 'optionText') and text()='${medakaModel}']`;
const MEDAKA_MODEL_OPTIONS = "//*[text()='Medaka Model:']/parent::*//*[contains(@class, 'optionText')]";
const MEDAKA_MODEL_DESCRIPTION = "//*[text()='Medaka Model:']/following-sibling::*[contains(@class, 'description')]";
const REFERENCE_SEQUENCE_FILE_UPLOAD_TESTID = "reference-sequence-file-upload";
const TRIM_PRIMERS_FILE_UPLOAD = "//span[text()='Trim Primers']/parent::div/following-sibling::button";
const PORTAL_DROPDOWN_LOCATOR = "[class*='portalDropdown']";
const NANOPORE_TECHNOLOGY_DESCRIPTION = "[data-testid='sequencing-technology-ONT'] [class*='technologyDescription']";

// #region Metadata locators
const METADATA_SAMPLE_NAMES = "[data-testid='sample-name']";
const METADATA_FILENAMES_LOCATORS = "[class*='fileName']";
const METADATA_HOST_ORGANISM_TESTID = "host-organism";
const METADATA_SAMPLE_TYPE_TESTID = "sample_type";
const METADATA_WATER_CONTROL_TESTID = "water_control";
const METADATA_NUCLEOTIDE_TYPE_TESTID = "nucleotide_type";
const METADATA_COLLECTION_DATE_TESTID = "collection_date";
const METADATA_COLLECTION_LOCATION_TESTID = "collection_location_v2";
const METADATA_APPLY_TO_ALL_LOCATOR = "[class*='applyToAll']";
// #endregion Metadata locators

// #region Review locators
const REVIEW_SAMPLE_NAMES = "[class*='visible'] [data-testid='sample-name']";
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
// #endregion Review locators

// #region Uploads completed
const UPLOAD_COMPLETE = "Uploads completed!";
const SENT_TO_PIPELINE = (sampleName: string) => `//div[contains(@class, 'sampleName-') and text()='${sampleName}']/following-sibling::div[contains(@class, 'sampleStatus')]/div[text()='Sent to pipeline']`;
const UPLOAD_WINDOW_TITLE = "[class*='titleWithIcon-']";
const GO_TO_PROJECT_BUTTON = "//button[text()='Go to Project']";
const SAMPLE_UPLOAD_STATUS_BAR = (sampleName: string) => `//div[contains(@class, 'sampleName-') and text()='${sampleName}']/ancestor::div[contains(@class, 'sample-')]//div[contains(@class, 'loadingBar-')]`;
const LOADING_BARS = "//div[contains(@class, 'sample-')]//div[contains(@class, 'loadingBar-')]";
// #endregion Uploads completed

type basespaceOptions = {
  taxonName?: string;
  sampleNames?: Array<string>;
  waitForUploadComplete?: boolean;
};

export class UploadPage extends PageObject {

  // #region Navigate
  public async goto() {
    await this.page.goto(`${process.env.BASEURL}/samples/upload`);
  }
  // #endregion Navigate

  // #region Api
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
  // #endregion Api

  // #region Click

  // #region Samples
  public async clickSamples(sampleNames: Array<string>) {
    for (const sampleName of sampleNames) {
      await this.page.locator(SELECTED_SAMPLES).getByText(sampleName, {exact: true}).click();
    }
  }

  public async clickMedakaModelHereLink() {
    return this.clickOutsidePage(COLUMN_TOOLTIP_LINK);
  }

  public async clickClearHereLink() {
    return this.clickOutsidePage(CLEAR_HERE_LINK);
  }

  public async clickNanoporeLearnMoreLink() {
    return this.clickOutsidePage(NANOPORE_LEARN_MORE_LINK);
  }

  public async clickArticNetworkLink() {
    return this.clickOutsidePage(ARTIC_NETWORK_LINK);
  }

  public async clickIlluminaLearnMoreLink() {
    return this.clickOutsidePage(ILLUMINA_LEARN_MORE_LINK);
  }

  public async clickGithubHereLink() {
    return this.clickOutsidePage(GITHUB_HERE_LINK);
  }

  public async clickSelectBasespaceProjectDropdown() {
    await this.page.locator(SELECT_BASESPACE_PROJECT_DROPDOWN).click();
  }

  public async clickSelectBasespaceProjectOption(option: string) {
    await this.page.locator(SELECT_BASESPACE_PROJECT_OPTIONS).getByText(option, {exact: true}).click();
  }

  public async clickConnectToBasespaceButton() {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      await this.page.locator(CONNECT_TO_BASESPACE_BUTTON).click(),
    ]);
    await newPage.waitForLoadState();
    return new IlluminaPage(newPage);
  }

  public async clickAuthorize() {
    await this.page.locator(BASESPACE_AUTHORIZE).waitFor({timeout: 90_000});
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      await this.page.locator(BASESPACE_AUTHORIZE).click(),
    ]);
    await newPage.waitForLoadState();
    return new IlluminaPage(newPage);
  }

  public async clickConnectToProject() {
    await this.pause(4);
    await this.page.locator(BASESPACE_CONNECT_TO_PROJECT).click();
  }

  public async clickAuthorizeIllumina() {
    const illuminaPage = await this.clickAuthorize();
    await illuminaPage.clickCloseWindowButton();
  }

  public async clickBasespaceButton() {
    await this.page.locator(BASESPACE_BUTTON).click();
  }

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

  public async clickClearLabsToggle(option: "Yes" | "No") {
    const value = await this.getClearLabsValue();
    if (value !== option) {
      await this.page.locator(CLEAR_LABS_TOGGLE).click();
    }
  }

  public async clickClearUploadedFile() {
    await this.page.getByTestId(CLEAR_UPLOADED_FILE_BUTTON_TESTID).getByTestId("ClearIcon").click();
  }

  public async clickTaxonFilter() {
    await this.page.getByTestId(TAXON_FILTER_VALUE_TESTID).last().click();
  }

  public async clickContinue() {
    await this.pause(3);
    await this.page.getByText(CONTINUE).last().click();
  }
  // #endregion Samples

  // #region Metadata
  public async hoverOverMedakaModelInfoIcon(index = 0) {
    await this.page.locator(MEDAKA_MODEL_INFO_ICON).nth(index).hover();
  }

  public async hoverOverClearLabsInfoIcon(index = 0) {
    await this.page.locator(CLEAR_LABS_INFO_ICON).nth(index).hover();
  }

  public async hoverOverFileErrorIcon(index = 0) {
    await this.page.locator(FILE_ERROR_INFO_ICON).nth(index).hover();
  }

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

  public async clickGoToProjectButton() {
    await this.page.locator(GO_TO_PROJECT_BUTTON).click();
    await this.pause(4);
  }

  // #endregion Click

  // #region Get
  public async getSelectedSamples() {
    await this.page.locator(SELECTED_SAMPLES).first().waitFor();
    return this.page.locator(SELECTED_SAMPLES).allTextContents();
  }

  public async getPipelineVersion() {
    return this.page.locator(PIPELINE_VERSION).textContent();
  }

  public async getNanoporeTechnologyDescription() {
    return this.page.locator(NANOPORE_TECHNOLOGY_DESCRIPTION).textContent();
  }

  public async getWetLabFilterValue() {
    return this.page.locator(WETLAB_FILTER_VALUE).textContent();
  }

  public async getWetlabOptions() {
    return this.page.locator(WETLAB_OPTIONS).allTextContents();
  }

  public async getMedakaModelFilterOptions() {
    return this.page.locator(MEDAKA_MODEL_OPTIONS).allTextContents();
  }

  public async getMedakaModelFilterValue() {
    return this.page.locator(MEDAKA_MODEL_FILTER).locator("[data-testid='filter-value']").textContent();
  }

  public async getClearLabsValue() {
    return this.page.locator(CLEAR_LABS_TOGGLE).textContent();
  }

  public async getMedakaModelDescription() {
    return this.page.locator(MEDAKA_MODEL_DESCRIPTION).textContent();
  }

  public async getWetlabDescription() {
    return this.page.locator(WETLAB_DESCRIPTION).textContent();
  }

  public async getBasespaceUploadWindowTitle() {
    return this.page.locator(BASESPACE_UPLOAD_WINDOW_TITLE).textContent();
  }

  public async getBasespaceUploadWindowDescription() {
    return this.page.locator(BASESPACE_UPLOAD_WINDOW_DESCRIPTION).textContent();
  }

  public async getSampleUploadProgress(sampleName: string) {
    const styleAttribute = await this.page.locator(SAMPLE_UPLOAD_STATUS_BAR(sampleName)).getAttribute("style");
    let uploadProgress = 0;
    if (styleAttribute) {
      const match = styleAttribute.match(/(\d+(\.\d+)?)/);
      uploadProgress = match ? parseFloat(match[0]) : uploadProgress;
    }
    return uploadProgress;
  }

  public async getUploadWindowTitle() {
    return this.page.locator(UPLOAD_WINDOW_TITLE).textContent();
  }

  public async getColumnTooltip() {
    return this.page.locator(COLUMN_TOOLTIP).textContent();
  }

  public async getWarningTable() {
    const warning = await this.page.locator("[class*='issueGroup'][class*='warning'] [class*='header-']:not([class*='toggleable'])").textContent();
    await this.page.locator("[class*='issueGroup'][class*='warning'] [class*='toggleContainer']").click();
    const table = await this.getTable(
      "[class*='issueGroup'][class*='warning'] th",
      "[class*='issueGroup'][class*='warning'] tbody tr",
      "td",
    );
    const warningLines = warning.split("\n");
    for (let i = 0; i < warningLines.length; i++) {
      warningLines[i] = warningLines[i].trim();
    }

    return {
      "message": warningLines.join(" "),
      "files": table,
    };
  }

  public async getErrorTable() {
    const error = await this.page.locator("[class*='issueGroup'][class*='error'] [class*='header-']:not([class*='toggleable'])").textContent();
    await this.page.locator("[class*='issueGroup'][class*='error'] [class*='toggleContainer']").click();
    const table = await this.getTable(
      "[class*='issueGroup'][class*='error'] th",
      "[class*='issueGroup'][class*='error'] tbody tr",
      "td",
    );
    return {
      "message": error.trim(),
      "files": table,
    };
  }

  public async getErrors(timeout = 1000) {
    await this.page.locator(ERRORS).first().waitFor({ timeout: timeout }) .catch(() => null);
    return this.page.locator(ERRORS).allTextContents();
  }

  public async getCheckboxForWorkflow(workflow: string) {
    return this.page.getByTestId(`analysis-type-${workflow}`).locator("input");
  }

  public async getSampleNames() {
    return this.page.locator(SAMPLE_NAME_LOCATOR).allTextContents();
  }

  public async getSampleName(index = 0) {
    return this.page.locator(SAMPLE_NAME_LOCATOR).nth(index).textContent();
  }

  public async getRandomizedSampleInputs(inputFiles: Array<string>, sampleNames: Array<string>) {
    const inputs = {};
    for (let i = 0; i < sampleNames.length; i++) {
      inputs[sampleNames[i]] = {
        sampleFile: sampleNames[i],
        inputFile: inputFiles[i],
        inputFiles: inputFiles, // TODO: Remove?

        hostOrganism: [await this.getRandomHostOrganism(), "Human"][Math.floor(Math.random() * 2)], // More Human samples
        sampleTissueType: await this.getRandomSampleTissueType(),

        waterControl: ["Yes", "No"][Math.floor(Math.random() * 2)],
        nucleotideType: NUCLEOTIDES[Math.floor(Math.random() * NUCLEOTIDES.length)],
        collectionDate: new Date().toISOString().slice(0, 7), // YYYY-MM (BUG? front-end says YYYY-MM-DD)
        collectionLocation: ["New York", "Los Angeles"][Math.floor(Math.random() * 2)],
      };
    }
    return inputs;
  }

  // #region Review
  public async getReviewSampleNames() {
    await this.page.locator(REVIEW_SAMPLE_NAMES).first().waitFor();
    return this.page.locator(REVIEW_SAMPLE_NAMES).allInnerTexts();
  }

  public async getReviewInputFiles(index = 0) {
    return this.page.locator(REVIEW_FILENAMES_LOCATORS).nth(index).textContent();
  }

  public async getReviewHostOrganismValue(index = 0) {
    return (await this.page.locator(REVIEW_HOST_ORGANISM_LOCATOR).all())[index].textContent();
  }

  public async getReviewSampleTissueTypeValue(index = 0) {
    return this.page.getByTestId(REVIEW_SAMPLE_TYPE_TESTID).nth(index).textContent();
  }

  public async getReviewWaterControlValue(index = 0) {
    return this.page.getByTestId(REVIEW_WATER_CONTROL_TESTID).nth(index).textContent();
  }

  public async getReviewNucleotideTypeValue(index = 0) {
    return this.page.getByTestId(REVIEW_NUCLEOTIDE_TYPE_TESTID).nth(index).textContent();
  }

  public async getReviewCollectionDateValue(index = 0) {
    return this.page.getByTestId(REVIEW_COLLECTION_DATE_TESTID).nth(index).textContent();
  }

  public async getReviewCollectionLocationValue(index = 0) {
    return this.page.locator(REVIEW_COLLECTION_LOCATION_LOCATOR).nth(index).textContent();
  }
  // #endregion Review

  // #region Metadata
  public async getMetadataSampleNames() {
    await this.page.locator(METADATA_SAMPLE_NAMES).first().waitFor();
    return this.page.locator(METADATA_SAMPLE_NAMES).allTextContents();
  }

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
  public async uploadBasespaceSample(projectName: string, basespaceProjectName: string, workflow: string, options?: basespaceOptions) {
    options = options || {};

    await this.goto();
    await this.selectProject(projectName);
    const taxonName = options.taxonName ? options.taxonName : "Unknown";
    await this.setWorkFlow(workflow, true, taxonName);
    await this.clickBasespaceButton();

    const illuminaPage = await this.clickConnectToBasespaceButton();
    if (await illuminaPage.isAuthorized()) {
      await illuminaPage.clickCloseWindowButton();
    } else {
      await illuminaPage.authorize();
    }

    await this.selectBasespaceProject(basespaceProjectName);
    await this.clickConnectToProject();
    
    let sampleNames = [];
    if (!options.sampleNames) {
      const selectedSamples = await this.getSelectedSamples();
      sampleNames = selectedSamples.slice(0, 2);
    } else {
      sampleNames = options.sampleNames;
    }
    await this.clickSamples(sampleNames);
    await this.clickAuthorizeIllumina();

    sampleNames = await this.getMetadataSampleNames();
    const inputs = await this.getRandomizedSampleInputs(sampleNames, sampleNames);
    await this.setManualInputs(inputs);

    await this.clickContinue();
    await this.pause(10); // stablizes test

    await this.clickTermsAgreementCheckbox();
    await this.clickStartUploadButton();

    if (options.waitForUploadComplete) {
      await this.waitForBasespaceUploadComplete();
    }
  }

  public async selectBasespaceProject(option: string) {
    await this.clickSelectBasespaceProjectDropdown();
    await this.clickSelectBasespaceProjectOption(option);
  }

  public async dismissCookieBanner() {
    const cookieBanner = await this.getLocator(COOKIE_BANNER_LOCATOR);
    if (await cookieBanner.count() > 0) {
      await this.clickCookieBanner();
    }
  }

  public async uploadRefSequence(fileName = REF_FILENAME) {
    const [refSeqFileChooser] = await Promise.all([
      this.page.waitForEvent("filechooser"),
      this.page.getByTestId(REFERENCE_SEQUENCE_FILE_UPLOAD_TESTID).click(),
    ]);
    await this.pause(2);
    await refSeqFileChooser.setFiles(path.resolve(REF_FILE(fileName)));
  };

  public async uploadTrimPrimer(fileName = TRIM_PRIMER_FILENAME) {
    const [trimPrimerFileChooser] = await Promise.all([
      this.page.waitForEvent("filechooser"),
      this.page.locator(TRIM_PRIMERS_FILE_UPLOAD).click(),
    ]);
    await this.pause(2);
    await trimPrimerFileChooser.setFiles(path.resolve(TRIM_PRIMER_FILE(fileName)));
  };

  public async selectFiles(selector: string, filePath: string, files: string[], waitForConfirmation = true, timeout = 90_000) {
    for (let i = 0; i < files.length; i++) {
      const fullPath = path.join(filePath, files[i]);
      await this.pause(2); // Brief pause to stabilize tests
      await this.page.setInputFiles(selector, fullPath);

      if (waitForConfirmation) {
        let confirmationText = "";
        if (files[i].endsWith("csv")) {
          confirmationText = `${files[i]} loaded`;
        } else {
          confirmationText = `${i + 1} File${i === 0? "": "s"} Selected For Upload`;
        }
        await this.page.locator(`text=${confirmationText}`).waitFor({timeout: timeout});
      }
    };
  }

  public async selectProject(projectName: string) {
    await this.clickSelectProject();
    await this.fillProjectName(projectName);
    await this.clickProjectName(projectName);
  }

  public async uploadSampleFiles(sampleFiles: Array<string>, waitForConfirmation = true , timeout = 90_000) {
    await this.selectFiles(FILE_INPUT_SELECTOR, FIXTURE_DIR, sampleFiles, waitForConfirmation, timeout);
  }

  public async uploadCSVMetaData(metadataFileName: string, inputs: any) {
    const templateFilePath = path.join(FIXTURE_METADATA_DIR, metadataFileName);
    const templateContent = await fs.readFile(templateFilePath, "utf8");

    const tempFileName = `${randomUUID()}_${metadataFileName}`;
    const tempFilePath = path.join(FIXTURE_METADATA_DIR, tempFileName);

    let csvContent = "";
    try {
      for (const sampleName of Object.keys(inputs)) {
        const row = [
          sampleName,
          inputs[sampleName].hostOrganism,
          inputs[sampleName].sampleTissueType,
          inputs[sampleName].nucleotideType,
          inputs[sampleName].collectionDate,
          inputs[sampleName].waterControl,
          `"${inputs[sampleName].collectionLocation}"`,
          ",,,,,,,,,,,,,,,,,",
        ].join(",");
        csvContent += `${row}\n`;
      }
      await fs.writeFile(tempFilePath, `${templateContent}\n${csvContent}`, "utf8");
      await this.selectFiles(REVIEW_CSV_FILE_INPUT_SELECTOR, FIXTURE_METADATA_DIR, [tempFileName]);

    } finally {
      fs.unlink(tempFilePath);
    }
  }

  public async setWorkFlow(analysisType: string, includeTrimPrimer = true, taxonName = "Unknown", sequencingPlatform = null, guppyBasecaller = "fast") {
    if (analysisType === WORKFLOWS.MNGS) {

      // Illumina: Short read mNGS
      await this.clickCheckboxForWorkflow(analysisType);

      sequencingPlatform = sequencingPlatform != null ? sequencingPlatform : SEQUENCING_PLATFORMS.MNGS;
      await this.clickSequencingPlatform(sequencingPlatform);
    }
    if (analysisType === WORKFLOWS.LMNGS) {
      // Nanopore: ONT (long read mNGS)
      await this.clickCheckboxForWorkflow(WORKFLOWS.MNGS);
      sequencingPlatform = sequencingPlatform != null ? sequencingPlatform : WORKFLOWS.LMNGS;
      await this.clickSequencingPlatform(sequencingPlatform);

      await this.clickGuppyBasecallerSettingDropDown();
      await this.clickGuppyBasecallerSettingOption(guppyBasecaller);
    }
    if (analysisType === WORKFLOWS.AMR) {
      await this.clickCheckboxForWorkflow(analysisType);
    }
    if (analysisType === WORKFLOWS.WGS) {
      await this.clickCheckboxForWorkflow(analysisType);
      await this.setUploadTaxonFilter(taxonName);

      await this.uploadRefSequence();
      if (includeTrimPrimer) {
        await this.uploadTrimPrimer();
      }
    }
    if (analysisType === WORKFLOWS.SC2) {
      await this.clickCheckboxForWorkflow(analysisType);
      await this.pause(1);

      sequencingPlatform = sequencingPlatform != null ? sequencingPlatform : SEQUENCING_PLATFORMS.MNGS;
      await this.clickSequencingPlatform(sequencingPlatform);
      await this.pause(1);

      await this.setWetLabFilter(WETLAB_PROTOCOL);
    }
    await this.pause(2); // Pause to stabilze test performance
  }

  public async setWetLabFilter(filterName: string) {
    await this.page.locator(WETLAB_FILTER).click();
    await this.page.locator(WETLAB_OPTION(filterName)).click();
  }

  public async setMedakaModelFilter(medakaModel: string) {
    await this.page.locator(MEDAKA_MODEL_FILTER).click();
    await this.page.locator(MEDAKA_MODEL_OPTION(medakaModel)).click();
  }

  public async setTaxonFilter(filterName: string) {
    await this.clickTaxonFilter();
    await this.page.getByText(filterName, {exact: true}).click();
  }

  public async setUploadTaxonFilter(filterName: string) {
    await this.clickUploadTaxonFilter();
    let fillValue = filterName;
    if (filterName.includes("(genus)") || filterName.includes("(species)")) {
      fillValue = filterName.split("(")[0].trim();
    }
    await this.page.locator(UPLOAD_TAXON_FILTER_INPUT).fill(fillValue);
    await this.page.getByText(filterName).first().click();
  }

  public async setManualInputs(inputs: any)
  {
    const sampleNames = await this.getMetadataSampleNames();
    const keys = Object.keys(inputs);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const newKey = sampleNames[i];
      if (newKey !== key) {
        inputs[newKey] = inputs[key];
        delete inputs[key];
      }
    }

    for (let i = 0; i < sampleNames.length; i++) {
      const sampleName = sampleNames[i];
      await this.fillHostOrganism(inputs[sampleName].hostOrganism, i);
      await this.fillSampleTissueType(inputs[sampleName].sampleTissueType, i);
      await this.fillWaterControl(inputs[sampleName].waterControl, i);
      await this.fillNucleotideType(inputs[sampleName].nucleotideType, i);
      await this.fillCollectionDate(inputs[sampleName].collectionDate, i);
      await this.fillCollectionLocation(inputs[sampleName].collectionLocation, i);
    }

    const errors = await this.getErrors();
    expect(errors).toEqual([]);
    return inputs;
  }

  public async e2eCSVSampleUpload(sampleFiles: Array<string>, project: any, workflow: string, inputs = null, includeTrimPrimer = true, taxonName = "Unknown", sequencingPlatform = null, guppyBasecaller = "fast", timeout = 90_000) {
    await this.goto();
    await this.dismissCookieBanner();

    await this.selectProject(project.name);
    await this.setWorkFlow(workflow, includeTrimPrimer, taxonName, sequencingPlatform, guppyBasecaller);
    await this.uploadSampleFiles(sampleFiles, true, timeout);

    // Continue
    await this.clickContinue();

    // Update the sample inputs using to the dynamically generated sample names
    // ex sample_name_{number}
    const sampleNames = (await this.getMetadataSampleNames()).sort();
    if (inputs === null) {
      inputs = await this.getRandomizedSampleInputs(sampleFiles, sampleNames);
    } else {
      const keys = Object.keys(inputs).sort();
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const newKey = sampleNames[i];
        if (!newKey) {
          delete inputs[key];
        } else if (key !== newKey) {
          inputs[newKey] = inputs[key];
          delete inputs[key];
        }
      }
    }

    // Click CSV Upload
    await this.clickCSVUpload();

    await this.uploadCSVMetaData(METADATA_FILE_NAME, inputs);

    // Continue to Review to verify the CSV Sample Info
    await this.clickContinue();
    expect(await this.getErrors()).toEqual([]); // Catch metadata upload errors

    // Continue to Upload
    await this.clickTermsAgreementCheckbox();
    await this.clickStartUploadButton();
    await this.waitForUploadComplete();
    return inputs;
  }
  // #endregion Macro

  // #region Validation

  // #region Samples
  public async isSequencingTechnologyDisabled(workflow: string) {
    return (await this.getCheckboxForWorkflow(workflow.toLocaleLowerCase())).isDisabled();
  }

  public async isContinueButtonDisabled() {
    return this.page.locator(CONTINUE_BUTTON).isDisabled();
  }

  public async isSampleRowDisabled(index= 0) {
    const classAttribute = await this.page.locator(ROW_FILENAMES).nth(index).getAttribute("class");
    return classAttribute.includes(" disabled-");

  }
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
    const metaDataSamples = await this.getMetadataSampleNames();
    for (let i = 0; i < Object.keys(inputs).length; i++) {
      const sampleName = metaDataSamples[i];
      const expectedInput = inputs[sampleName];
      expect(expectedInput.hostOrganism).toEqual(await this.getMetadataHostOrganismValue(i));
      expect(expectedInput.sampleTissueType).toEqual(await this.getMetadataSampleTissueTypeValue(i));
      expect(expectedInput.waterControl).toEqual(await this.getMetadataWaterControlValue(i));
      expect(expectedInput.nucleotideType).toEqual(await this.getMetadataNucleotideTypeValue(i));
      expect(expectedInput.collectionDate).toEqual(await this.getMetadataCollectionDateValue(i));
      expect(expectedInput.collectionLocation).toEqual(await this.getMetadataCollectionLocationValue(i));
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
        "Pipeline Version": "8", // Major version
      };
    }
    else if (sampleType === WORKFLOWS.LMNGS) {
      expectedResults = {
        "Sequencing Platform": "Nanopore",
        "Analysis Type": "Metagenomics",
        "Guppy Basecaller Setting": "fast",
        "Pipeline Version": "0", // Major version
      };
    }
    else if (sampleType === WORKFLOWS.AMR) {
      expectedResults = {
        "Analysis Type": "Antimicrobial Resistance",
        "Pipeline Version": "1", // Major version
      };
    }
    else if (sampleType === WORKFLOWS.WGS) {
      expectedResults = {
        "Analysis Type": "Viral Consensus Genome",
        "Sequencing Platform": "Illumina",
        "Taxon Name": "unknown",
        "Reference Sequence": "consensus_TEST_SC2.fa",
        "Trim Primer": "Primer_K.bed",
        "Pipeline Version": CONSENSUS_GENOME_PIPELINE_MAJOR_VERSION,
      };
    }
    else if (sampleType === WORKFLOWS.SC2) {
      expectedResults = {
        "Analysis Type": "SARS-CoV-2 Consensus Genome",
        "Sequencing Platform": "Illumina",
        "Wetlab Protocol": WETLAB_PROTOCOL,
        "Pipeline Version": CONSENSUS_GENOME_PIPELINE_MAJOR_VERSION,
      };
    }
    else {
        throw new Error(`Unsupported Sample Type: ${sampleType}`);
    }
    for (const analysis in expectedResults) {
      if (analysis === "Pipeline Version") {
        const pipelineRegex = new RegExp(`Pipeline Version: ${expectedResults[analysis]}.\\d+.\\d+`);
        expect(await analysisReview.textContent()).toMatch(pipelineRegex);
      } else {
        await expect(analysisReview).toContainText(expectedResults[analysis]);
      }
    }
  }

  public async validateSampleInfo(inputs: Array<any>) {
    const reviewSamples = await this.getReviewSampleNames();
    for (let i = 0; i < Object.keys(inputs).length; i++) {
      const sampleName = reviewSamples[i];
      const expectedInput = inputs[sampleName];
      expect(sampleName).toEqual(expectedInput["sampleFile"]);
      expect(await this.getReviewInputFiles(i)).toEqual(expectedInput["inputFile"]);
      expect(await this.getReviewHostOrganismValue(i)).toEqual(expectedInput["hostOrganism"]);
      expect(await this.getReviewSampleTissueTypeValue(i)).toEqual(expectedInput["sampleTissueType"]);
      expect(await this.getReviewWaterControlValue(i)).toEqual(expectedInput["waterControl"]);
      expect(await this.getReviewNucleotideTypeValue(i)).toEqual(expectedInput["nucleotideType"]);
      expect(await this.getReviewCollectionDateValue(i)).toEqual(expectedInput["collectionDate"]);
      expect(await this.getReviewCollectionLocationValue(i)).toContain(expectedInput["collectionLocation"]); // Full location string contains partial location string
    }
  }
  // #endregion Review

  public async isGoToProjectButtonEnabled() {
    return this.page.locator(GO_TO_PROJECT_BUTTON).isEnabled();
  }

  public async waitForSampleSentToPipeline(sampleName: string) {
    await this.page.locator(SENT_TO_PIPELINE(sampleName)).waitFor();
    return this.page.locator(SENT_TO_PIPELINE(sampleName)).isVisible();
  }

  // #endregion Validation

  // #region Wait
  public async waitForUploadComplete() {
    await this.page.getByText(UPLOAD_COMPLETE).waitFor();
  }

  public async waitForBasespaceUploadComplete(timeout = 90_000) {
    await this.page.locator(LOADING_BARS).last().waitFor({state: "detached", timeout: timeout});
  }
  // #endregion Wait
}