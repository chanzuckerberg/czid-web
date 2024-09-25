import AdmZip from "adm-zip";
import { WORKFLOWS } from "@e2e/constants/common";
import { E_COLI_CFXA_R1, E_COLI_CFXA_R2, E_COLI_CFXA_SAMPLE_NAME } from "@e2e/constants/sample";
import { ProjectPage } from "@e2e/page-objects/project-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import { compareCSVDownloadToFixture, getFixturePathForSampleDownload, getNumberOfLinesInFile, numSequencesInDownloadFasta, numSequencesInDownloadFixtureFasta } from "@e2e/utils/download";
import { DOWNLOAD_TYPES_OPTIONS_MAP } from "@e2e/page-objects/samples-page";

const PROJECT_NAME_SUFFIX = "ecoli_cfxA_sample_report"

const TEST_TIMEOUT = 60 * 1000 * 20;

const RUN_PIPELINE = false;
const WAIT_FOR_PIPELINE = false;

const SAMPLE_NAMES_TO_WAIT_FOR = [E_COLI_CFXA_SAMPLE_NAME];
const CFXA_GENE = "CfxA";

const HIGH_LEVEL_DRUG_CLASS_COLUMN_HEADER = "High-level Drug Class";

const ADDITIONAL_CONTIGS_COLUMNS_ON_EXPAND = [
  "Contig SpeciesBETA"
];

// %Cov_11 is the generated key for the second %Cov header in the table
// That key is removed when we collapse the contigs columngs
const REMOVED_CONTIGS_COLUMNS_ON_COLLAPSE = [
  "Cutoff",
  "%Cov_11",
  "%Id",
  "Contig SpeciesBETA"
];

const ADDITIONAL_READS_COLUMNS_ON_EXPAND = [
  "Read SpeciesBETA"
];
const REMOVED_READS_COLUMNS_ON_COLLAPSE = [
  "rPM",
  "%Cov",
  "Cov. Depth",
  "dPM",
  "Read SpeciesBETA"
];

const THRESHOLD_FILTERS_NUMBER_OF_READS = "Number of Reads";
const THRESHOLD_VALUE_NUM_READS = 200;

const MARA_GENE_NAME = "marA";
const FIXTURE_PATH = `AMR/${E_COLI_CFXA_SAMPLE_NAME}`;

let project = null;
let projectPage = null;
let samplesPage = null;
let sampleName = null;

const getAmrProjectName = (): string => {
  return `automation_project_${WORKFLOWS.AMR}_${PROJECT_NAME_SUFFIX}`;
}

const verifyExpectedColumnsChange = (expectedColumnChanges: string[], actualColumns: string[], columnIncluded = true) => (
  expectedColumnChanges.every((column) => actualColumns.includes(column) === columnIncluded)
);

test.describe(`AMR Sample Report tests for ${E_COLI_CFXA_SAMPLE_NAME}`, () => {
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region Setup project
    const page = await browser.newPage();
    projectPage = new ProjectPage(page);
    project = await projectPage.getOrCreateProject(getAmrProjectName());
    // #endregion Setup project

    // #region delete samples older than 1 month
    await projectPage.deleteSamplesOlderThanGivenMonths(project, WORKFLOWS.AMR, 1);
    // #endregion delete samples older than 1 month

    // #region Setup samples
    await setupSamples(
      page,
      project,
      [E_COLI_CFXA_R1, E_COLI_CFXA_R2],
      SAMPLE_NAMES_TO_WAIT_FOR,
      WORKFLOWS.AMR,
      {
        hostOrganism: "Unknown",
        runPipeline: RUN_PIPELINE,
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion Setup samples

    await projectPage.waitForSamplesComplete(project.id, WORKFLOWS.AMR, SAMPLE_NAMES_TO_WAIT_FOR, TEST_TIMEOUT);
    // TODO: are these two click necessary?  Check for case where sample is uploaded by test
    await projectPage.navigateToSamples(project.id, WORKFLOWS.AMR);
    await projectPage.clickAntimicrobialTab();

    sampleName = (await projectPage.selectCompletedSamples(1))[0];
    expect(sampleName.startsWith(E_COLI_CFXA_SAMPLE_NAME)).toBeTruthy();

    samplesPage = await projectPage.clickSample(sampleName);
  });

  test.describe("Sample report table", () => {
    test("SNo 6: Verify cfxA gene is in report", async () => {
      const reportTable = await samplesPage.getAntimicrobialResistanceTable();

      const cfxaGenePresent = reportTable.findIndex((geneRow) => geneRow["Gene"] === CFXA_GENE) >= 0;
      expect(cfxaGenePresent).toBeTruthy();
    });

    test("SNo 7: Drug class filter", async () => {
      const DRUG_CLASS_FOR_FILTER = "cephalosporin";

      // #region Get initial full report table
      const reportTableRowsBefore = (await samplesPage.getAntimicrobialResistanceTable(2, 9)).length;
      // #endregion Get initial full report table

      // #region Apply drug class filter
      await samplesPage.clickFilterPanelTrigger();
      await samplesPage.clickDrugClassFilter();
      await samplesPage.clickDrugClassFilterOption(DRUG_CLASS_FOR_FILTER);
      // #endregion Apply drug class filter

      // #region Validate drug class filter reduces number of genes, and remaining genes contain drug class
      const reportTableAfter = await samplesPage.getAntimicrobialResistanceTable(2, 3);
      const reportTableRowsAfter = reportTableAfter.length;
      expect(reportTableRowsAfter).toBeLessThan(reportTableRowsBefore);
      const anyGenesWithoutFilteredDrug = reportTableAfter.some(
        (row) => !row["Drug Class"].includes(DRUG_CLASS_FOR_FILTER)
      );
      expect(anyGenesWithoutFilteredDrug).toBeFalsy();
      // #endregion Validate drug class filter reduces number of genes, and remaining genes contain drug class
    });

    test("SNo 8: Verify High level drug class column present", async () => {
      const reportTable = await samplesPage.getAntimicrobialResistanceTable(2, 3);

      const firstGeneRow = reportTable[0];
      const columnHeaders = Object.keys(firstGeneRow);
      expect(columnHeaders).toContain(HIGH_LEVEL_DRUG_CLASS_COLUMN_HEADER);
    });

    test("SNo 9: Verify expanded and collapse contigs and reads columns", async () => {
      let reportTable = await samplesPage.getAntimicrobialResistanceTable(2, 3);

      // #region Expand contigs columns and verify additional columns are present
      await samplesPage.clickAmrTableContigsHeader();
      reportTable = await samplesPage.getAntimicrobialResistanceTable(2, 3);
      const expandedContigColumns = Object.keys(reportTable[0]);

      expect(verifyExpectedColumnsChange(ADDITIONAL_CONTIGS_COLUMNS_ON_EXPAND, expandedContigColumns, true)).toBeTruthy();
      // #endregion Expand contigs columns and verify additional columns are present

      // #region Collapse contigs columns and verify columns are removed
      await samplesPage.clickAmrTableContigsHeader();
      reportTable = await samplesPage.getAntimicrobialResistanceTable(2, 3);
      const collapsedContigColumns = Object.keys(reportTable[0]);
      expect(verifyExpectedColumnsChange(REMOVED_CONTIGS_COLUMNS_ON_COLLAPSE, collapsedContigColumns, false)).toBeTruthy();
      // #endregion Collapse contigs columns and verify columns are removed

      // #region Expand reads columns and verify additional columns are present
      await samplesPage.clickAmrTableReadsHeader();
      reportTable = await samplesPage.getAntimicrobialResistanceTable(2, 3);
      const expandedReadsColumns = Object.keys(reportTable[0]);
      expect(verifyExpectedColumnsChange(ADDITIONAL_READS_COLUMNS_ON_EXPAND, expandedReadsColumns, true)).toBeTruthy();
      // #endregion Expand reads columns and verify additional columns are present

      // #region Collapse reads columns and verify columns are removed
      await samplesPage.clickAmrTableReadsHeader();
      reportTable = await samplesPage.getAntimicrobialResistanceTable(2, 3);
      const collapsedReadsColumns = Object.keys(reportTable[0]);
      expect(verifyExpectedColumnsChange(REMOVED_READS_COLUMNS_ON_COLLAPSE, collapsedReadsColumns, false)).toBeTruthy();
      // #endregion Collapse reads columns and verify columns are removed
    });

    test("SNo 10: Verify sample report table sorting", async () => {
      // #region Click gene column to sort descending and get gene names from table
      await samplesPage.clickAmrTableGeneColumn();
      const descendingSortedGeneNames = (await samplesPage.getAntimicrobialResistanceTable(2, 9)).map((row) => row["Gene"]);
      // #endregion Sort by gene and get gene names from table

      // #region Verify gene names are sorted alphabetically in descending order
      let geneNamesSortedDescending = true;
      for (let i = 1; i < descendingSortedGeneNames.length; i++) {
        if (descendingSortedGeneNames[i].localeCompare(descendingSortedGeneNames[i - 1]) >= 0) {
          geneNamesSortedDescending = false;
          break;
        }
      }
      expect(geneNamesSortedDescending).toBeTruthy();
      // #endregion Verify gene names are sorted alphabetically in descending order

      // #region Click gene column to sort ascending and get gene names from table
      await samplesPage.clickAmrTableGeneColumn();
      const ascendingSortedGeneNames = (await samplesPage.getAntimicrobialResistanceTable(2, 9)).map((row) => row["Gene"]);
      // #endregion Sort by gene and get gene names from table

      // #region Verify gene names are sorted alphabetically in ascending order
      let geneNamesSortedAscending = true;
      for (let i = 1; i < ascendingSortedGeneNames.length; i++) {
        if (ascendingSortedGeneNames[i].localeCompare(ascendingSortedGeneNames[i - 1]) <= 0) {
          geneNamesSortedAscending = false;
          break;
        }
      }
      expect(geneNamesSortedAscending).toBeTruthy();
      // #endregion Verify gene names are sorted alphabetically in ascending order
    });

    // TODO: skip this test for staging until testing new data-testid's in staging
    test.skip("SNo 11: Verify Reads filter", async () => {
      // #region Get initial full report table
      const reportTableNumRowsBefore = (await samplesPage.getAntimicrobialResistanceTable(2, 9)).length;
      // #endregion Get initial full report table

      // #region Apply reads filter
      await samplesPage.selectAmrThresholdOption(THRESHOLD_FILTERS_NUMBER_OF_READS, THRESHOLD_VALUE_NUM_READS)
      // #endregion Apply reads filter

      // #region Validate reads filter reduces number of rows and each row meets threshold
      const reportTableRowsAfter = (await samplesPage.getAntimicrobialResistanceTable(2, 9));
      expect(reportTableRowsAfter.length).toBeLessThan(reportTableNumRowsBefore);

      const allRowsMeetThreshold = reportTableRowsAfter.every((row) => row["Reads"] >= THRESHOLD_VALUE_NUM_READS);
      expect(allRowsMeetThreshold).toBeTruthy();
      // #endregion Validate reads filter reduces number of rows and each row meets threshold
    });

    // TODO: skip this test for staging until testing new data-testid's in staging
    test.skip("SNo 20: Verify sample report persistence", async () => {
      const columnToAdd = "Gene Family";

      // #region Verify that the column is not present in the table
      const initialFirstGeneRow = (await samplesPage.getAntimicrobialResistanceTable(2, 1))[0];
      const initialColumnHeaders = Object.keys(initialFirstGeneRow);
      expect(initialColumnHeaders).not.toContain(columnToAdd);
      // #endregion Verify that the column is not present in the table

      // #region Add `Gene Family` to visible columns using the dropdown menu and verify that it is present
      await samplesPage.clickAmrTableToggleColumns();
      await samplesPage.clickAmrTableColumnOption(columnToAdd);
      // #endregion Add `Gene Family` to visible columns using the dropdown menu and verify that it is present

      const firstGeneRow = (await samplesPage.getAntimicrobialResistanceTable(2, 1))[0];
      const columnHeaders = Object.keys(firstGeneRow);
      expect(columnHeaders).toContain(columnToAdd);

      // #region Refresh the page and verify that the same columns show
      await samplesPage.reload();
      const firstGeneRowReload = (await samplesPage.getAntimicrobialResistanceTable(2, 1))[0];
      const columnHeadersReload = Object.keys(firstGeneRowReload);
      expect(columnHeadersReload).toContain(columnToAdd);
      // #endregion Refresh the page and verify that the same columns show

      // #region Change the visible columns using the show/hide section arrow buttons
      await samplesPage.clickAmrTableContigsHeader();
      const firstGeneRowContigsExpanded = (await samplesPage.getAntimicrobialResistanceTable(2, 1))[0];
      const columnHeadersContigsExpanded = Object.keys(firstGeneRowContigsExpanded);
      expect(verifyExpectedColumnsChange(ADDITIONAL_CONTIGS_COLUMNS_ON_EXPAND, columnHeadersContigsExpanded, true)).toBeTruthy();

      // #region Refresh page and verify that the same columns show
      await samplesPage.reload();
      const firstGeneRowContigsExpandedReload = (await samplesPage.getAntimicrobialResistanceTable(2, 1))[0];
      const columnHeadersContigsExpandedReload = Object.keys(firstGeneRowContigsExpandedReload);
      expect(verifyExpectedColumnsChange(ADDITIONAL_CONTIGS_COLUMNS_ON_EXPAND, columnHeadersContigsExpandedReload, true)).toBeTruthy();
      // #endregion Refresh page and verify that the same columns show
    });
  });

  test.describe("Sample report downloads", () => {
    test("SNo 12: Verify reads per gene download", async () => {
      // #region expand viewport to ensure gene is visible, click download for gene
      await samplesPage.zoomOut(2, 9);
      const marAGeneReadsFastaDownload = await samplesPage.clickAmrGeneDownloadButton(MARA_GENE_NAME, "reads");
      // #endregion expand viewport to ensure gene is visible, click download for gene

      // #region Verify number of sequences in downloaded file
      const downloadNumSequences = await numSequencesInDownloadFasta(marAGeneReadsFastaDownload);
      const expectedNumSequences = await numSequencesInDownloadFixtureFasta(marAGeneReadsFastaDownload, FIXTURE_PATH);
      expect(downloadNumSequences).toEqual(expectedNumSequences);
      // #endregion Verify number of sequences in downloaded file
    });

    test("SNo 13: Verify contigs per gene download", async () => {
      // #region expand viewport to ensure gene is visible, click download for gene
      await samplesPage.zoomOut(2, 9);
      const marAGeneContigsFastaDownload = await samplesPage.clickAmrGeneDownloadButton(MARA_GENE_NAME, "contigs");
      // #endregion expand viewport to ensure gene is visible, click download for gene

      // #region Verify number of sequences in downloaded file
      const downloadNumSequences = await numSequencesInDownloadFasta(marAGeneContigsFastaDownload);
      const expectedNumSequences = await numSequencesInDownloadFixtureFasta(marAGeneContigsFastaDownload, FIXTURE_PATH);
      expect(downloadNumSequences).toEqual(expectedNumSequences);
      // #endregion Verify number of sequences in downloaded file
    });

    test("SNo 14: Verify report table CSV download", async () => {
      // #region download report table CSV file
      await samplesPage.clickDownloadButton();
      const reportTableDownload = await samplesPage.clickDownloadOption(DOWNLOAD_TYPES_OPTIONS_MAP["report_table"]);
      // #endregion download non-host reads file

      // #region Compare downloaded CSV to fixture
      const collectedAssertions = await compareCSVDownloadToFixture(
        reportTableDownload,
        FIXTURE_PATH,
        sampleName,
        E_COLI_CFXA_SAMPLE_NAME,
      );
      collectedAssertions.throwIfAny();
      // #endregion Compare downloaded CSV to fixture
    });

    // TODO: skip this test for staging until testing new data-testid's in staging
    test.skip("SNo 15: Verify report table with filters CSV download", async () => {
      // #region Apply reads filter
      await samplesPage.selectAmrThresholdOption(THRESHOLD_FILTERS_NUMBER_OF_READS, THRESHOLD_VALUE_NUM_READS)
      // #endregion Apply reads filter

      // #region download report table CSV file
      await samplesPage.clickDownloadButton();
      const reportTableDownload = await samplesPage.clickDownloadOption(DOWNLOAD_TYPES_OPTIONS_MAP["report_table_filters"]);
      // #endregion download non-host reads file

      // #region Compare downloaded CSV to fixture
      const collectedAssertions = await compareCSVDownloadToFixture(
        reportTableDownload,
        FIXTURE_PATH,
        sampleName,
        E_COLI_CFXA_SAMPLE_NAME,
        { comment: "#", comment_no_infix: true },
      );
      collectedAssertions.throwIfAny();
      // #endregion Compare downloaded CSV to fixture
    })

    test("SNo 16: Verify sample non-host reads download", async () => {
      // This test hardcodes the expected number of sequences in the downloaded file
      // to avoid putting a large fixture file in the codebase
      const EXPECTED_NUMBER_OF_SEQUENCES = 926_928;
      const sequenceCountTolerance = 0.01;

      // #region download non-host reads file
      await samplesPage.clickDownloadButton();
      const nonHostReadsFastaDownload = await samplesPage.clickDownloadOption(DOWNLOAD_TYPES_OPTIONS_MAP["non_host_reads"]);
      // #endregion download non-host reads file

      // #region Verify number of sequences in downloaded file
      const nonHostReadsNumSequences = await numSequencesInDownloadFasta(nonHostReadsFastaDownload);
      const maximumSequenceCountDiff = Math.ceil(EXPECTED_NUMBER_OF_SEQUENCES * sequenceCountTolerance);
      const sequenceCountDiff = Math.abs(nonHostReadsNumSequences - EXPECTED_NUMBER_OF_SEQUENCES);
      expect(sequenceCountDiff).toBeLessThan(maximumSequenceCountDiff);
      // #endregion Verify number of sequences in downloaded file
    });

    test("SNo 17: Verify sample non-host contigs download", async () => {
      const sequenceCountTolerance = 0.05;

      // #region download non-host contigs file
      await samplesPage.clickDownloadButton();
      const nonHostContigsFastaDownload = await samplesPage.clickDownloadOption(DOWNLOAD_TYPES_OPTIONS_MAP["non_host_contigs"]);
      // #endregion download non-host contigs file

      // #region Verify number of sequences in downloaded file
      const downloadNumSequences = await numSequencesInDownloadFasta(nonHostContigsFastaDownload);
      const expectedNumSequences = await numSequencesInDownloadFixtureFasta(nonHostContigsFastaDownload, FIXTURE_PATH, sampleName, E_COLI_CFXA_SAMPLE_NAME);

      const maximumSequenceCountDiff = Math.ceil(expectedNumSequences * sequenceCountTolerance);
      const sequenceCountDiff = Math.abs(downloadNumSequences - expectedNumSequences);

      expect(sequenceCountDiff).toBeLessThan(maximumSequenceCountDiff);
      // #endregion Verify number of sequences in downloaded file
    });

    test("SNo 18: Verify comprehensive AMR metrics TSV download", async () => {
      // #region download comprehensive AMR metrics TSV file
      await samplesPage.clickDownloadButton();
      const comprehensiveAmrMetricsDownload = await samplesPage.clickDownloadOption(DOWNLOAD_TYPES_OPTIONS_MAP["comprehensive_amr_metrics"]);
      // #endregion download comprehensive AMR metrics TSV file

      // #region Verify downloaded file has same number of lines as fixture
      const downloadPath = await comprehensiveAmrMetricsDownload.path();
      const downloadName = await comprehensiveAmrMetricsDownload.suggestedFilename();

      const actualNumberOfRows = await getNumberOfLinesInFile(downloadPath);

      const downloadfixturePath = getFixturePathForSampleDownload(downloadName, FIXTURE_PATH, sampleName, E_COLI_CFXA_SAMPLE_NAME);
      const expectedNumberOfRows = await getNumberOfLinesInFile(downloadfixturePath);
      expect(actualNumberOfRows).toEqual(expectedNumberOfRows);
      // #endregion Verify downloaded file has same number of lines as fixture
    });

    test("SNo 19: Verify Intermediate Files zip download", async () => {
      const expectedIntermediateFiles = [
        "final_reports/",
        "final_reports/comprehensive_AMR_metrics.tsv",
        "final_reports/primary_AMR_report.tsv",
        "intermediate_files/",
        "intermediate_files/contig_amr_report.json",
        "intermediate_files/sr_amr_report.allele_mapping_data.json",
        "intermediate_files/sr_amr_report.artifacts_mapping_stats.txt",
        "intermediate_files/sr_amr_report.overall_mapping_stats.txt",
        "intermediate_files/sr_amr_report.reference_mapping_stats.txt",
        "intermediate_files/sr_amr_report.sorted.length_100.bam",
        "intermediate_files/sr_amr_report.sorted.length_100.bam.bai",
        "raw_reports/",
        "raw_reports/contig_amr_report.txt",
        "raw_reports/contig_species_report_61mer_analysis_rgi_summary.txt",
        "raw_reports/sr_amr_report.allele_mapping_data.txt",
        "raw_reports/sr_amr_report.gene_mapping_data.txt",
        "raw_reports/sr_species_report_61mer_analysis.allele.txt",
        "raw_reports/sr_species_report_61mer_analysis.gene.txt"
      ];

      // #region download Intermediate Files zip
      await samplesPage.clickDownloadButton();
      const intermediateFilesZipDownload = await samplesPage.clickDownloadOption(DOWNLOAD_TYPES_OPTIONS_MAP["intermediate_files"]);
      // #endregion download Intermediate Files zip

      // #region open zip file and verify contents
      const downloadPath = await intermediateFilesZipDownload.path();

      const zip = await new AdmZip(downloadPath);
      const zipContents = await zip.getEntries();

      let zippedFileNames = [];
      for (const content of zipContents) {
        zippedFileNames.push(await content.entryName);
      }
      zippedFileNames = zippedFileNames.sort();
      expect(zippedFileNames).toEqual(expectedIntermediateFiles);
      // #endregion open zip file and verify contents
    });
  });
});
