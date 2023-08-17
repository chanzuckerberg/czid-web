import { expect, Page } from "@playwright/test";

import { kebabCase } from "lodash";
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
    // #endregion Get
    
    // #region Click
    public async click_name_type_filter() {
      await this.page.locator(NAME_TYPE_FILTER).click();
    }

    public async click_name_type_option(option: string) {
      await this.page.getByTestId(kebabCase(option)).click();
    }
    // #endregion Click

    // #region Macro
    public async select_name_type_option(option: string) {
      await this.click_name_type_filter()
      await this.click_name_type_option(option)
    }
    // #endregion Macro

    // #region Validation
    public async validate_report_filtered_by_name_type(name_type_option: string, expectedTaxonNames: []) {
      // Assert the filter section updated
      expect(
        (await this.getNameTypeFilterValue()).match(name_type_option)
      );
      // Assert the taxon common_names are on the page
      for (let taxonName of expectedTaxonNames) {
        expect(await this.getTaxonElementByName(taxonName)).toBeTruthy();
      }
    }
    // #endregion Validation
}