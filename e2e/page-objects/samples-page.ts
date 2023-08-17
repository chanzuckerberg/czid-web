import { expect, Page } from "@playwright/test";

import { kebabCase } from "lodash";
// #region constants
import {
  ANNOTATION_FILTERS,
  ANNOTATION_TEXT,
  APPLY,
  APPLY_BUTTON,
  ARCHAEA_FILTER,
  BACTERIA_FILTER,
  CANCEL_ICON,
  CATEGORIES_FILTER,
  COLUMNS_LABEL,
  COLUMN_HEADER_PROP,
  EUKARYOTA_FILTER,
  FILTER_RESULT,
  FILTER_TAG,
  FILTER_VALUE,
  KLEBSIELLA,
  KLEBSIELLA_GENUS,
  LEARN_MORE_LINK,
  NUMBER_INPUT,
  READ_SPECIFICITY,
  READ_SPECIFICITY_FILTERS,
  SCORE,
  SEARCH_BAR,
  THRESHOLD_FILTER,
  THRESHOLD_FILTERS,
  TOTAL_READ_POPOUP_CONTENT,
  UNCATEGORIZED_FILTER,
  VIROIDS_FILTER,
  VIRUSES_FILTER,
  NAME_TYPE_FILTER,
  NAME_TYPES,
  NAME_TYPE_FILTER_VALUE,
} from "../constants/sample";
// #endregion constants

export class SamplesPage {
    public page: Page;
    public baseUrl: string;

    constructor(page: Page) {
        this.page = page;
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
    
    public async getTaxonNames(sampleReport: any) {
      let taxonNames = {
        "Scientific": [],
        "Common": []
      };
      for (let key in sampleReport.counts) {
        for (let subKey in sampleReport.counts[key]) {
          let taxon = sampleReport.counts[key][subKey];
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
    
    public async getNameTypeFilterValue() {
      return await this.page.locator(NAME_TYPE_FILTER_VALUE).textContent()
    }
    
    public async getTaxonElementByName(name: string) {
      return await this.page.locator(`[class*='taxonName']:text("${name}")`)
    }
    
    public async getTaxonElements() {
      return await this.page.locator("[class*='taxonName']").all()
    }

    public async getFilterTagElements() {
      return await this.page.locator(FILTER_TAG).all()
    }
    // #endregion Get
    
    // #region Click
    public async clickNameTypeFilter() {
      await this.page.locator(NAME_TYPE_FILTER).click();
    }

    public async clickNameTypeOption(option: string) {
      await this.page.getByTestId(kebabCase(option)).click();
    }
    
    public async clickSearchResult(text: string) {
      await this.page.getByText(text).click();
    }
    // #endregion Click

    // #region Fill
    public async fillSearchBar(value) {
      await this.page.locator(SEARCH_BAR).fill(value);
    }
    // #endregion Fill

    // #region Macro
    public async selectNameTypeOption(option: string) {
      await this.clickNameTypeFilter()
      await this.clickNameTypeOption(option)
    }
    // #endregion Macro

    // #region Validation
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

    public async validateFilterTags(filterTags: string[]) {
      const filterTagElements = await this.getFilterTagElements();
      const foundTags: string[] = [];

      for (const element of filterTagElements) {
        const tagText = await element.textContent();
        foundTags.push(tagText);
      }
      expect(filterTags).toEqual(foundTags);
    }
    
    public async validateTaxonsFilteredByName(taxonName: string) {
      let taxonElements = await this.getTaxonElements()
      for (let taxonElement of taxonElements) {
        expect(taxonElement).toContainText(taxonName);
      }
    }
    // #endregion Validation
}