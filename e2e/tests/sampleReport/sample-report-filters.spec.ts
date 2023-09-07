import { test } from "@playwright/test";
import {
  ANNOTATION_FILTERS,
  COLUMN_HEADER_PROP,
  SPECIFIC_ONLY,
  READ_SPECIFICITY_FILTERS,
  THRESHOLD_FILTERS,
  THRESHOLD_COMPARISON_OPERATORS,
  NAME_TYPES,
  CATEGORY_NAMES,
  BACTERIA,
  VIRUSES,
  PHAGE,
  SCIENTIFIC
} from "../../constants/sample";
import { SamplesPage } from "../../page-objects/samples-page";

let sampleId = null;
let samplesPage = null

// These tests validate the user's proficiency in utilizing various filter functions on the sample report page, such as Nametype, Annotation, Category, Threshold filter, and Read specificity.
test.describe("Sample report filter test", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000*5)
    samplesPage = new SamplesPage(page)

    let randomSample = await samplesPage.getRandomCompletedSample()
    sampleId = randomSample.id

    await samplesPage.navigate(sampleId)
  });

  test.afterEach(async () => {
    await samplesPage.close()
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

  /**
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-1
   */
  test(`Should be able to filter by Taxon name`, async () => {
    const sampleReport = await samplesPage.getReportV2(sampleId);
    const taxons = await samplesPage.getSpecificTaxons(sampleReport)

    const taxon = taxons[Math.floor(Math.random() * taxons.length)]
    const genus = await taxon.name.split(' ')[0]
    const expectedTagText = `${genus} (genus)`

    // Search for data
    await samplesPage.fillSearchBar(genus);
    await samplesPage.clickSearchResult(expectedTagText);
    await samplesPage.clickExpandAll()

    // Verify filter result
    await samplesPage.validateTaxonsFilteredByName(genus)
    await samplesPage.validateFilterTags([expectedTagText])
    await samplesPage.validateTaxonIsVisible(taxon.name)
  });

  /**
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-2
   */
  test("Should be able to filter by Name Type", async () => {
    const sampleReport = await samplesPage.getReportV2(sampleId);
    let taxonNames = await samplesPage.getTaxonNamesFromReport(sampleReport)

    for (let option of NAME_TYPES) {
      await samplesPage.selectNameTypeOption(option)
      await samplesPage.validateReportFilteredByNameType(option, taxonNames[option])
    }
  });

  /**
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-3
   */
  test(`Should be able to filter by Category name`, async () => {
    const sampleReport = await samplesPage.getReportV2(sampleId);
    await samplesPage.clickExpandAll()
    await samplesPage.ClickSortByName()

    const filter_categories = [...CATEGORY_NAMES].sort(() => 0.5 - Math.random()).slice(0, 2);

    // #region Validate filter by single category
    for (let i = 0; i < filter_categories.length; i++) {
      await samplesPage.selectCategoryFilter(filter_categories[i])
      await samplesPage.toggleSortByName()

      let expectedFilterTags = filter_categories[i] === VIRUSES ? [VIRUSES, PHAGE] : [filter_categories[i]];
      await samplesPage.validateFilterTags(expectedFilterTags)

      let expectedTaxonNames = await samplesPage.getTaxonNamesFromReportByCategory(sampleReport, [filter_categories[i]])
      await expectedTaxonNames.sort()
      await samplesPage.validateTaxonsAreVisible(expectedTaxonNames);

      await samplesPage.removeFilterTags(expectedFilterTags)
      await samplesPage.validateFilterTagVisiblity(filter_categories[i], false)
    }
    // #endregion Validate filter by single category

    // #region Validate filter by mutiple category
    let mutipleCategories = []
    for (let i = 0; i < filter_categories.length; i++) {
      await samplesPage.selectCategoryFilter(filter_categories[i])
      await samplesPage.toggleSortByName()
      
      mutipleCategories.push(filter_categories[i])
      let expectedTaxonNames = await samplesPage.getTaxonNamesFromReportByCategory(sampleReport, mutipleCategories)
      await expectedTaxonNames.sort()
      await samplesPage.validateTaxonsAreVisible(expectedTaxonNames);
    }
    // #endregion Validate filter by mutiple category

    // #region Test Stats bar
    let expectedTags = filter_categories.includes(VIRUSES) && !filter_categories.includes(PHAGE) 
      ? [...filter_categories, PHAGE]
      : (filter_categories.includes(VIRUSES) && filter_categories.includes(PHAGE))
      ? filter_categories.filter(category => category !== PHAGE)
      : filter_categories;
    await samplesPage.validateFilterTagCount(expectedTags.length)
    await samplesPage.validateStatsInfoNotEmpty()
    // #endregion Test Stats bar

    // #region Test Clear Filters button
    await samplesPage.clickClearFilters()
    await samplesPage.validateFilterTagCount(0)
    // #endregion Test Clear Filters button
  });

  /**
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-4
   */
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

  /**
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-5
   */
  test(`Should be able to filter by Read Specificity`, async () => {
    await samplesPage.validateReadSpecificityFiltersHasExpectedOptions(READ_SPECIFICITY_FILTERS);

    const sampleReport = await samplesPage.getReportV2(sampleId);
    const taxonNames = await samplesPage.getTaxonNamesFromReport(sampleReport)
    const categories = [null]
    const taxonNamesWithNoCategory = await samplesPage.getTaxonNamesFromReportByCategory(sampleReport, categories)
    const expectedTaxonNames = {
      "All": taxonNames.Scientific,
      "Specific Only": taxonNames.Scientific.filter(item => !taxonNamesWithNoCategory.includes(item))
    }

    for (let option of READ_SPECIFICITY_FILTERS) {
      await samplesPage.selectReadSpecificityOption(option)
      await samplesPage.validateReportFilteredByReadSpecificity(option, expectedTaxonNames[option])
    }
  });

  /**
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-6
   */
  test(`Should be able to filter by Annotation`, async () => {
    await samplesPage.validateAnnotationFiltersHasExpectedOptions(ANNOTATION_FILTERS);

    // Verify filter are applied
    await samplesPage.validateReportFilteredByAnnotation(ANNOTATION_FILTERS);
  });

  /**
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-7
   */
  test(`Should be able to filter by multiple criteria`, async () => {
    const sampleReport = await samplesPage.getReportV2(sampleId);

    const category = BACTERIA
    const taxons = await samplesPage.getTaxonsByCategory(sampleReport, [category])
    const taxon = taxons[Math.floor(Math.random() * taxons.length)]

    const genus = await taxon.name.split(' ')[0]
    const searchResultText = `${genus} (genus)`

    // Filter by Scientific name only
    await samplesPage.selectNameTypeOption(SCIENTIFIC)

    // Filter by Read Specificity
    await samplesPage.selectReadSpecificityOption(SPECIFIC_ONLY)

    // Filter by Category
    await samplesPage.selectCategoryFilter(category)

    // Filter by Taxon name
    await samplesPage.filterByName(genus, searchResultText);
    
    await samplesPage.clickExpandAll()
    await samplesPage.validateTaxonsFilteredByName(genus)
    await samplesPage.validateTaxonIsVisible(taxon.name)

    await samplesPage.validateFilterTags([searchResultText, category])
  });
});