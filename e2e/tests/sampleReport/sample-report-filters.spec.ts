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
  CATEGORY_NAMES
} from "../../constants/sample";
import { SamplesPage } from "../../page-objects/samples-page";

let sampleId = null;
let samplesPage = null

// These tests validate the user's proficiency in utilizing various filter functions on the sample report page, such as Nametype, Annotation, Category, Threshold filter, and Read specificity.
test.describe("Sample report filter test", () => {
  test.beforeEach(async ({ page }) => {
    samplesPage = new SamplesPage(page)

    let randomSample = await samplesPage.getRandomCompletedSample()
    sampleId = randomSample.id

    await samplesPage.navigate(sampleId)
  });

  test.afterEach(async () => {
    await samplesPage.close()
  });

  test(`Verify url displayed on the columns`, async () => {
    test.setTimeout(60000*5)
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
  });

  /**
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-2
   */
  test("Should be able to filter by Name Type", async () => {
    const sampleReport = await samplesPage.getReportV2(sampleId);
    let taxonNames = await samplesPage.getTaxonNames(sampleReport)

    for (let option of NAME_TYPES) {
      await samplesPage.selectNameTypeOption(option)
      await samplesPage.validateReportFilteredByNameType(option, taxonNames[option])
    }
  });

  /**
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-3
   */
  test(`Should be able to filter by Category name`, async () => {
    test.setTimeout(60000*5)
    const sampleReport = await samplesPage.getReportV2(sampleId);
    await samplesPage.clickExpandAll()

    // #region Validate filter by single category
    for (let i = 0; i < CATEGORY_NAMES.length; i++) {
      await samplesPage.toggleTableSort()
      await samplesPage.selectCategoryFilter(CATEGORY_NAMES[i])

      let expectedFilterTags = []
      if (CATEGORY_NAMES[i] === 'Viruses') {
        expectedFilterTags = [CATEGORY_NAMES[i], CATEGORY_NAMES[i+1]]
      } else {
        expectedFilterTags = [CATEGORY_NAMES[i]]
      }
      await samplesPage.validateFilterTags(expectedFilterTags)

      let expectedTaxonNames = await samplesPage.getTaxonNamesByCategory(sampleReport, [CATEGORY_NAMES[i]])
      await expectedTaxonNames.sort()
      await samplesPage.validateTaxonsArePresent(expectedTaxonNames);

      await samplesPage.removeFilterTags(expectedFilterTags)
      await samplesPage.validateFilterTagVisiblity(CATEGORY_NAMES[i], false)
    }
    // #endregion Validate filter by single category

    // #region Validate filter by mutiple category
    let mutipleCategories = []
    for (let i = 0; i < CATEGORY_NAMES.length; i++) {
      await samplesPage.toggleTableSort()
      await samplesPage.selectCategoryFilter(CATEGORY_NAMES[i])
      
      mutipleCategories.push(CATEGORY_NAMES[i])
      let expectedTaxonNames = await samplesPage.getTaxonNamesByCategory(sampleReport, mutipleCategories)
      await expectedTaxonNames.sort()
      await samplesPage.validateTaxonsArePresent(expectedTaxonNames);
    }
    // #endregion Validate filter by mutiple category

    // #region Test Stats bar
    await samplesPage.validateFilterTagCount(
      CATEGORY_NAMES.length - 1 // Phage
    )
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
    test.setTimeout(60000*10)
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
    const taxonNames = await samplesPage.getTaxonNames(sampleReport)
    const categories = [null]
    const taxonNamesWithNoCategory = await samplesPage.getTaxonNamesByCategory(sampleReport, categories)
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

  test(`Should be able to filter by multiple criteria`, async () => {
    const sampleReport = await samplesPage.getReportV2(sampleId);
    const category = 'Bacteria'
    const taxons = await samplesPage.getTaxonsByCategory(sampleReport, [category])
    const expectedTaxon = taxons[Math.floor(Math.random() * taxons.length)]

    const genus = await expectedTaxon.name.split(' ')[0]
    const expectedTagText = `${genus} (genus)`

    await samplesPage.selectCategoryFilter(category)
    await samplesPage.fillSearchBar(genus);
    await samplesPage.clickSearchResult(expectedTagText);

    await samplesPage.clickExpandAll()
    await samplesPage.validateTaxonsFilteredByName(genus)

    // Tag rank does not match expected
    await samplesPage.validateFilterTags([expectedTagText, category])
  });
});