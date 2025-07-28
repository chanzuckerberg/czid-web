import { WORKFLOWS } from "@e2e/constants/common";
import {
  ANNOTATION_FILTERS,
  COLUMN_HEADER_PROP,
  READ_SPECIFICITY_FILTERS,
  THRESHOLD_COMPARISON_OPERATORS,
  NAME_TYPES,
  CATEGORY_NAMES,
  VIRUSES,
  PHAGE,
  SCIENTIFIC,
  SPECIFIC_ONLY,
  SHORT_READS_THRESHOLDS,
  LONG_READS_THRESHOLDS,
} from "@e2e/constants/sample";
import { test, expect } from "@playwright/test";
import { SamplesPage } from "../../page-objects/samples-page";
import { ProjectPage } from "@e2e/page-objects/project-page";

const THRESHOLD_FILTERS = {
  mngs: SHORT_READS_THRESHOLDS,
  ONT: LONG_READS_THRESHOLDS,
};
let projectPage = null;
let sampleId = null;
let samplesPage = null;
const uploadWorkflows = [WORKFLOWS.MNGS, WORKFLOWS.LMNGS];

// These tests validate the user's proficiency in utilizing various filter functions on the sample report page, such as Nametype, Annotation, Category, Threshold filter, and Read specificity.
test.describe("Sample report filter test", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    samplesPage = new SamplesPage(page);
    projectPage = new ProjectPage(page);
  });

  test(`Verify url displayed on the columns`, async () => {
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}`,
    );
    const samples = await samplesPage.getCompletedSamples(project.name);
    const testSamples = samples.filter(
      sample => sample.name.includes("RR004_water"),
    );
    const randomSample =
      testSamples[Math.floor(Math.random() * testSamples.length)];
    const sampleId = randomSample.id;
    await samplesPage.navigate(sampleId);

    await samplesPage.validateColumnsVisible();

    const n = await samplesPage.getAllColumnText();
    for (let i = 1; i < n.length; i++) {
      await samplesPage.hoverOverColumnByIndex(i);
      const prop = await COLUMN_HEADER_PROP[n[i]];
      await samplesPage.validateTotalReadPopupTest(await prop.description);

      const articlePage = await samplesPage.clickLearnMoreLink();

      const link = COLUMN_HEADER_PROP[n[i]]["url"];
      await articlePage.validateUrlIncludesLinkText(link);
      await articlePage.close();

      await samplesPage.clickTableHeaderByIndex(i);
    }
  });

  for (const workflow of uploadWorkflows) {
    /**
     * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-1
     */
    test(`Smoke Test: Should be able to filter by Taxon name ${workflow}`, async () => {
      const project = await projectPage.getOrCreateProject(
        `automation_project_${workflow}`,
      );
      const randomSample = await samplesPage.getRandomCompletedSample(
        project.name,
      );
      sampleId = randomSample.id;
      await samplesPage.navigate(sampleId);

      const sampleReport = await samplesPage.getReportV2(sampleId);
      const taxons = await samplesPage.getSpecificTaxons(sampleReport);

      const taxon = taxons[Math.floor(Math.random() * taxons.length)];
      expect(taxon).toBeDefined();

      const genus = await taxon.name.split(" ")[0];
      await samplesPage.fillSearchBar(genus);
      const searchResults = await samplesPage.getSearchResults();

      expect(searchResults.length >= 1).toBeTruthy();
      const expectedTagText = searchResults[0];

      await samplesPage.clickSearchResult(expectedTagText);

      // Search for data
      await samplesPage.fillSearchBar(genus);
      await samplesPage.clickSearchResult(expectedTagText);
      await samplesPage.clickExpandAll();

      // Verify filter result
      await samplesPage.validateTaxonsFilteredByName(genus);
      await samplesPage.validateFilterTags([expectedTagText]);
      await samplesPage.validateTaxonIsVisible(taxon.name);
    });
  }

  for (const workflow of uploadWorkflows) {
    /**
     * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-2
     */
    test(`Smoke Test: Should be able to filter by Name Type ${workflow}`, async () => {
      const project = await projectPage.getOrCreateProject(
        `automation_project_${workflow}`,
      );
      const randomSample = await samplesPage.getRandomCompletedSample(
        project.name,
      );
      sampleId = randomSample.id;
      await samplesPage.navigate(sampleId);

      const sampleReport = await samplesPage.getReportV2(sampleId);
      const taxonNames = await samplesPage.getTaxonNamesFromReport(
        sampleReport,
      );

      for (const option of NAME_TYPES) {
        await samplesPage.selectNameTypeOption(option);
        await samplesPage.validateReportFilteredByNameType(
          option,
          taxonNames[option],
        );
      }
    });
  }

  for (const workflow of uploadWorkflows) {
    /**
     * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-3
     */
    test(`Smoke Test: Should be able to filter by Category name ${workflow}`, async () => {
      test.setTimeout(1000 * 60 * 10);
      const project = await projectPage.getOrCreateProject(
        `automation_project_${workflow}`,
      );
      const randomSample = await samplesPage.getRandomCompletedSample(
        project.name,
      );
      sampleId = randomSample.id;
      await samplesPage.navigate(sampleId);

      const sampleReport = await samplesPage.getReportV2(sampleId);
      await samplesPage.clickExpandAll();
      await samplesPage.clickSortByName();

      const filterCategories = [...CATEGORY_NAMES]
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      // #region Validate filter by single category
      for (let i = 0; i < filterCategories.length; i++) {
        await samplesPage.selectCategoryFilter(filterCategories[i]);
        await samplesPage.toggleSortByName();

        const expectedFilterTags =
          filterCategories[i] === VIRUSES
            ? [VIRUSES, PHAGE]
            : [filterCategories[i]];
        await samplesPage.validateFilterTags(expectedFilterTags);

        const expectedTaxonNames =
          await samplesPage.getTaxonNamesFromReportByCategory(sampleReport, [
            filterCategories[i],
          ]);
        await expectedTaxonNames.sort();
        await samplesPage.validateTaxonsAreVisible(expectedTaxonNames);

        await samplesPage.removeFilterTags(expectedFilterTags);
        await samplesPage.validateFilterTagVisiblity(
          filterCategories[i],
          false,
        );
      }
      // #endregion Validate filter by single category

      // #region Validate filter by mutiple category
      const mutipleCategories = [];
      for (let i = 0; i < filterCategories.length; i++) {
        await samplesPage.selectCategoryFilter(filterCategories[i]);
        await samplesPage.toggleSortByName();

        mutipleCategories.push(filterCategories[i]);
        const expectedTaxonNames =
          await samplesPage.getTaxonNamesFromReportByCategory(
            sampleReport,
            mutipleCategories,
          );
        await expectedTaxonNames.sort();
        await samplesPage.validateTaxonsAreVisible(expectedTaxonNames);
      }
      // #endregion Validate filter by mutiple category

      // #region Test Stats bar

      // #region Viruses and Phase
      let expectedTags = null;
      const virusesAndNotPhage =
        filterCategories.includes(VIRUSES) && !filterCategories.includes(PHAGE);
      if (virusesAndNotPhage) {
        // Add Phage to expectedTags when Virus is selected
        expectedTags = [...filterCategories, PHAGE];
      } else {
        // The expectedTags should match the filterCategories
        expectedTags = filterCategories;
      }
      // #endregion Viruses and Phase

      await samplesPage.validateFilterTagCount(expectedTags.length);
      await samplesPage.validateStatsInfoNotEmpty();
      // #endregion Test Stats bar

      // #region Test Clear Filters button
      await samplesPage.clickClearFilters();
      await samplesPage.validateFilterTagCount(0);
      // #endregion Test Clear Filters button
    });
  }

  for (const workflow of uploadWorkflows) {
    /**
     * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-4
     */
    test(`Smoke Test: Should be able to filter by Threshold ${workflow}`, async () => {
      test.setTimeout(60 * 1000 * 5); // This test sometime takes slightly longer to complete
      const project = await projectPage.getOrCreateProject(
        `automation_project_${workflow}`,
      );
      const randomSample = await samplesPage.getRandomCompletedSample(
        project.name,
      );
      sampleId = randomSample.id;
      await samplesPage.navigate(sampleId);

      await samplesPage.validateThresholdOptionFilterHasExpectedOptions(
        THRESHOLD_FILTERS[workflow],
      );

      const thresholdOptions = [...THRESHOLD_FILTERS[workflow]]
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      for (const thresholdOption of thresholdOptions) {
        for (const operator of THRESHOLD_COMPARISON_OPERATORS) {
          const thresholdValue = Math.floor(Math.random() * 10) + 1;
          await samplesPage.selectThresholdOptions(
            thresholdOption.text,
            operator,
            thresholdValue,
          );

          await samplesPage.validateFilterTags([
            thresholdOption.text + ` ${operator} ${thresholdValue}`,
          ]);
          await samplesPage.validateReportFilteredThreshold(
            thresholdOption.text,
            operator,
            thresholdValue,
          );

          await samplesPage.clickFilterTagCloseIcon(operator);
        }
      }
    });
  }

  for (const workflow of uploadWorkflows) {
    /**
     * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-5
     */
    test(`Smoke Test: Should be able to filter by Read Specificity ${workflow}`, async () => {
      const project = await projectPage.getOrCreateProject(
        `automation_project_${workflow}`,
      );
      const randomSample = await samplesPage.getRandomCompletedSample(
        project.name,
      );
      sampleId = randomSample.id;
      await samplesPage.navigate(sampleId);

      await samplesPage.validateReadSpecificityFiltersHasExpectedOptions(
        READ_SPECIFICITY_FILTERS,
      );

      const sampleReport = await samplesPage.getReportV2(sampleId);
      const taxonNames = await samplesPage.getTaxonNamesFromReport(
        sampleReport,
      );
      const categories = [null];
      const taxonNamesWithNoCategory =
        await samplesPage.getTaxonNamesFromReportByCategory(
          sampleReport,
          categories,
        );
      const expectedTaxonNames = {
        All: taxonNames.Scientific,
        "Specific Only": taxonNames.Scientific.filter(
          item => !taxonNamesWithNoCategory.includes(item),
        ),
      };

      for (const option of READ_SPECIFICITY_FILTERS) {
        await samplesPage.selectReadSpecificityOption(option);
        await samplesPage.validateReportFilteredByReadSpecificity(
          option,
          expectedTaxonNames[option],
        );
      }
    });
  }

  for (const workflow of uploadWorkflows) {
    /**
     * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-6
     */
    test(`Smoke Test: Should be able to filter by Annotation ${workflow}`, async () => {
      const project = await projectPage.getOrCreateProject(
        `automation_project_${workflow}`,
      );
      const randomSample = await samplesPage.getRandomCompletedSample(
        project.name,
      );
      sampleId = randomSample.id;
      await samplesPage.navigate(sampleId);

      await samplesPage.validateAnnotationFiltersHasExpectedOptions(
        ANNOTATION_FILTERS,
      );

      await samplesPage.validateReportFilteredByAnnotation(ANNOTATION_FILTERS);
    });
  }

  for (const workflow of uploadWorkflows) {
    /**
     * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-7
     */
    test(`Should be able to filter by multiple criteria ${workflow}`, async () => {
      const project = await projectPage.getOrCreateProject(
        `automation_project_${workflow}`,
      );
      const randomSample = await samplesPage.getRandomCompletedSample(
        project.name,
      );
      sampleId = randomSample.id;
      await samplesPage.navigate(sampleId);

      const sampleReport = await samplesPage.getReportV2(sampleId);

      const categories = await samplesPage.getTaxonCategories(sampleReport);
      let category = categories[Math.floor(Math.random() * categories.length)];

      category = category.charAt(0).toUpperCase() + category.slice(1);

      const taxons = await samplesPage.getTaxonsByCategory(sampleReport, [
        category,
      ]);
      const taxon = taxons[Math.floor(Math.random() * taxons.length)];

      const genus = await taxon.name.split(" ")[0];

      // Filter by Scientific name only
      await samplesPage.selectNameTypeOption(SCIENTIFIC);

      // Filter by Read Specificity
      await samplesPage.selectReadSpecificityOption(SPECIFIC_ONLY);

      // Filter by Category
      await samplesPage.selectCategoryFilter(category);

      // Filter by Taxon name
      await samplesPage.fillSearchBar(genus);
      const searchResults = await samplesPage.getSearchResults();

      expect(searchResults.length >= 1).toBeTruthy();
      const searchResultText = searchResults[0];
      await samplesPage.clickSearchResult(searchResultText);

      await samplesPage.clickExpandAll();
      await samplesPage.validateTaxonsFilteredByName(genus);
      await samplesPage.validateTaxonIsVisible(taxon.name);

      const expectedFilterTags =
        category === VIRUSES
          ? [searchResultText, category, PHAGE]
          : [searchResultText, category];
      await samplesPage.validateFilterTags(expectedFilterTags);
    });
  }
});
