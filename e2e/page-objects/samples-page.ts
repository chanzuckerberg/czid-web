import { expect } from "@playwright/test";
import { PageObject } from "./page-object"
import { ArticlesPage } from "./articles-page"

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
  TAXONS
} from "../constants/sample";
// #endregion constants

export class SamplesPage extends PageObject {
  
    private CategoryDataIds = {
      "Archaea": ARCHAEA_FILTER,
      "Bacteria": BACTERIA_FILTER, 
      "Eukaryota": EUKARYOTA_FILTER,
      "Viroids": VIROIDS_FILTER,
      "Viruses": VIRUSES_FILTER,
      "Phage": VIRUSES_PHAGE_FILTER,
      "Uncategorized": UNCATEGORIZED_FILTER
    }

    // #region Navigate
    public async navigate(sampleId: number) {
      await this.page.goto(`${process.env.BASEURL}/samples/${sampleId}`);
    }
    // #endregion Navigate

    // #region Get
    public async getReportV2(sampleId: number) {
      const response = await this.page.context().request.get(
        `${process.env.BASEURL}/samples/${sampleId}/report_v2.json?&id=${sampleId}`
      );
      const sampleReport = await response.json();
      return sampleReport;
    }

    public async getSamples() {
      const response = await this.page.context().request.get(
        `${process.env.BASEURL}/samples/index_v2.json`
      );
      const responseJson = await response.json();
      return responseJson.samples;
    }

    public async getCompletedSamples() {
      const samples = await this.getSamples()
      let completedSamples = []
      for (let sample of samples) {
        if (sample.details.mngs_run_info) {
          if (sample.details.mngs_run_info.result_status_description === "COMPLETE") {
            completedSamples.push(sample)
          }
        }
      }
      return completedSamples;
    }

    public async getRandomCompletedSample() {
      const samples = await this.getCompletedSamples()
      return samples[Math.floor(Math.random() * samples.length)]
    }
    
    public async getTaxonNames(sampleReport: any) {
      let taxonNames = {
        "Scientific": [],
        "Common": []
      };
      for (let key in sampleReport.counts) {
        for (let taxonId in sampleReport.counts[key]) {
          let taxon = sampleReport.counts[key][taxonId];
          if (taxon.name && taxon.name.trim() !== '') {
            taxonNames.Scientific.push(taxon.name);
          }
          if (taxon.common_name && taxon.common_name.trim() !== '') {
            taxonNames.Common.push(taxon.common_name);
          }
        }
      }
      return taxonNames;
    }

    public async getTaxonsFromReport(sampleReport: any) {
      let taxons = []
      for (let key in sampleReport.counts) {
        for (let taxonId in sampleReport.counts[key]) {
          let taxon = sampleReport.counts[key][taxonId];
          taxon.id = taxonId
          if (taxon.name.split(' ').length >= 1) {
            taxon.rank = 'species'
          } else {
            taxon.rank = 'genius'
          }
          taxons.push(taxon);
        }
      }
      return taxons;
    }

    public async getTaxonsByCategory(sampleReport: any, categories: string[]) {
      const taxons = await this.getTaxonsFromReport(sampleReport);
      const lowerCaseCategories = categories.map(category => `${category}`.toLowerCase());
    
      return taxons.filter(taxon => 
        taxon.category && lowerCaseCategories.some(category => `${taxon.category}`.toLowerCase() === category)
      );
    }

    public async getSpecificTaxons(sampleReport: any, categories: string[]) {
      const taxons = await this.getTaxonsFromReport(sampleReport);
      return taxons.filter(taxon => taxon.category);
    }

    public async getTaxonNamesByCategory(sampleReport: any, categories: string[]) {
      const taxons = await this.getTaxonsByCategory(sampleReport, categories)
      return taxons.map(taxon => taxon.name);
    }
    
    public async getNameTypeFilterValue() {
      return await this.page.locator(NAME_TYPE_FILTER_VALUE).textContent()
    }
    
    public async getTaxonElementByName(name: string) {
      const taxonElement = await this.page.locator(`${TAXONS}:text('${name}')`).first();
      return taxonElement;
    }
    
    public async getTaxonElements() {
      await this.page.locator(TAXONS).first().waitFor({state: 'visible'})
      return await this.page.locator(TAXONS).all()
    }

    public async getFilterTagElements() {
      await this.page.waitForSelector(FILTER_TAG, { state: 'visible' })
      return await this.page.locator(FILTER_TAG).all()
    }
    
    public async getFilterTagsText() {
      const filterTagElements = await this.getFilterTagElements();
      const filterTags: string[] = [];

      for (const element of filterTagElements) {
        const tagText = await element.textContent();
        filterTags.push(tagText);
      }
      return filterTags;
    }

    public async getReadSpecificityFilterValue() {
      return await this.page.locator(`${READ_SPECIFICITY} + span`).textContent()
    }
    
    public async getAllColumnText() {
      return await this.page.locator(COLUMNS_LABEL).allInnerTexts();
    }
    // #endregion Get
    
    // #region Click
    public async clickExpandAll() {
      await this.page.getByTestId("expand-taxon-parent-all").click()
    }

    public async clickLearnMoreLink() {
      const [newPage] = await Promise.all([
        this.page.context().waitForEvent("page"),
        await this.page.locator(LEARN_MORE_LINK).click(),
      ]);
      await newPage.waitForLoadState();
      return new ArticlesPage(newPage)
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
      await this.page.waitForSelector(APPLY_BUTTON, { state: 'visible' })
      await this.page.locator(APPLY_BUTTON).locator(APPLY).click();
    }

    public async clickThresholdOptionFilter() {
      await this.page.locator(THRESHOLD_OPTION_FILTER).first().click();
    }

    public async clickThresholdComparisonOperatorFilter() {
      await this.page.locator(THRESHOLD_OPTION_FILTER).last().click();
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
      await this.page.locator('[class="result"]').getByText(text).first().click();
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
      await this.page.locator('[aria-rowindex]').nth(index).click();
    }
    
    
    public async clickClearFilters() {
      await this.page.locator(`text="Clear Filters"`).click();
    }
    // #endregion Click

    // #region Fill
    public async fillSearchBar(value: string) {
      await this.page.locator(SEARCH_BAR).fill(value);
      await this.page.locator(SEARCH_BAR).click()
    }

    public async fillThresholdValue(value: number) {
      await this.page.waitForSelector(NUMBER_INPUT, { state: 'visible' })
      await this.page.locator(NUMBER_INPUT).fill(value.toString());
    }
    // #endregion Fill

    // #region Macro
    public async findTaxonElementByName(name: string) {
      await this.clickTableRowByIndex(0)

      const taxonLocatorString = `[class*='taxonName']:text('${name}')`
      const taxonElement = await this.page.locator(taxonLocatorString).first();
      if (!(await taxonElement.isVisible())) {
        await this.scrollUpToElement('[aria-rowindex="1"]')
        this.scrollDownToElement(taxonLocatorString)
      }

      await taxonElement.scrollIntoViewIfNeeded()
      await taxonElement.waitFor({ state: 'visible' });
    
      return taxonElement;
    }
    
    public async toggleTableSort() {
      await this.clickTableHeaderByIndex(0)
      await this.clickTableHeaderByIndex(0)
    }

    public async hoverOverColumnByIndex(index: number) {
      await this.page.locator(COLUMNS_LABEL).nth(index).hover();
    }

    public async removeFilterTags(tags: string[]) {
      for (let tag of tags) {
        await this.clickFilterTagCloseIcon(tag)
      }
    }

    public async selectThresholdOptions(thresholdOption: string, comparisonOperator: string, thresholdValue: number) {
      await this.clickThresholdFilter()

      // #region Threshold Option
      await this.clickThresholdOptionFilter()
      await this.clickThresholdOption(thresholdOption)
      // #endregion Threshold Option

      // #region Threshold Comparison Operator
      await this.clickThresholdComparisonOperatorFilter()
      await this.clickThresholdComparisonOperatorOption(comparisonOperator)
      // #endregion Threshold Comparison Operator

      // #region Threshold Value
      await this.fillThresholdValue(thresholdValue)
      // #endregion Threshold Value

      await this.clickApplyThresholdFilter()
    }

    public async selectReadSpecificityOption(option: string) {
      await this.clickReadSpecificityFilter()
      await this.clickReadSpecificityOption(option)
    }

    public async selectNameTypeOption(option: string) {
      await this.clickNameTypeFilter()
      await this.clickNameTypeOption(option)
    }

    public async selectAnnotationFilter(option: string) {
      await this.clickAnnotationFilter()
      await this.clickAnnotationFilterOption(option)
    }
    
    public async selectCategoryFilter(option: string) {
      await this.clickCategoriesFilter()
      await this.clickCategoriesOption(option)
      await this.pressEscape()
    }
    // #endregion Macro

    // #region Validation
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
      let tagLocator = this.page.locator(FILTER_TAG).locator(`text="${expectedTagName}"`)
      if (toBeVisible) {
        await expect(tagLocator).toBeVisible();
      } else {
        await expect(tagLocator).not.toBeVisible();
      }
    }

    public async validateReportFilteredThreshold(thresholdOption: string, comparisonOperator: string, thresholdValue: number, sampleReport: any) {
      const optionToKeyMap = {
        "Score": "agg_score",
        "NT Z Score": "nt.z_score",
        "NT rPM": "nt.rpm",
        "NT r (total reads)": "nt.count",
        "NT contigs": "undefined", // Requires further clarification
        "NT contig reads": "undefined", // Requires further clarification
        "NT %id": "nt.percent_identity",
        "NT L (alignment length in bp)": "nt.alignment_length",
        "NT E value (as a power of 10)": "nt.e_value",
        "NR Z Score": "nr.z_score",
        "NR rPM": "nr.rpm",
        "NR r (total reads)": "nr.count",
        "NR contigs": "undefined", // Requires further clarification
        "NR contig reads": "undefined", // Requires further clarification
        "NR %id": "nr.percent_identity",
        "NR L (alignment length in bp)": "nr.alignment_length",
        "NR E value (as a power of 10)": "nr.e_value"
      };
  
      const key = optionToKeyMap[thresholdOption];
      // TODO: Complete validation
    }

    public async validateThresholdOptionFilterHasExpectedOptions(expectedThresholdOptions: string[]) {
      await this.clickThresholdFilter(); // Open the filter dropdown
      await this.clickThresholdOptionFilter()
      for (let expectedOption of expectedThresholdOptions) {
        expect(await this.page.getByTestId(`dropdown-${kebabCase(expectedOption)}`)).toBeTruthy();
      }
      await this.clickThresholdFilter(); // Close the filter dropdown
    }

    public async validateReportFilteredByNameType(nameTypeOption: string, expectedTaxonNames: []) {
      // Assert the filter section updated
      expect(
        (await this.getNameTypeFilterValue()).match(nameTypeOption)
      );
      // Assert the taxon common_names are on the page
      for (let taxonName of expectedTaxonNames) {
        expect(await this.getTaxonElementByName(taxonName)).toBeTruthy();
      }
    }

    public async validateFilterTags(expectedfilterTags: string[]) {
      const foundTags = await this.getFilterTagsText()
      expect(expectedfilterTags, `Expected: ${expectedfilterTags}, Got: ${foundTags}`).toEqual(foundTags);
    }
    
    public async validateTaxonsFilteredByName(expectedTaxonName: string) {
      let taxonElements = await this.getTaxonElements()
      console.log("")
      console.log(taxonElements)
      console.log("")
      for (let taxonElement of taxonElements) {
        expect(taxonElement).toContainText(expectedTaxonName);
      }
    }
    
    public async validateAnnotationFiltersHasExpectedOptions(expectedAnnotationOptions: string[]) {
      await this.clickAnnotationFilter(); // Open the filter dropdown
      for (let expectedOption of expectedAnnotationOptions) {
        expect(await this.page.getByTestId(`dropdown-${kebabCase(expectedOption)}`)).toBeVisible();
      }
      await this.clickAnnotationFilter(); // Close the filter dropdown
    }

    public async validateReadSpecificityFiltersHasExpectedOptions(expectedReadSpecificityOptions: string[]) {
      await this.clickReadSpecificityFilter(); // Open the filter dropdown
      for (let expectedOption of expectedReadSpecificityOptions) {
        expect(await this.page.getByTestId(`dropdown-${kebabCase(expectedOption)}`)).toBeTruthy();
      }
      await this.clickReadSpecificityFilter(); // Close the filter dropdown
    }

    public async validateReportFilteredByReadSpecificity(readSpecificityOption: string, expectedTaxonNames: []) {
      // Assert the filter section updated
      expect(
        (await this.getReadSpecificityFilterValue()).match(readSpecificityOption)
      );
      // Assert the taxon common_names are on the page
      await this.validateTaxonsArePresent(expectedTaxonNames);
    }

    public async validateTaxonsArePresent(expectedTaxonNames: []) {
      for (let taxonName of expectedTaxonNames) {
        expect(await this.getTaxonElementByName(taxonName)).toBeTruthy();
      }
    }

    public async validateReportFilteredByAnnotation(expectedAnnotationFilters: string[]) {
      for (let annotationFilter of expectedAnnotationFilters) {
        await this.selectAnnotationFilter(annotationFilter)
        await this.validateFilterTags([annotationFilter])

        // TODO: Expand this validation to check each taxon in the report table matches the annotation criteria
        // Question: Is this functionality missing in stage?
        
        await this.clickTableHeaderByIndex(0) // Closes the annotation filter options
        await this.clickFilterTagCloseIcon(annotationFilter);
      }
    }
    // #endregion Validation
}