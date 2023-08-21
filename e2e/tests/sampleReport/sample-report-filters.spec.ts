import { test } from "@playwright/test";
import {
  ANNOTATION_FILTERS,
  COLUMN_HEADER_PROP,
  KLEBSIELLA,
  KLEBSIELLA_GENUS,
  READ_SPECIFICITY_FILTERS,
  THRESHOLD_FILTERS,
  THRESHOLD_COMPARISON_OPERATORS,
  NAME_TYPES,
} from "../../constants/sample";
import { SamplesPage } from "../../page-objects/samples-page";

const sampleId = 25307;
let samplesPage = null

// These tests validate the user's proficiency in utilizing various filter functions on the sample report page, such as Nametype, Annotation, Category, Threshold filter, and Read specificity.
test.describe("Sample report filter test", () => {
  test.beforeEach(async ({ page }) => {
    samplesPage = new SamplesPage(page)
    await samplesPage.navigate(sampleId)
  });

  test(`Verify url displayed on the columns`, async () => {
    await samplesPage.validateColumnsVisible()

    const n = await samplesPage.getAllColumnText()
    for (let i = 1; i < n.length; i++) {
      await samplesPage.hoverOverColumnByIndex(i)
      await samplesPage.validateTotalReadPopupTest(COLUMN_HEADER_PROP[n[i]]["description"]);

      let articlePage = await samplesPage.clickLearnMoreLink()

      const link = COLUMN_HEADER_PROP[n[i]]["url"];
      await articlePage.validateUrlIncludesLinkText(link)
      await articlePage.close();
      
      await samplesPage.clickTableHeaderByIndex(i)
    }
  });

  test(`Should be able to filter by Taxon name`, async () => {
    // Search for data
    await samplesPage.fillSearchBar(KLEBSIELLA);
    await samplesPage.clickSearchResult(KLEBSIELLA_GENUS);

    // Verify filter result
    await samplesPage.validateFilterTags([KLEBSIELLA_GENUS])
    await samplesPage.validateTaxonsFilteredByName(KLEBSIELLA)
  });

  test("Should be able to filter by Name Type", async () => {
    const sampleReport = await samplesPage.getReportV2(sampleId);
    let taxonNames = await samplesPage.getTaxonNames(sampleReport)

    for (let option of NAME_TYPES) {
      await samplesPage.selectNameTypeOption(option)
      await samplesPage.validateReportFilteredByNameType(option, taxonNames[option])
    }
  });

  test(`Should be able to filter by Category name`, async () => {
    const expectedCategories = [
      "Archaea",
      "Bacteria",
      "Eukaryota",
      "Viroids",
      "Viruses",
      "Phage",
      "Uncategorized",
    ];

    // #region Validate filter by single category
    for (let i = 0; i < expectedCategories.length; i++) {
      await samplesPage.clickCategoriesFilter()
      await samplesPage.clickCategoriesOption(expectedCategories[i])

      let expectedTags = []
      if (expectedCategories[i] === 'Viruses') {
        expectedTags = [expectedCategories[i], expectedCategories[i+1]]
      } else {
        expectedTags = [expectedCategories[i]]
      }
      await samplesPage.validateFilterTags(expectedTags)
      await samplesPage.pressEscape()

      await samplesPage.removeFilterTags(expectedTags)
      await samplesPage.validateFilterTagVisiblity(expectedCategories[i], false)
    }
    // TODO: Expand to validate report way filtered by expected category

    // #endregion Validate filter by single category

    // #region Validate filter by mutiple category
    for (let i = 0; i < expectedCategories.length; i++) {
      await samplesPage.clickCategoriesFilter()
      await samplesPage.validateCategoryFilterAvailable(expectedCategories[i])
      await samplesPage.clickCategoriesOption(expectedCategories[i])
      await samplesPage.pressEscape()
    }
    // test Stats bar
    await samplesPage.validateFilterTagCount(
      expectedCategories.length - 1 // Phage
    )
    await samplesPage.validateStatsInfoNotEmpty()
    // #endregion Validate filter by mutiple category

    // #region Test Clear Filters button
    await samplesPage.clickClearFilters()
    await samplesPage.validateFilterTagCount(0)
    // #endregion Test Clear Filters button
  });

  test(`Should be able to filter by Threshold`, async () => {
    const sampleReport = await samplesPage.getReportV2(sampleId);
    await samplesPage.validateThresholdOptionFilterHasExpectedOptions(THRESHOLD_FILTERS)
  
    for (let thresholdOption of THRESHOLD_FILTERS) {
      for (let operator of THRESHOLD_COMPARISON_OPERATORS) {
        let thresholdValue = Math.floor(Math.random() * 10) + 1;
        await samplesPage.selectThresholdOptions(thresholdOption, operator, thresholdValue)
  
        await samplesPage.validateFilterTags([thresholdOption + ` ${operator} ${thresholdValue}`])
        await samplesPage.validateReportFilteredThreshold(thresholdOption, operator, thresholdValue, sampleReport)
  
        await samplesPage.clickFilterTagCloseIcon(operator)
      }
    }
  });

  test(`Should be able to filter by Read Specificity`, async () => {
    await samplesPage.validateReadSpecificityFiltersHasExpectedOptions(READ_SPECIFICITY_FILTERS);

    const sampleReport = await samplesPage.getReportV2(sampleId);
    const taxonNames = await samplesPage.getTaxonNames(sampleReport)
    const taxonNamesWithNoCategory = await samplesPage.getTaxonNamesWithNoCategory(sampleReport)
    const expectedTaxonNames = {
      "All": taxonNames.Scientific,
      "Specific Only": taxonNames.Scientific.filter(item => !taxonNamesWithNoCategory.includes(item))
    }

    for (let option of READ_SPECIFICITY_FILTERS) {
      await samplesPage.selectReadSpecificityOption(option)
      await samplesPage.validateReportFilteredByReadSpecificity(option, expectedTaxonNames[option])
    }
  });

  test(`Should be able to filter by Annotation`, async () => {
    await samplesPage.validateAnnotationFiltersHasExpectedOptions(ANNOTATION_FILTERS);

    // Verify filter are applied
    await samplesPage.validateReportFilteredByAnnotation(ANNOTATION_FILTERS);
  });
});
