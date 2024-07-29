import { expect } from "@playwright/test";

import { kebabCase } from "lodash";
// #region constants
import {
  ANNOTATION_TEXT,
  APPLY,
  APPLY_BUTTON,
  ARCHAEA_FILTER,
  BACTERIA_FILTER,
  X_CLOSE_ICON,
  CATEGORIES_FILTER,
  COLUMNS_LABEL,
  EUKARYOTA_FILTER,
  FILTER_TAG,
  LEARN_MORE_LINK,
  NUMBER_INPUT,
  READ_SPECIFICITY,
  SEARCH_BAR,
  SEARCH_RESULT,
  SEARCH_RESULT_TITLE,
  FILTERS_DROPDOWN,
  THRESHOLD_FILTER,
  THRESHOLD_OPTION_FILTER,
  TOTAL_READ_POPOUP_CONTENT,
  UNCATEGORIZED_FILTER,
  VIROIDS_FILTER,
  VIRUSES_FILTER,
  VIRUSES_PHAGE_FILTER,
  NAME_TYPE_FILTER,
  NAME_TYPE_FILTER_VALUE,
  TAXONS,
} from "../constants/sample";
// #endregion constants

import { ArticlesPage } from "./articles-page";
import { PageObject } from "./page-object";
import { PipelineVizPage } from "./pipeline_viz-page";
import { ProjectPage } from "./project-page";
const BACK_TO_PROJECT = (projectName: string) => `//a[text()='${projectName}']`;
const TAXON_HOVER_ACTIONS = (taxonName: string) => `//span[text()='${taxonName}']/parent::div//span[@data-testid='hover-actions']//button`;
const SAMPLE_MESSAGE = "[data-testid='sample-message']";
const COVERAGE_VIZ_HISTOGRAM_LOCATOR = "[class*='coverageVizHistogram']";
const ACTION_BUTTONS_LOCATOR = "[class*='actionIcons'] button";
const BLAST_SELECTION_MODAL_TESTID = "blast-selection-modal";
const BLAST_SELECTION_OPTIONS = "[data-testid='blast-selection-modal'] [class*='optionText'] [class*='title']";
const BLAST_TYPES = ["blastn", "blastx"];
const PIPELINE_VERSION = "[data-testid='pipeline-version-select']";
const REPORT_TABLE_ROWS = "[class*='reportTable'] [class*='__Table__row'][role='row']";
const PIPELINES_TAB = "[data-testid='pipelines']";
const VIEW_PIPELINE_VISUALIZATION_LINK = "[class*='vizLink'] a";
const REPORT_IN_PROGRESS = "[class*='reportStatus'][class*='inProgress']";
const MEATBALLS_MENU = "[data-testid='overflow-btn']";
const DELETE_CG_RUN_BUTTON = "//span[text()='Delete CG Run']";
const DELETE_CONFIRMATION_BUTTON = "//button[text()='Delete']";
const DOWNLOAD_ALL_BUTTON = "//button[text()='Download All']";
const DISMISS_BUTTON = "//*[translate(text(), 'D','d') = 'dismiss']";
const CONSENSUS_GENOME_TAB = "[data-testid='consensus-genome']";
const SHARE_BUTTON = "//button[text()='Share']";
const LEARN_MORE_ABOUT_CONSENSUS_GENOMES_LINK = "//a[contains(text(), 'Learn more about consensus genomes')]";
const GENERATE_CONSENSUS_GENOME_DROPDOWN = "[data-testid='create-consensus-genome-modal'] [data-testid='filters']";
const GENERATE_CONSENSUS_GENOME_OPTION = "//*[@data-testid='create-consensus-genome-modal']/parent::*/following-sibling::*//*[contains(@class, 'optionText')]";
const GENERATE_CONSENSUS_GENOME_ENABLED_OPTIONS = "//*[@data-testid='create-consensus-genome-modal']/parent::*/following-sibling::*//*[not(contains(@class, 'disabledOption'))]/*[contains(@class, 'optionText')]";
const CREATE_A_NEW_CONSENSUS_GENOME_BUTTON = "//button[text()='Create a New Consensus Genome']";
const CREATE_CONSENSUS_GENOME_BUTTON = "//button[text()='Create Consensus Genome']";
const VIEW_CONSENSUS_GENOME_Link = "[class*='consensusGenomeLink']";
const BACKGROUND_FILTER_VALUE = "[data-testid='background-filter'] [data-testid='filter-value']";

// Sample Details
const SAMPLE_DETAILS_BUTTON = "[data-testid='sample-details']";
const SAMPLE_DETAILS_HOST_VALUE = "[data-testid='host-value']";

// Is my consensus genome complete?
// TODO: Add const

// How good is the coverage?
const NCBI_REFERENCE_LENGTH = "//div[text()='NCBI Reference']/parent::div/following-sibling::div";
const REFERENCE_LENGTH = "//div[text()='Reference Length']/parent::div/following-sibling::div";
const COVERAGE_DEPTH = "//div[text()='Coverage Depth']/parent::div/following-sibling::div";
const COVERAGE_BREADTH = "//div[text()='Coverage Breadth']/parent::div/following-sibling::div";
const IS_MY_CONSENSUS_GENOME_COMPLETE_TOOLTIP = "//div[text()='Is my consensus genome complete?']//*[contains(@class, 'SvgIcon')]";
const IS_MY_CONSENSUS_GENOME_COMPLETE_HEADERS = "[class*='metricsTable'] [class*='tableHeaderLabel']";
const TOOLTIP_CONTAINER = "[class*='tooltip']";
const TOOLTIP_LEARN_MORE_LINK = "//*[contains(@class, 'tooltip')]//*[text()='Learn more.']";

// Coverage Viz Histogram Hover Elements
const HOVER_BASE_PAIR_RANGE = "//div[text()='Base Pair Range']/following-sibling::div";
const HOVER_COVERAGE_DEPTH = "//div[text()='Coverage Depth']/following-sibling::div";
const HOVER_COVERAGE_BREADTH = "//div[text()='Coverage Breadth']/following-sibling::div";

// How good is the coverage?
const CUSTOM_REFERENCE_DOWNLOAD = "[class*='metric'] [class*='downloadLink']";
const HOW_GOOD_IS_THE_COVERAGE_TOOLTIP = "//div[text()='How good is the coverage?']//*[contains(@class, 'MuiSvgIcon')]";
const HOW_GOOD_IS_THE_COVERAGE_HEADERS = "[class*='coverageContainer'] [class*='metric'] [class*='label']";
const NONHEADER_TOOLTIP_CONTAINER = "[class='content']";

export class SamplesPage extends PageObject {

    private CategoryDataIds = {
      "Archaea": ARCHAEA_FILTER,
      "Bacteria": BACTERIA_FILTER,
      "Eukaryota": EUKARYOTA_FILTER,
      "Viroids": VIROIDS_FILTER,
      "Viruses": VIRUSES_FILTER,
      "Phage": VIRUSES_PHAGE_FILTER,
      "Uncategorized": UNCATEGORIZED_FILTER,
    };

    // #region Navigate
    public async navigate(sampleId: number) {
      await this.pause(1);
      await this.page.goto(
        `${process.env.BASEURL}/samples/${sampleId}`, {timeout: 30 * 1000},
      ).catch(() => this.page.reload());
      await this.pause(1);
    }
    // #endregion Navigate

    // #region Get
    public async getBackgroundFilterValue() {
      return this.page.locator(BACKGROUND_FILTER_VALUE).textContent();
    }

    public async getReferenceAccessionOptions() {
      await this.page.locator(GENERATE_CONSENSUS_GENOME_DROPDOWN).click();
      await this.pause(2);
      const referenceAccession = this.page.locator(GENERATE_CONSENSUS_GENOME_ENABLED_OPTIONS).allTextContents();
      await this.page.locator(GENERATE_CONSENSUS_GENOME_DROPDOWN).click();
      await this.pause(1);
      return referenceAccession;
    }

    public async getSampleStatusMessage(waitForMessage = "Loading") {
      let statusMessage = await this.page.locator(SAMPLE_MESSAGE).textContent();
      while (!statusMessage.toLowerCase().includes(waitForMessage)) {
        statusMessage = await this.page.locator(SAMPLE_MESSAGE).textContent();
        if (statusMessage.toLowerCase().includes(waitForMessage.toLowerCase())) {
          break;
        } else {
          await this.page.locator(SAMPLE_MESSAGE).getByText("LoadingLoading report data.").waitFor({state: "detached"});
        }
      }
      return this.page.locator(SAMPLE_MESSAGE).textContent();
    }

    public async getShareMessage() {
      return this.page.locator(NONHEADER_TOOLTIP_CONTAINER).textContent();
    }

    public async getHoverCoverageBreadth() {
      return this.page.locator(HOVER_COVERAGE_BREADTH).textContent();
    }

    public async getHoverCoverageDepth() {
      return this.page.locator(HOVER_COVERAGE_DEPTH).textContent();
    }

    public async getHoverBasePairRange() {
      return this.page.locator(HOVER_BASE_PAIR_RANGE).textContent();
    }

    public async getCoverageBreadth() {
      return this.page.locator(COVERAGE_BREADTH).textContent();
    }

    public async getCoverageDept() {
      return this.page.locator(COVERAGE_DEPTH).textContent();
    }

    public async getNCBIReferenceLength() {
      return this.page.locator(NCBI_REFERENCE_LENGTH).textContent();
    }

    public async getReferenceLength() {
      return this.page.locator(REFERENCE_LENGTH).textContent();
    }

    public async getPipelineVersion() {
      return this.page.locator(PIPELINE_VERSION).textContent();
    }

    public async getReportFilterTable() {
      return this.getTable("[class*='Table__headerColumn']", REPORT_TABLE_ROWS, "[aria-colindex]");
    }

    public async getIsMyConsensusGenomeCompleteTable() {
      return this.getTable(
        "[class*='metricsTable'] [class*='Table__headerColumn']",
        "[class*='metricsTable'] [class*='Table__row'][role='row']",
        "[role*='gridcell']",
      );
    }

    public async getWaitForReportError(sampleId: number) {
      const startTime = Date.now();
      const timeout = 30000;
      let report = null;
      while ((Date.now() - startTime) < timeout) {
        report = await this.getReportV2(sampleId);
        if (report.error !== undefined) {
          break;
        }
        await this.pause(1);
      }
      return report;
    }

    public async getReportV2(sampleId: number) {
      const requestUrl = `${process.env.BASEURL}/samples/${sampleId}/report_v2.json?&id=${sampleId}`;
      const response = await this.page.context().request.get(requestUrl);
      return response.json();
    }

    private async getSamplesInArray(projectName: string, sampleNames: Array<string>) {
      const samples = [];
      for (const sampleName of sampleNames) {
        const matchingSample = await this.getProjectSamples(projectName, sampleName);
        if (matchingSample.length > 0) {
          samples.push(matchingSample[0]);
        }
      }
      return samples;
    }

    public async getSamples(projectName = null, sampleNames = null) {
      if (Array.isArray(sampleNames)) {
        return this.getSamplesInArray(projectName, sampleNames);
      } else {
        return this.getProjectSamples(projectName, sampleNames);
      }
    }

    private async getProjectSamples(projectName = null, sampleName = null, limit = 10000) {
      const urlParams = new URLSearchParams();
      let project = null;
      if (projectName !== null) {
        const projectPage = new ProjectPage(this.page);
        project = await projectPage.getProjectByName(projectName);
        if (project !== null) {
          urlParams.append("projectId", project.id);
        }
      }
      if (sampleName !== null) {
        urlParams.append("search", sampleName);
      }
      urlParams.append("limit", `${limit}`);

      const params = Array.from(urlParams.entries()).length > 0 ? `?${urlParams.toString()}` : "";
      const requestUrl = `${process.env.BASEURL}/samples/index_v2.json${params}`;
      const response = await this.page.context().request.get(requestUrl);
      const responseJson = await response.json();

      let samples = await responseJson.samples;
      if (project !== null) {
        samples = await samples.filter(s => s.project_id === project.id);
      }
      if (sampleName !== null) {
        samples = await samples.filter(s => s.name === sampleName);
      }
      return samples;
    }

    public async getCompletedSamples(projectName = null, sampleNames = null) {
      const samples = await this.getSamples(projectName,  sampleNames);
      const completedSamples = [];
      for (const sample of samples) {
        if (sample.details.mngs_run_info && sample.details.mngs_run_info.result_status_description === "COMPLETE") {
            completedSamples.push(sample);
        }
      }
      return completedSamples;
    }

    public async getRandomCompletedSample(projectName = null) {
      const samples = await this.getCompletedSamples(projectName);
      return samples[Math.floor(Math.random() * samples.length)];
    }

    public async getGenusNamesFromReport(sampleReport: any) {
      const taxons = await this.getTaxonsFromReport(sampleReport);
      const genusNames = [];
      for (const taxon of taxons) {
        const genus = taxon.name.split(" ")[0];
        if (!genusNames.includes(genus)) {
          genusNames.push(genus);
        }
      }
      return genusNames;
    }

    public async getTaxonNamesFromReport(sampleReport: any) {
      const taxonNames = {
        "Scientific": [],
        "Common": [],
      };
      const taxons = await this.getTaxonsFromReport(sampleReport);
      for (const taxon of taxons) {
        if (taxon.name && taxon.name.trim() !== "") {
          taxonNames.Scientific.push(taxon.name);
        }
        if (taxon.common_name && taxon.common_name.trim() !== "") {
          taxonNames.Common.push(taxon.common_name);
        }
      }
      return taxonNames;
    }

    public async getTaxonsFromReport(sampleReport: any) {
      const taxons = [];
      for (const key in sampleReport.counts) {
        for (const taxonId in sampleReport.counts[key]) {
          if (+taxonId > 0 ) {
            const taxon = sampleReport.counts[key][taxonId];
            taxon.id = taxonId;
            if (taxon.name.split(" ").length >= 1) {
              taxon.rank = "species";
            } else {
              taxon.rank = "genius";
            }
            taxons.push(taxon);
          }
        }
      }
      return taxons;
    }

    public async getTaxonsByCategory(sampleReport: any, categories: string[]) {
      const taxons = await this.getTaxonsFromReport(sampleReport);
      const lowerCaseCategories = categories.map(category => `${category}`.toLowerCase());

      return taxons.filter(taxon =>
        taxon.category && lowerCaseCategories.some(category => `${taxon.category}`.toLowerCase() === category),
      );
    }

    public async getTaxonCategories(sampleReport: any) {
      const taxons = await this.getTaxonsFromReport(sampleReport);
      const taxonCategories = [];
      for (const taxon of taxons) {
        if (taxon.category && !taxonCategories.includes(taxon.category)) {
          taxonCategories.push(taxon.category);
        }
      }
      return taxonCategories;
    }

    public async getSpecificTaxons(sampleReport: any) {
      const taxons = await this.getTaxonsFromReport(sampleReport);
      return taxons.filter(taxon => taxon.category);
    }

    public async getTaxonNamesFromReportByCategory(sampleReport: any, categories: string[]) {
      const taxons = await this.getTaxonsByCategory(sampleReport, categories);
      return taxons.map(taxon => taxon.name);
    }

    public async getNameTypeFilterValue() {
      return this.page.locator(NAME_TYPE_FILTER_VALUE).textContent();
    }

    public async getTaxonElementByName(name: string) {
      return this.page.locator(`${TAXONS}:text("${name}")`).first();
    }

    public async getTaxonElements() {
      await this.page.locator(TAXONS).first().waitFor({state: "visible"});
      return this.page.locator(TAXONS).all();
    }

    public async getFilterTagElements(timeout = 30_000) {
      await this.page.waitForSelector(FILTER_TAG, { state: "visible", timeout: timeout }).catch(() => null);
      return this.page.locator(FILTER_TAG).all().catch(() => []);
    }

    public async getFilterTagsText() {
      const filterTagElements = await this.getFilterTagElements();;
      const filterTags: string[] = [];

      for (const element of filterTagElements) {
        const tagText = await element.textContent();
        filterTags.push(tagText);
      }
      return filterTags;
    }

    public async getReadSpecificityFilterValue() {
      return this.page.locator(`${READ_SPECIFICITY} + span`).textContent();
    }

    public async getAllColumnText() {
      return this.page.locator(COLUMNS_LABEL).allInnerTexts();
    }

    public async getSearchResults() {
      const searchResults = await this.page.locator(SEARCH_RESULT_TITLE).all();
      const searchResultsArray = [];
      for (const searchResult of searchResults) {
        searchResultsArray.push(await searchResult.textContent());
      }
      return searchResultsArray;
    }

    public async getSampleDetailsMetadataHost() {
      return this.page.locator(SAMPLE_DETAILS_HOST_VALUE).textContent();
    }
    // #endregion Get

    // #region Click
    public async clickGenerateConsensusGenomeDropdown() {
      await this.pause(1);
      await this.page.locator(GENERATE_CONSENSUS_GENOME_DROPDOWN).waitFor();
      await this.page.locator(GENERATE_CONSENSUS_GENOME_DROPDOWN).click();
    }

    public async clickBackToProject(projectName: string) {
      await this.page.locator(BACK_TO_PROJECT(projectName)).click();
    }

    public async clickViewConsensusGenomeLink() {
      await this.page.locator(VIEW_CONSENSUS_GENOME_Link).click();
    }

    public async clickCreateConsensusGenomeButton() {
      await this.page.locator(CREATE_CONSENSUS_GENOME_BUTTON).click();
    }

    public async clickLearnMoreAboutConsensusGenomesLink() {
      const [newPage] = await Promise.all([
        this.page.context().waitForEvent("page"),
        await this.page.locator(LEARN_MORE_ABOUT_CONSENSUS_GENOMES_LINK).click(),
      ]);
      await newPage.waitForLoadState();
      return new ArticlesPage(newPage);
    }

    public async clickTooltipLearnMore() {
      const [newPage] = await Promise.all([
        this.page.context().waitForEvent("page"),
        await this.page.locator(TOOLTIP_LEARN_MORE_LINK).first().click(),
      ]);
      await newPage.waitForLoadState();
      return new ArticlesPage(newPage);
    }

    public async clickShareButton() {
      await this.pause(4);
      await this.page.locator(SHARE_BUTTON).click();

      await this.pause(1);
      return this.page.evaluate(() => navigator.clipboard.readText());
    }

    public async clickConsensusGenomeTab() {
      await this.page.locator(CONSENSUS_GENOME_TAB).click();
    }

    public async clickDismissButton() {
      await this.page.locator(DISMISS_BUTTON).waitFor({timeout: 30000}).catch(() => null);
      if (this.page.locator(DISMISS_BUTTON).isVisible()) {
        await this.page.locator(DISMISS_BUTTON).click();
      }
    }

    public async clickDeleteButtonConfirmation() {
      await this.page.locator(DELETE_CONFIRMATION_BUTTON).click();
    }

    public async clickDeleteCGRunButton() {
      await this.page.locator(DELETE_CG_RUN_BUTTON).click();
    }

    public async clickMeatballsMenu() {
      await this.page.locator(MEATBALLS_MENU).click();
    }

    public async clickDownloadAllButton() {
      await this.page.locator(DOWNLOAD_ALL_BUTTON).click();
      return this.page.waitForEvent("download");
    }

    public async clickCustomReferenceDownload() {
      await this.page.locator(CUSTOM_REFERENCE_DOWNLOAD).click();
      return this.page.waitForEvent("download");
    }

    public async clickViewPipelineVisualizationLink() {
      await this.page.locator(VIEW_PIPELINE_VISUALIZATION_LINK).click();
      return new PipelineVizPage(this.page);
    }

    public async clickPipelinesTab() {
      await this.page.locator(PIPELINES_TAB).click();
    }

    public async clickSampleDetailsButton() {
      await this.page.locator(SAMPLE_DETAILS_BUTTON).click();
    }

    public async clickExpandAll() {
      await this.page.getByTestId("expand-taxon-parent-all").click();
    }

    public async clickLearnMoreLink() {
      const [newPage] = await Promise.all([
        this.page.context().waitForEvent("page"),
        await this.page.locator(LEARN_MORE_LINK).click(),
      ]);
      await newPage.waitForLoadState();
      return new ArticlesPage(newPage);
    }

    public async clickCategoriesFilter() {
      await this.page.locator(CATEGORIES_FILTER).click();
    }

    public async clickCategoriesOption(option: string) {
      await this.page.locator(this.CategoryDataIds[option]).click();
    }

    public async clickThresholdFilter() {
      await this.page.locator(THRESHOLD_FILTER).click();
    }

    public async clickApplyThresholdFilter() {
      await this.page.waitForSelector(APPLY_BUTTON, { state: "visible" });
      await this.page.locator(APPLY_BUTTON).locator(APPLY).click();
    }

    public async clickThresholdOptionFilter() {
      await this.page.locator(THRESHOLD_OPTION_FILTER).first().click();
    }

    public async clickThresholdComparisonOperatorFilter() {
      await this.page.locator(THRESHOLD_OPTION_FILTER).last().click();
      await this.pause(0.2);
    }

    public async clickThresholdComparisonOperatorOption(option: string) {
      await this.page.locator(`${FILTERS_DROPDOWN} [role="option"]`).getByText(option).click();
    }

    public async clickThresholdOption(option: string) {
      await this.page.getByTestId(kebabCase(option)).click();
    }

    public async clickReadSpecificityFilter() {
      await this.page.locator(READ_SPECIFICITY).click();
    }

    public async clickReadSpecificityOption(option: string) {
      await this.page.getByTestId(kebabCase(option)).click();
    }

    public async clickNameTypeFilter() {
      await this.page.locator(NAME_TYPE_FILTER).click();
    }

    public async clickNameTypeOption(option: string) {
      await this.page.getByTestId(kebabCase(option)).click();
    }

    public async clickSearchResult(text: string) {
      await this.page.locator(SEARCH_RESULT).getByText(text, {exact: true}).first().click();
    }

    public async clickAnnotationFilter() {
      await this.page.locator(ANNOTATION_TEXT).click();
    }

    public async clickAnnotationFilterOption(option: string) {
      await this.page.getByTestId(`dropdown-${kebabCase(option)}`).click();
    }

    public async clickFilterTagCloseIcon(text: string) {
      await this.page.locator(`${FILTER_TAG}:text('${text}') ${X_CLOSE_ICON}`).click();
    }

    public async clickTableHeaderByIndex(index: number) {
      await this.page.locator(COLUMNS_LABEL).nth(index).click();
    }

    public async clickTableRowByIndex(index: number) {
      await this.page.locator(REPORT_TABLE_ROWS).nth(index).click();
    }

    public async ClickSortByName() {
      await this.clickTableHeaderByIndex(0);
    }

    public async clickClearFilters() {
      await this.page.locator(`text="Clear Filters"`).click();
    }

    public async clickSearchBar() {
      await this.page.locator(SEARCH_BAR).click();
    }

    public async clickTaxonCoverageVisualisation(taxonName: string) {
      const taxonElement = await this.getTaxonElementByName(taxonName);
     await taxonElement.hover();

     const hoverElement = this.page.locator(TAXON_HOVER_ACTIONS(taxonName)).first();

     await hoverElement.hover();
     await hoverElement.click();
    }

    public async clickConsensusGenomeIcon(taxonName: string) {
      const taxonElement = await this.getTaxonElementByName(taxonName);
     await taxonElement.hover();

     const hoverElement = this.page.locator(TAXON_HOVER_ACTIONS(taxonName)).nth(3);

     await hoverElement.hover();
     await hoverElement.click();
    }

    public async clickCreateANewConsensusGenome() {
      await this.page.locator(CREATE_A_NEW_CONSENSUS_GENOME_BUTTON).click();
    }

    public async clickBlastButton() {
      const blastIcon = this.page.locator(ACTION_BUTTONS_LOCATOR).first();
      await blastIcon.click();
    }

    public async clickContigFastaButton() {
      const downloadContigFastaButton = this.page.locator(ACTION_BUTTONS_LOCATOR).nth(1);
      await downloadContigFastaButton.click();
    }
    // #endregion Click

    // #region Fill
    public async fillSearchBar(value: string) {
      await this.page.locator(SEARCH_BAR).fill(value);
      await this.pause(1);
    }

    public async fillThresholdValue(value: number) {
      await this.page.waitForSelector(NUMBER_INPUT, { state: "visible" });
      await this.page.locator(NUMBER_INPUT).fill(value.toString());
    }
    // #endregion Fill

    // #region Hover
    public async hoverOverIsMyConsensusGenomeCompleteTooltip() {
      await this.page.locator(IS_MY_CONSENSUS_GENOME_COMPLETE_TOOLTIP).hover();
    }

    public async hoverOverHowGoodIsTheCoverageTooltip() {
      await this.page.locator(HOW_GOOD_IS_THE_COVERAGE_TOOLTIP).hover();
    }

    // #endregion Hover

    // #region Macro
    public async expandGenerateConsensusGenomeDropdown() {
      const consensusGenomeOptions = this.page.locator(GENERATE_CONSENSUS_GENOME_OPTION);
      if (!await consensusGenomeOptions.first().isVisible()) {
        await this.clickGenerateConsensusGenomeDropdown();
      }
    }

    public async waitForAllSamplesComplete(sampleIds: Array<number>) {
      const samples = [];
      for (const sampleId of sampleIds) {
        await this.waitForReportComplete(sampleId);
      }
      return samples;
    }

    public async waitForAllReportsComplete(projectName: string, sampleNames: Array<string>) {
      const samples = [];
      for (const sampleName of sampleNames) {
        samples.push((await this.getSamples(projectName, sampleName))[0]);
      }
      for (const sample of samples) {
        await this.waitForReportComplete(sample.id);
      }
      await this.waitForAllSamplesComplete(samples);
      return samples;
    }

    public async waitForReportComplete(sampleId: number) {
      await this.navigate(sampleId);
      await this.pause(10);
      await this.waitForNotInProgress();
    }

    public async waitForNotInProgress() {
      const inProgress = this.page.locator(REPORT_IN_PROGRESS);
      while(await inProgress.isVisible()) {
        await this.reload();
        await this.pause(20);
      }
    }

    public async getIsMyConsensusGenomeCompleteTooltip() {
      await this.hoverOverIsMyConsensusGenomeCompleteTooltip();
      return this.page.locator(TOOLTIP_CONTAINER).textContent();
    }

    public async getHowGoodIsTheCoverageTooltip() {
      await this.hoverOverHowGoodIsTheCoverageTooltip();
      await this.pause(1);
      return this.page.locator(TOOLTIP_CONTAINER).textContent();
    }

    /*
     * "Is my consensus genome complete?"" information tooltips displayed for:
     * - Taxon / Mapped Reads / GC Content / SNPs / %id / Informative Nucleotides / %Genome Called / Missing Bases / Ambiguous Bases
     */
    public async getOverIsMyConsensusGenomeCompleteHeaderTooltip(index: number) {
      await this.page.locator(IS_MY_CONSENSUS_GENOME_COMPLETE_HEADERS).nth(index).hover();
      await this.pause(1);
      return this.page.locator(TOOLTIP_CONTAINER).textContent();
    }

    /*
     * "How good is the coverage?"" information tooltips displayed for:
     * Custom Reference / Reference Length / Coverage Depth / Coverage Breadth
     */
    public async getHowGoodIsTheCoverageHeaders(index: number) {
      await this.page.locator(HOW_GOOD_IS_THE_COVERAGE_HEADERS).nth(index).hover();
      await this.pause(1);
      return this.page.locator(NONHEADER_TOOLTIP_CONTAINER).textContent();
    }

    public async hoverOverCoverageVizHistogram() {
      await this.page.locator(COVERAGE_VIZ_HISTOGRAM_LOCATOR).hover();
    }

    public async isTaxonVisible(name: string) {
      const reportTableRowIndexAttribute = "aria-rowindex";
      const taxonLocatorString = `//*[contains(@class, "taxonName") and contains(text(), "${name}")]`;
      const taxonElement = this.page.locator(taxonLocatorString).first();

      let taxonVisible = await taxonElement.isVisible();
      for (let i = 0; i <= 3; i++) {
        if (!taxonVisible) {
          await this.clickTableRowByIndex(0);
          await this.scrollUpToElement(
            `${REPORT_TABLE_ROWS}[${reportTableRowIndexAttribute}="1"]`, REPORT_TABLE_ROWS, reportTableRowIndexAttribute);
  
          await this.scrollDownToElement(
            taxonLocatorString, REPORT_TABLE_ROWS, reportTableRowIndexAttribute);
        }
        taxonVisible = await taxonElement.isVisible();
        if (taxonVisible) {
          break;
        }
      }

      return taxonVisible === true;
    }

    public async toggleSortByName() {
      await this.ClickSortByName();
      await this.ClickSortByName();
    }

    public async hoverOverColumnByIndex(index: number) {
      await this.page.locator(COLUMNS_LABEL).nth(index).hover();
    }

    public async removeFilterTags(tags: string[]) {
      for (const tag of tags) {
        await this.clickFilterTagCloseIcon(tag);
      }
    }

    public async selectThresholdOptions(thresholdOption: string, comparisonOperator: string, thresholdValue: number) {
      await this.clickThresholdFilter();

      // #region Threshold Option
      await this.clickThresholdOptionFilter();
      await this.clickThresholdOption(thresholdOption);
      // #endregion Threshold Option

      // #region Threshold Comparison Operator
      await this.clickThresholdComparisonOperatorFilter();
      await this.clickThresholdComparisonOperatorOption(comparisonOperator);
      // #endregion Threshold Comparison Operator

      // #region Threshold Value
      await this.fillThresholdValue(thresholdValue);
      // #endregion Threshold Value

      await this.clickApplyThresholdFilter();
    }

    public async selectReadSpecificityOption(option: string) {
      await this.clickReadSpecificityFilter();
      await this.clickReadSpecificityOption(option);
    }

    public async selectNameTypeOption(option: string) {
      await this.clickNameTypeFilter();
      await this.clickNameTypeOption(option);
    }

    public async selectAnnotationFilter(option: string) {
      await this.clickAnnotationFilter();
      await this.clickAnnotationFilterOption(option);
    }

    public async selectCategoryFilter(option: string) {
      await this.clickCategoriesFilter();

      // Get the checkbox element
      // So we don't select if it's already selected
      const checkBox = this.page.locator(this.CategoryDataIds[option]) // option label
        .locator("..") // parent node
        .locator("[data-testid='checked']"); // Checkbox
      const checkBoxClass = await checkBox.getAttribute("class");

      if (!checkBoxClass.includes("checked")) {
        await this.clickCategoriesOption(option);
      }
      await this.pressEscape();
    }

    public async filterByName(name: string, searchResultText: string) {
      await this.fillSearchBar(name);
      await this.clickSearchBar();
      await this.clickSearchResult(searchResultText);
    }

    public async selectReferenceAccession(option: string) {
      await this.expandGenerateConsensusGenomeDropdown();

      const consensusGenomeOptions = this.page.locator(GENERATE_CONSENSUS_GENOME_OPTION);
      if (!await consensusGenomeOptions.first().isVisible()) {
        // Try expanding the dropdown again
        await this.expandGenerateConsensusGenomeDropdown();
      }
      await consensusGenomeOptions.getByText(option).waitFor({timeout: 90_000});
      await consensusGenomeOptions.getByText(option).click();

      const selectedValue = await this.page.locator(GENERATE_CONSENSUS_GENOME_DROPDOWN).getByTestId("filter-value").textContent();
      expect(selectedValue).toEqual(option);
    }
    // #endregion Macro

    // #region Validation
    public async isCreateANewConsensusGenomeButtonVisible() {
      await this.page.locator(CREATE_A_NEW_CONSENSUS_GENOME_BUTTON).waitFor({state: "visible", timeout: 10 * 1000}).catch(() => null);
      return this.page.locator(CREATE_A_NEW_CONSENSUS_GENOME_BUTTON).isVisible();
    }

    public async validateContigFastaDownload(sample: any, taxon: any) {
      const downloadPromise = this.page.waitForEvent("download");
      await this.clickContigFastaButton();
      const download = await downloadPromise;

      const expectedFileName = `${sample.name}_tax_${taxon.id}_contigs.fasta`;
      expect(expectedFileName).toMatch(download.suggestedFilename());
    }

    public async validateBlastSelectionModalVisible() {
      await expect(this.page.getByTestId(BLAST_SELECTION_MODAL_TESTID)).toBeVisible();
      const blastSelectionOptions = await this.page.locator(BLAST_SELECTION_OPTIONS).allTextContents();
      expect(BLAST_TYPES).toEqual(blastSelectionOptions);
    }

    public async validateCoverageVisualisationVisible(taxonName: string) {
      const taxonCoverageLabel = `${taxonName} Coverage`;

      // A popup showing the coverage visualisation for that specific organism should be showed
      await expect(this.page.locator(`text=${taxonCoverageLabel}`)).toBeVisible();
      await expect(this.page.locator(COVERAGE_VIZ_HISTOGRAM_LOCATOR)).toBeVisible();
    }

    public async validateTotalReadPopupTest(expectedText: string) {
      await expect(this.page.locator(TOTAL_READ_POPOUP_CONTENT)).toHaveText(expectedText);
    }

    public async validateColumnsVisible() {
      await expect(this.page.locator(COLUMNS_LABEL).nth(1)).toBeVisible();
    }

    public async validateFilterTagCount(expectedCount: number) {
      await expect(this.page.locator(FILTER_TAG)).toHaveCount(expectedCount);
    }

    public async validateStatsInfoNotEmpty() {
      await expect(this.page.getByTestId("stats-info")).not.toBeEmpty();
    }

    public async validateCategoryFilterAvailable(categoryName: string) {
      await expect(this.page.locator(this.CategoryDataIds[categoryName])).toBeVisible();
    }

    public async validateFilterTagVisiblity(expectedTagName: string, toBeVisible=true) {
      const tagLocator = this.page.locator(FILTER_TAG).locator(`text="${expectedTagName}"`);
      if (toBeVisible) {
        await expect(tagLocator).toBeVisible();
      } else {
        await expect(tagLocator).not.toBeVisible();
      }
    }

    public async validateReportFilteredThreshold(thresholdOption: string, comparisonOperator: string, thresholdValue: number) {
      const reportFilterTable = await this.getReportFilterTable();
      for (const row of reportFilterTable) {
        // TODO: Expand to include sampleReport api for values like "NT Z Score"
        if (row[thresholdOption] !== undefined) {
          const actualValue = row[thresholdOption] === "-" ? 0 : row[thresholdOption];
          if (comparisonOperator === "<=") {
            expect(actualValue).toBeLessThanOrEqual(thresholdValue);
          } else if (comparisonOperator === ">=") {
            expect(actualValue).toBeGreaterThanOrEqual(thresholdValue);
          } else {
            throw new Error(`Unexpected comparisonOperator: ${comparisonOperator}`);
          }
        }
      }
    }

    public async validateThresholdOptionFilterHasExpectedOptions(expectedThresholdOptions: any) {
      await this.clickThresholdFilter(); // Open the filter dropdown
      await this.clickThresholdOptionFilter();
      for (const expectedOption of expectedThresholdOptions) {
        expect(this.page.getByTestId("dropdown-menu").getByText(expectedOption.text).first()).toBeVisible();
      }
      await this.clickThresholdFilter(); // Close the filter dropdown
    }

    public async validateReportFilteredByNameType(nameTypeOption: string, expectedTaxonNames: []) {
      // Assert the filter section updated
      expect(
        (await this.getNameTypeFilterValue()).match(nameTypeOption),
      );
      // Assert the taxon common_names are on the page
      for (const taxonName of expectedTaxonNames) {
        expect(await this.getTaxonElementByName(taxonName)).toBeTruthy();
      }
    }

    public async validateFilterTags(expectedfilterTags: string[]) {
      const foundTags = await this.getFilterTagsText();
      expect(expectedfilterTags, `Expected: ${expectedfilterTags}, Got: ${foundTags}`).toEqual(foundTags);
    }

    public async validateTaxonsFilteredByName(expectedTaxonName: string) {
      const taxonElements = await this.getTaxonElements();
      const taxonNames = [];
      for (const taxonElement of taxonElements) {
        taxonNames.push(await taxonElement.textContent());
      }
      expect(taxonNames.join(",")).toContain(expectedTaxonName);
    }

    public async validateAnnotationFiltersHasExpectedOptions(expectedAnnotationOptions: string[]) {
      await this.clickAnnotationFilter(); // Open the filter dropdown
      for (const expectedOption of expectedAnnotationOptions) {
        expect(this.page.getByTestId(`dropdown-${kebabCase(expectedOption)}`)).toBeVisible();
      }
      await this.clickAnnotationFilter(); // Close the filter dropdown
    }

    public async validateReadSpecificityFiltersHasExpectedOptions(expectedReadSpecificityOptions: string[]) {
      await this.clickReadSpecificityFilter(); // Open the filter dropdown
      for (const expectedOption of expectedReadSpecificityOptions) {
        expect(this.page.getByTestId(`dropdown-${kebabCase(expectedOption)}`)).toBeTruthy();
      }
      await this.clickReadSpecificityFilter(); // Close the filter dropdown
    }

    public async validateReportFilteredByReadSpecificity(readSpecificityOption: string, expectedTaxonNames: []) {
      // Assert the filter section updated
      expect(
        (await this.getReadSpecificityFilterValue()).match(readSpecificityOption),
      );
      // Assert the taxon common_names are on the page
      await this.validateTaxonsArePresent(expectedTaxonNames);
    }

    public async validateTaxonsArePresent(expectedTaxonNames: []) {
      for (const taxonName of expectedTaxonNames) {
        expect(await this.getTaxonElementByName(taxonName)).toBeTruthy();
      }
    }

    public async validateTaxonIsVisible(name: string) {
      try {
        expect(await this.isTaxonVisible(name)).toBeTruthy();
      } catch (error) {
        const caughtErrorMsg = (error as Error).message;
        throw new Error(`Failed to locate taxon "${name}": ${caughtErrorMsg}`)
      }
    }

    public async validateTaxonsAreVisible(taxonNames: string[]) {
      for (const taxonName of taxonNames) {
        const taxonWithoutSpecies = taxonName.includes("(") ? taxonName.slice(0, taxonName.lastIndexOf("(")).trim() : taxonName;
        await this.validateTaxonIsVisible(taxonWithoutSpecies);
      }
    }

    public async validateReportFilteredByAnnotation(expectedAnnotationFilters: string[]) {
      for (const annotationFilter of expectedAnnotationFilters) {
        await this.selectAnnotationFilter(annotationFilter);
        await this.validateFilterTags([annotationFilter]);

        // TODO: Expand this validation to check each taxon in the report table matches the annotation criteria
        // Question: Is this functionality missing in stage?

        await this.clickTableHeaderByIndex(0); // Closes the annotation filter options
        await this.clickFilterTagCloseIcon(annotationFilter);
      }
    }
    // #endregion Validation
}