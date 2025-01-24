import * as fs from "fs/promises";
import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import {
  IDSEQ_MOSQ_2TO4MIL_SUBSAMPLE_10P,
  HG002_LONG_READS_METAG,
  MWGS_SE_SRR7002140_TA_252_DNA_BLAC_VANP_10P,
  MWGS_PE_SRR7002140_TAP_R1,
  MWGS_PE_SRR7002140_TAP_R2,
  MWGS_RNA_MOSQUITO_1_AEDES_RNA_10p_R1,
  MWGS_RNA_MOSQUITO_1_AEDES_RNA_10p_R2,
  MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R1,
  MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R2,
} from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { AssertionCollector } from "@e2e/utils/assertion-collector";
import { test, expect, Download } from "@playwright/test";
import { parse } from "csv-parse";
import fastDiff = require("fast-diff");
import { ProjectPage } from "../../page-objects/project-page";

// #region Test consts
const OUTPUT_PATH = (outputDir: string, filename: string) =>
  `./fixtures/outputs/${outputDir}/${filename}`;
const IDSEQ_MOSQ_SAMPLE_FILES = [IDSEQ_MOSQ_2TO4MIL_SUBSAMPLE_10P];
const IDSEQ_MOSQ_2TO4MIL_SUBSAMPLE = "28A-idseq-mosq.2to4mil_subsample_10p";
const IDSEQ_MOSQ_SAMPLE_NAMES = [IDSEQ_MOSQ_2TO4MIL_SUBSAMPLE];

const MWGS_SE_SAMPLE_FILES = [MWGS_SE_SRR7002140_TA_252_DNA_BLAC_VANP_10P];
const MWGS_SE_SAMPLE = "mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p";
const MWGS_SE_SAMPLE_NAMES = [MWGS_SE_SAMPLE];

const MWGS_PE_SRR7002140_TAP_FILES = [
  MWGS_PE_SRR7002140_TAP_R1,
  MWGS_PE_SRR7002140_TAP_R2,
];
const MWGS_PE_SRR7002140_TAP = "mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p";
const MWGS_PE_SRR7002140_TAP_SAMPLE_NAMES = [MWGS_PE_SRR7002140_TAP];

const MWGS_RNA_MOSQUITO_FILES = [
  MWGS_RNA_MOSQUITO_1_AEDES_RNA_10p_R1,
  MWGS_RNA_MOSQUITO_1_AEDES_RNA_10p_R2,
];
const MWGS_RNA_MOSQUITO = "mWGS_RNA_mosquito-1-aedes-rna_10p";
const MWGS_RNA_MOSQUITO_SAMPLE_NAMES = [MWGS_RNA_MOSQUITO];

const MWGS_RNA_HUMAN_FILES = [
  MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R1,
  MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R2,
];
const MWGS_RNA_HUMAN = "mWGS_RNA_human-128-lung-rna_10p";
const MWGS_RNA_HUMAN_SAMPLE_NAMES = [MWGS_RNA_HUMAN];

const HG002_LONG_READS_METAG_BASELINE_NAME = "HG002_long_reads_metaG";

const PIPELINE_VISUALIZATION_7 = "v0.7View Pipeline Visualization";
const PIPELINE_VISUALIZATION = "View Pipeline Visualization";
const VALIDATE_INPUT = "Validate Input";
const QUALITY_FILTER = "Quality Filter";
const HOST_FILTER = "Host Filter";
const HUMAN_FILTER = "Human Filter";
const ERCC_BOWTIE2_FILTER = "Ercc Bowtie2 Filter";
const BOWTIE2_FILTER = "Bowtie2 Filter";
const HISAT2_FILTER = "Hisat2 Filter";
const CZID_DEDUP = "CZID-dedup";
const READS = "Reads";

const DOWNLOAD_REPORT_TABLE_CSV = "Download Report table (.csv)";
const DOWNLOAD_NON_HOST_READS_FASTA = "Download Non-Host Reads (.fasta)";
const DOWNLOAD_NON_HOST_CONTIGS_FASTA = "Download Non-Host Contigs (.fasta)";
const DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV =
  "Download Non-Host Contigs Summary (.csv)";
const DOWNLOAD_UNMAPPED_READS_FASTA = "Download Unmapped Reads (.fasta)";

const SAMPLE_REPORT_SAMPLE_NAME = "Sample Report - Sample Name";
const SAMPLE_REPORT_TAXON = "Sample Report - Taxon";
const SAMPLE_REPORT_BPM = "Sample Report - bPM";
const SAMPLE_REPORT_B = "Sample Report - b";
const SAMPLE_REPORT_R = "Sample Report - r";
const SAMPLE_REPORT_CONTIG = "Sample Report - contig";
const SAMPLE_REPORT_CONTIG_B = "Sample Report - contig b";
const SAMPLE_REPORT_PERCENTAGE_ID = "Sample Report - %id";
const SAMPLE_REPORT_E_VALUE = "Sample Report - E value";
const SAMPLE_REPORT_L = "Sample Report - L";
const SAMPLE_DETAILS_ANALYSIS_TYPE = "Sample Details - Analysis Type";
const SAMPLE_DETAILS_SEQUENCING_PLATFORM =
  "Sample Details - Sequencing Platform";
const SAMPLE_DETAILS_PIPELINE_VERSION = "Sample Details - Pipeline Version";
const SAMPLE_DETAILS_GUPPY_BASECALLER_VERSION =
  "Sample Details - Guppy Basecaller Version";
const SAMPLE_DETAILS_NCBI_INDEX_DATE = "Sample Details - NCBI Index Date";
const SAMPLE_DETAILS_HOST_SUBTRACTED = "Sample Details - Host Subtracted";
const SAMPLE_DETAILS_TOTAL_READS = "Sample Details - Total Reads";
const SAMPLE_DETAILS_ERCC_READS = "Sample Details - ERCC Reads";
const SAMPLE_DETAILS_PASSED_FILTERS = "Sample Details - Passed Filters";
const SAMPLE_DETAILS_UNMAPPED_READS = "Sample Details - Unmapped Reads";
const SAMPLE_DETAILS_PASSED_QUALITY_CONTROL =
  "Sample Details - Passed Quality Control";
const SAMPLE_DETAILS_DATE_PROCESSED = "Sample Details - Date Processed";
const READS_REMAINING_COLUMN_COUNT = "Reads Remaining - Column Count";

const DATE_2024_02_06 = "2024-02-06";
const DATE_2021_01_22 = "2021-01-22";

const NO_DIFF_FIELDS = [
  "contig_name",
  "tax_id",
  "tax_level",
  "genus_tax_id",
  "name",
  "common_name",
  "category",
  "is_phage",
];

const TEST_TIMEOUT = 1000 * 60 * 60 * 1;
// #endregion Test consts

let collector: AssertionCollector;
const RUN_PIPELINE = true;
const WAIT_FOR_PIPELINE = true;

/*
 * mNGS E2E
 */
test.describe("mNGS E2E | Functional: P-1", () => {
  test.beforeEach(() => {
    collector = new AssertionCollector();
  });

  test.afterEach(() => {
    collector.throwIfAny();
  });

  test.skip("SNo e4: mNGS Nanopore Mosquito Sample Report & Download Data Validation", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for 28A-idseq-mosq.2to4mil_subsample_10p (see ""Data"") as a Metagenomic, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // sample fastq: 28A-idseq-mosq.2to4mil_subsample_10p.fq.gz
      // https://drive.google.com/file/d/1ZqKtet7Jslk0KNVJ7BGUwhnGGuj_l1Wo/view?usp=drive_link
      IDSEQ_MOSQ_SAMPLE_FILES,
      IDSEQ_MOSQ_SAMPLE_NAMES,
      WORKFLOWS.LMNGS,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Mosquito
        hostOrganism: "Mosquito",
        // - Sequencing Platform=Nanopore
        sequencingPlatform: WORKFLOWS.LMNGS, // Nanopore
        // - Guppy Basecaller Settings=hac
        guppyBasecaller: "hac",
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for 28A-idseq-mosq.2to4mil_subsample_10p (see ""Data"") as a Metagenomic, use the configuration:

    // #region 3. Select ""Metagenomics Nanopore"" tab
    let sampleName = "";
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    await projectPage.clickNanoporeTab();
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Metagenomics Nanopore"" tab

    // #region 4. Verify ""Taxon"" section data
    const samplesPage = await projectPage.clickSample(sampleName);

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):
    const reportTable = await samplesPage.getReportFilterTable();

    // ""28A-idseq-mosq.2to4mil_subsample_10p"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // Top NT hit is:
    const row1 = reportTable[0];
    // Taxon=Acinetobacter( 3 bacterial species:1 )
    collector.collect(
      async () =>
        expect(row1["Taxon"]).toEqual("Acinetobacter( 3 bacterial species:1 )"),
      SAMPLE_REPORT_TAXON,
    );

    // bMP=5,094.5 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["bPM"],
      ["5,094.5", "0.0"],
      SAMPLE_REPORT_BPM,
    );

    // b=29,807 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["b"],
      ["29,807", "0"],
      SAMPLE_REPORT_B,
    );

    // r=6 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["r"],
      ["6", "0"],
      SAMPLE_REPORT_R,
    );

    // contig=0 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["contig"],
      ["0", "0"],
      SAMPLE_REPORT_CONTIG,
    );

    // contig b=0 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["contig b"],
      ["0", "0"],
      SAMPLE_REPORT_CONTIG_B,
    );

    // % id=93.4 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["%id"],
      ["93.4", "0.0"],
      SAMPLE_REPORT_PERCENTAGE_ID,
    );

    // L=4,911.5 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["L"],
      ["4,911.5", "0.0"],
      SAMPLE_REPORT_L,
    );

    // E value=10-308 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["E value"],
      ["10-308", "0"],
      SAMPLE_REPORT_E_VALUE,
    );
    // #endregion 4. Verify ""Taxon"" section data

    // #region 5. Verify metrics under ""Sample details"" -> ""Pipelines""
    await samplesPage.clickSampleDetailsButton();
    await samplesPage.clickPipelinesTab();

    // PIPELINE INFO
    // Analysis Type=Metagenomic
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsAnalysisType()).toEqual(
          "Metagenomic",
        ),
      SAMPLE_DETAILS_ANALYSIS_TYPE,
    );

    // Sequencing Platform=Nanopore
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsSequencingPlatform()).toEqual(
          "Nanopore",
        ),
      SAMPLE_DETAILS_SEQUENCING_PLATFORM,
    );

    // Pipeline Version=v0.7 View Pipeline Visualization {VARIABLE VALUE}
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsPipelineVersion()).toEqual(
          PIPELINE_VISUALIZATION_7,
        ),
      SAMPLE_DETAILS_PIPELINE_VERSION,
    );

    // Guppy Basecaller Version=hac
    collector.collect(
      async () =>
        expect(
          await samplesPage.getSampleDetailsGuppyBasecallerVersion(),
        ).toEqual("hac"),
      SAMPLE_DETAILS_GUPPY_BASECALLER_VERSION,
    );

    // NCBI Index Date=2021-01-22 {VARIABLE VALUE}
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsNcbiIndexDate()).toEqual(
          DATE_2021_01_22,
        ),
      SAMPLE_DETAILS_NCBI_INDEX_DATE,
    );

    // Host Subtracted=Mosquito
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsHostSubtracted()).toEqual(
          "Mosquito",
        ),
      SAMPLE_DETAILS_HOST_SUBTRACTED,
    );

    // Total Reads=2,000
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsTotalReads(),
      "2,000",
      SAMPLE_DETAILS_TOTAL_READS,
    );

    // ERCC Reads=--
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsErccReads(),
      "--",
      SAMPLE_DETAILS_ERCC_READS,
    );

    // Passed Filters=97 (4.85%)
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsPassedFilters(),
      "97 (4.85%)",
      SAMPLE_DETAILS_PASSED_FILTERS,
    );

    // Unmapped Reads=64
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsUnmappedReads(),
      "64",
      SAMPLE_DETAILS_UNMAPPED_READS,
    );

    // Passed Quality Control=99.95%
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsPassedQualityControl(),
      "99.95%",
      SAMPLE_DETAILS_PASSED_QUALITY_CONTROL,
    );

    // Date Processed=2024-02-24 {VARIABLE VALUE}
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsDateProcessed()).toEqual(
          new Date().toISOString().substring(0, 10),
        ),
      SAMPLE_DETAILS_DATE_PROCESSED,
    );

    // BASES REMAINING
    await samplesPage.clickBasesRemainingToggle();

    // Filtering Step|Bases Remaining|% Bases Remaining
    const basesRemainingTable = await samplesPage.getBasesRemainingTable();

    // Validate Input|5,850,822|100.00%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[0], {
      "Filtering Step": VALIDATE_INPUT,
      "Bases Remaining": "5,850,822",
      "% Bases Remaining": "100.00%",
    });

    // Quality Filter|5,850,466|99.99%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[1], {
      "Filtering Step": QUALITY_FILTER,
      "Bases Remaining": "5,850,466",
      "% Bases Remaining": "99.99%",
    });

    // Host Filter|404,940|6.92%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[2], {
      "Filtering Step": HOST_FILTER,
      "Bases Remaining": "404,940",
      "% Bases Remaining": "6.92%",
    });

    // Human Filter|285,564|4.88%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[3], {
      "Filtering Step": HUMAN_FILTER,
      "Bases Remaining": "285,564",
      "% Bases Remaining": "4.88%",
    });

    // Subsampling|285,564|4.88%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[4], {
      "Filtering Step": "Subsampling",
      "Bases Remaining": "285,564",
      "% Bases Remaining": "4.88%",
    });

    await samplesPage.clickSampleDetailsCloseIcon();
    // #endregion 5. Verify metrics under ""Sample details"" -> ""Pipelines""

    // #region 6. From the sample report, click on the Download button for

    // Verify the specified data file outputs against baseline outputs

    // The following files from the downloads folder should match those of the baseline run:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - 28A-idseq-mosq.2to4mil_subsample_10p_report.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_report.csv`).toEqual(
          reportTableCsv.suggestedFilename(),
        ),
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    downloadedContent.push(reportTableCsv);

    // - Non-Host Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    // - 28A-idseq-mosq.2to4mil_subsample_10p_nonhost.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_nonhost.fasta`).toEqual(
          nonHostReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Non-Host Contigs (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostContigsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    // - 28A-idseq-mosq.2to4mil_subsample_10p_contigs.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs.fasta`).toEqual(
          nonHostContigsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    downloadedContent.push(nonHostContigsFasta);

    // - Non-Host Contigs Summary (.csv)
    await samplesPage.clickDownloadButton();
    const nonHostContigsSummaryCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    // - 28A-idseq-mosq.2to4mil_subsample_10p_contigs_summary.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs_summary.csv`).toEqual(
          nonHostContigsSummaryCsv.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    downloadedContent.push(nonHostContigsSummaryCsv);

    // - Unmapped Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const unmappedReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    // - 28A-idseq-mosq.2to4mil_subsample_10p_unidentified.fasta"
    collector.collect(
      async () =>
        expect(`${sampleName}_unidentified.fasta`).toEqual(
          unmappedReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    downloadedContent.push(unmappedReadsFasta);

    // Outputs: Output
    // https://drive.google.com/drive/folders/1WNE4m1b2AJTUmW37gSItEBHE7FROo8tw?usp=drive_link
    await compareDataFilesWithTolerance(
      downloadedContent,
      "mNGS/28A-idseq-mosq_2to4mil_subsample_10p/e4",
      sampleName,
      IDSEQ_MOSQ_2TO4MIL_SUBSAMPLE,
    );
    // #endregion 6. From the sample report, click on the Download button for
  });

  test.skip("SNo e5: mNGS Nanopore Human Sample Report & Download Data Validation", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for HG002_long_reads_metaG (see ""Data"") as a Metagenomic, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // sample fastq: HG002_long_reads_metaG.fastq.gz
      // https://drive.google.com/file/d/1lGcjevdszr7sGZnQXf7fT2NjfZhp78M7/view?usp=drive_link
      [HG002_LONG_READS_METAG],
      [HG002_LONG_READS_METAG_BASELINE_NAME],
      WORKFLOWS.LMNGS,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Human
        hostOrganism: "Human",
        // - Sequencing Platform=Nanopore
        sequencingPlatform: WORKFLOWS.LMNGS, // Nanopore
        // - Guppy Basecaller Settings=hac
        guppyBasecaller: "hac",
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for HG002_long_reads_metaG (see ""Data"") as a Metagenomic, use the configuration:

    // #region 3. Select ""Metagenomics Nanopore"" tab
    let sampleName = "";
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    await projectPage.clickNanoporeTab();
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Metagenomics Nanopore"" tab

    // #region 4. Verify ""Taxon"" section data
    const samplesPage = await projectPage.clickSample(sampleName);

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):
    const reportTable = await samplesPage.getReportFilterTable();
    // ""HG002_long_reads_metaG"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // Top NT hit is:
    const row1 = reportTable[0];
    // Taxon=Lymphocryptovirus( 1 viral species:1 )
    collector.collect(
      async () =>
        expect(row1["Taxon"]).toEqual("Lymphocryptovirus( 1 viral species:1 )"),
      SAMPLE_REPORT_TAXON,
    );

    // bMP=189,668.0 | 137,520.0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["bPM"],
      ["189,668.0", "137,520.0"],
      SAMPLE_REPORT_BPM,
    );

    // b=1,647,549 | 1,194,561
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["b"],
      ["1,647,549", "1,194,561"],
      SAMPLE_REPORT_B,
    );

    // r=130 | 115
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["r"],
      ["130", "115"],
      SAMPLE_REPORT_R,
    );

    // contig=3 | 3
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["contig"],
      ["3", "3"],
      SAMPLE_REPORT_CONTIG,
    );

    // contig b=1,194,561 | 1,194,561
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["contig b"],
      ["1,194,561", "1,194,561"],
      SAMPLE_REPORT_CONTIG_B,
    );

    // % id=99.4 | 99.4
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["%id"],
      ["99.4", "99.4"],
      SAMPLE_REPORT_PERCENTAGE_ID,
    );

    // L=52,176.6 | 1,954.5
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["L"],
      ["52,176.6", "1,954.5"],
      SAMPLE_REPORT_L,
    );

    // E value=10-308 | 10-304
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["E value"],
      ["10-308", "10-307"],
      SAMPLE_REPORT_E_VALUE,
    );
    // #endregion 4. Verify ""Taxon"" section data

    // #region 5. Verify metrics under ""Sample details"" -> ""Pipelines""
    await samplesPage.clickSampleDetailsButton();
    await samplesPage.clickPipelinesTab();

    // PIPELINE INFO
    // Analysis Type=Metagenomic
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsAnalysisType()).toEqual(
          "Metagenomic",
        ),
      SAMPLE_DETAILS_ANALYSIS_TYPE,
    );

    // Sequencing Platform=Nanopore
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsSequencingPlatform()).toEqual(
          "Nanopore",
        ),
      SAMPLE_DETAILS_SEQUENCING_PLATFORM,
    );

    // Pipeline Version=v0.7 View Pipeline Visualization {VARIABLE VALUE}
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsPipelineVersion()).toEqual(
          PIPELINE_VISUALIZATION_7,
        ),
      SAMPLE_DETAILS_PIPELINE_VERSION,
    );

    // Guppy Basecaller Version=hac
    collector.collect(
      async () =>
        expect(
          await samplesPage.getSampleDetailsGuppyBasecallerVersion(),
        ).toEqual("hac"),
      SAMPLE_DETAILS_GUPPY_BASECALLER_VERSION,
    );

    // NCBI Index Date=2021-01-22 {VARIABLE VALUE}
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsNcbiIndexDate()).toEqual(
          DATE_2021_01_22,
        ),
      SAMPLE_DETAILS_NCBI_INDEX_DATE,
    );

    // Host Subtracted=Human
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsHostSubtracted()).toEqual(
          "Human",
        ),
      SAMPLE_DETAILS_HOST_SUBTRACTED,
    );

    // Total Reads=265
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsTotalReads(),
      "265",
      SAMPLE_DETAILS_TOTAL_READS,
    );

    // ERCC Reads=--
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsErccReads(),
      "--",
      SAMPLE_DETAILS_ERCC_READS,
    );

    // Passed Filters=163 (61.51%)
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsPassedFilters(),
      "163 (61.51%)",
      SAMPLE_DETAILS_PASSED_FILTERS,
    );

    // Unmapped Reads=29
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsUnmappedReads(),
      "29",
      SAMPLE_DETAILS_UNMAPPED_READS,
    );

    // Passed Quality Control=100.00%
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsPassedQualityControl(),
      "100.00%",
      SAMPLE_DETAILS_PASSED_QUALITY_CONTROL,
    );

    // Date Processed=2024-02-24 {VARIABLE VALUE}
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsDateProcessed()).toEqual(
          new Date().toISOString().substring(0, 10),
        ),
      SAMPLE_DETAILS_DATE_PROCESSED,
    );

    // BASES REMAINING
    await samplesPage.clickBasesRemainingToggle();

    // Filtering Step|Bases Remaining|% Bases Remaining
    const basesRemainingTable = await samplesPage.getBasesRemainingTable();

    // Validate Input|8,686,470|100.00%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[0], {
      "Filtering Step": VALIDATE_INPUT,
      "Bases Remaining": "8,686,470",
      "% Bases Remaining": "100.00%",
    });

    // Quality Filter|8,686,470|100.00%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[1], {
      "Filtering Step": "Quality Filter",
      "% Bases Remaining": "100.00%",
      "Bases Remaining": "8,686,470",
    });

    // Host Filter|1,671,959|19.25%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[2], {
      "Filtering Step": "Host Filter",
      "Bases Remaining": "1,671,959",
      "% Bases Remaining": "19.25%",
    });

    // Human Filter|1,671,959|19.25%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[3], {
      "Filtering Step": "Human Filter",
      "Bases Remaining": "1,671,959",
      "% Bases Remaining": "19.25%",
    });

    // Subsampling|1,671,959|19.25%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[4], {
      "Filtering Step": "Subsampling",
      "Bases Remaining": "1,671,959",
      "% Bases Remaining": "19.25%",
    });
    await samplesPage.clickSampleDetailsCloseIcon();
    // #endregion 5. Verify metrics under ""Sample details"" -> ""Pipelines""

    // #region 6. From the sample report, click on the Download button for:
    // 6. Verify the specified data file outputs against baseline outputs
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      "Download Report table (.csv)",
    );

    // - HG002_long_reads_metaG_contigs.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_report.csv`).toEqual(
          reportTableCsv.suggestedFilename(),
        ),
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    downloadedContent.push(reportTableCsv);

    // - Non-Host Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostReadsFasta = await samplesPage.clickDownloadOption(
      "Download Non-Host Reads (.fasta)",
    );

    // - HG002_long_reads_metaG_contigs_summary.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_nonhost.fasta`).toEqual(
          nonHostReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Non-Host Contigs (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostContigsFasta = await samplesPage.clickDownloadOption(
      "Download Non-Host Contigs (.fasta)",
    );

    // - HG002_long_reads_metaG_nonhost.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs.fasta`).toEqual(
          nonHostContigsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    downloadedContent.push(nonHostContigsFasta);

    // - Non-Host Contigs Summary (.csv)
    await samplesPage.clickDownloadButton();
    const nonHostContigsSummaryCsv = await samplesPage.clickDownloadOption(
      "Download Non-Host Contigs Summary (.csv)",
    );

    // - HG002_long_reads_metaG_report.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs_summary.csv`).toEqual(
          nonHostContigsSummaryCsv.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    downloadedContent.push(nonHostContigsSummaryCsv);

    // - Unmapped Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const unmappedReadsFasta = await samplesPage.clickDownloadOption(
      "Download Unmapped Reads (.fasta)",
    );

    // - HG002_long_reads_metaG_unidentified.fasta"
    collector.collect(
      async () =>
        expect(`${sampleName}_unidentified.fasta`).toEqual(
          unmappedReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    downloadedContent.push(unmappedReadsFasta);

    // The following files from the downloads folder should match those of the baseline run:
    // Index Date: 2021
    // Outputs: Output
    // https://drive.google.com/drive/folders/198yIsKDXeC-guTC1wESE3m54IKqdP2SM?usp=drive_link
    await compareDataFilesWithTolerance(
      downloadedContent,
      "mNGS/HG002_long_reads_metaG/e5",
      sampleName,
      HG002_LONG_READS_METAG_BASELINE_NAME,
    );
    // #endregion 6. From the sample report, click on the Download button for:
  });

  test("SNo e6: mNGS Illumina Single Read Sample Report & Download Data Validation", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p (see ""Data"") as a Metagenomic, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // sample fastq: mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_R1.fastq.gz
      // https://drive.google.com/file/d/13wf2ZZKzozGV-taslLDBEYjQtPh_Bc6w/view?usp=drive_link
      [MWGS_SE_SRR7002140_TA_252_DNA_BLAC_VANP_10P],
      [MWGS_SE_SAMPLE],
      WORKFLOWS.MNGS,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Human
        hostOrganism: "Human",
        // - Sequencing Platform=Illumina
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p (see ""Data"") as a Metagenomic, use the configuration:

    // #region 3. Select ""Metagenomics"" tab
    let sampleName = "";
    let samplesPage = new SamplesPage(page);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      await samplesPage.waitForReportComplete(uploadedSample.id);
      await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Metagenomics"" tab

    // #region 4. Verify ""Taxon"" section data
    samplesPage = await projectPage.clickSample(sampleName);

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):
    const reportTable = await samplesPage.getReportFilterTable();
    const expectedReportTable = {
      Taxon: /Streptococcus\( \d+ bacterial species(?:\s*:\d+)? \)/,
      Score: "-",
      "Z Score": "-",
      rPM: ["571,798.2", "540,103.5"],
      r: ["884", "835"],
      contig: ["0", "0"],
      "contig r": ["0", "0"],
      "%id": ["98.5", "98.4"],
      L: ["123.4", "39.4"],
      "E value": ["10-69", "10-17"],
      NTNR: "",
    };

    // ""mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // Top NT hit is:
    const row1 = reportTable[0];
    for (const key of Object.keys(expectedReportTable)) {
      await verifyReportTableValuesUpperAndLowerBounds(
        row1[key],
        expectedReportTable[key],
        `Sample Report - ${key}`,
      );
    }
    // #endregion 4. Verify ""Taxon"" section data

    // #region 5. Verify metrics under ""Sample details"" -> ""Pipelines""
    await samplesPage.clickSampleDetailsButton();
    await samplesPage.clickPipelinesTab();

    // PIPELINE INFO
    const pipelineInfoTable = await samplesPage.getPipelineInfoTable();
    const expectedPipelineInfoTable = {
      "Analysis Type": "Metagenomic",
      "Sequencing Platform": "Illumina",
      "Pipeline Version": ["v8.3", PIPELINE_VISUALIZATION],
      "NCBI Index Date": DATE_2021_01_22,
      "Host Subtracted": "Human",
      "Total Reads": "1,546",
      "ERCC Reads": "--",
      "Passed Filters": "1,540 (99.61%)",
      "Unmapped Reads": "39",
      "Passed Quality Control": "99.61%",
      "Compression Ratio": "1.00",
      "Mean Insert Size": "--",
      "Date Processed": new Date().toISOString().substring(0, 10),
    };
    for (const key of Object.keys(expectedPipelineInfoTable)) {
      await verifyBasesRemainingUpperAndLowerBounds(
        pipelineInfoTable[key],
        expectedPipelineInfoTable[key],
        READS,
      );
    }

    // READS REMAINING
    await samplesPage.clickReadsRemainingToggle();

    // Filtering Step|Reads Remaining|% Reads Remaining
    const readsRemainingTable = await samplesPage.getBasesRemainingTable();
    const expectedReadsRemainingTable = [
      {
        "Filtering Step": VALIDATE_INPUT,
        "Reads Remaining": "1,546",
        "% Reads Remaining": "100.00%",
      },
      {
        "Filtering Step": ERCC_BOWTIE2_FILTER,
        "Reads Remaining": "1,546",
        "% Reads Remaining": "100.00%",
      },
      {
        "Filtering Step": "Fastp Qc",
        "Reads Remaining": "1,540",
        "% Reads Remaining": "99.61%",
      },
      {
        "Filtering Step": BOWTIE2_FILTER,
        "Reads Remaining": "1,540",
        "% Reads Remaining": "99.61%",
      },
      {
        "Filtering Step": HISAT2_FILTER,
        "Reads Remaining": "1,540",
        "% Reads Remaining": "99.61%",
      },
      {
        "Filtering Step": CZID_DEDUP,
        "Reads Remaining": ["1,540", "(1,536 unique)"],
        "% Reads Remaining": "99.61%",
      },
      {
        "Filtering Step": "Subsample",
        "Reads Remaining": "1,540",
        "% Reads Remaining": "99.61%",
      },
    ];

    collector.collect(
      async () =>
        expect(readsRemainingTable.length).toEqual(
          expectedReadsRemainingTable.length,
        ),
      READS_REMAINING_COLUMN_COUNT,
    );
    for (const i in expectedReadsRemainingTable) {
      await verifyBasesRemainingUpperAndLowerBounds(
        readsRemainingTable[i],
        expectedReadsRemainingTable[i],
        READS,
      );
    }

    await samplesPage.clickSampleDetailsCloseIcon();
    // #endregion 5. Verify metrics under ""Sample details"" -> ""Pipelines""

    // #region 6. From the sample report, click on the Download button for:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_report.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_report.csv`).toEqual(
          reportTableCsv.suggestedFilename(),
        ),
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    downloadedContent.push(reportTableCsv);

    // - Non-Host Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    // - mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_nonhost.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_nonhost.fasta`).toEqual(
          nonHostReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Unmapped Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const unmappedReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    // - mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_unidentified.fasta"
    collector.collect(
      async () =>
        expect(`${sampleName}_unidentified.fasta`).toEqual(
          unmappedReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    downloadedContent.push(unmappedReadsFasta);
    // #endregion 6. From the sample report, click on the Download button for:

    // #region 7. Verify the specified data file outputs against baseline outputs"

    // The following files from the downloads folder should match those of the baseline run:
    // 2021
    // Outputs: Output mWGS
    // project 1151
    // samples 48440
    await compareDataFilesWithTolerance(
      downloadedContent,
      "mNGS/mWGS_SE_SRR7002140_TA/e6",
      sampleName,
      MWGS_SE_SAMPLE,
    );
    // #endregion 7. Verify the specified data file outputs against baseline outputs"
  });

  test("SNo e7: mNGS Illumina Paired Read Sample Report & Download Data Validation", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p (see ""Data"") as a Metagenomic, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // "sample fastq:
      // mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_R1.fastq.gz
      // https://drive.google.com/file/d/1c6-E46zSpokSJFwBk7B4IHdU1J3rzZHc/view?usp=drive_link
      // mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_R2.fastq.gz"
      // https://drive.google.com/file/d/1QNXYla-LTIQGk5HpCYwYEf1xyrFzw1eq/view?usp=drive_link
      [MWGS_PE_SRR7002140_TAP_R1, MWGS_PE_SRR7002140_TAP_R2],
      [MWGS_PE_SRR7002140_TAP],
      WORKFLOWS.MNGS,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Human
        hostOrganism: "Human",
        // - Sequencing Platform=Illumina
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p (see ""Data"") as a Metagenomic, use the configuration:

    // #region 3. Select ""Metagenomics"" tab
    let sampleName = "";
    let samplesPage = new SamplesPage(page);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      await samplesPage.waitForReportComplete(uploadedSample.id);
      await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Metagenomics"" tab

    // #region 4. Verify ""Taxon"" section data
    samplesPage = await projectPage.clickSample(sampleName);

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):
    const reportTable = await samplesPage.getReportFilterTable();
    const expectedReportTable = {
      Taxon: /Streptococcus\( \d+ bacterial species(?:\s*:\d+)? \)/,
      Score: "-",
      "Z Score": "-",
      rPM: ["566,623.5", "536,869.3"],
      r: ["1,752", "1,660"],
      contig: ["0", "0"],
      "contig r": ["0", "0"],
      "%id": ["98.4", "97.9"],
      L: ["123.4", "39.3"],
      "E value": ["10-69", "10-16"],
      NTNR: "",
    };

    // ""mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // Top NT hit is:
    const row1 = reportTable[0];
    for (const key of Object.keys(expectedReportTable)) {
      await verifyReportTableValuesUpperAndLowerBounds(
        row1[key],
        expectedReportTable[key],
        `Sample Report - ${key}`,
      );
    }
    // #endregion 4. Verify ""Taxon"" section data

    // #region 5. Verify metrics under ""Sample details"" -> ""Pipelines""
    await samplesPage.clickSampleDetailsButton();
    await samplesPage.clickPipelinesTab();

    // PIPELINE INFO
    const pipelineInfoTable = await samplesPage.getPipelineInfoTable();
    const expectedPipelineInfoTable = {
      "Analysis Type": "Metagenomic",
      "Sequencing Platform": "Illumina",
      "Pipeline Version": ["v8.3", PIPELINE_VISUALIZATION],
      "NCBI Index Date": DATE_2021_01_22,
      "Host Subtracted": "Human",
      "Total Reads": "3,092",
      "ERCC Reads": "--",
      "Passed Filters": "3,066 (99.16%)",
      "Unmapped Reads": "74",
      "Passed Quality Control": "99.22%",
      "Compression Ratio": "1.00",
      "Mean Insert Size": "78±0",
      "Date Processed": new Date().toISOString().substring(0, 10),
    };
    for (const key of Object.keys(expectedPipelineInfoTable)) {
      await verifyBasesRemainingUpperAndLowerBounds(
        pipelineInfoTable[key],
        expectedPipelineInfoTable[key],
        READS,
      );
    }

    // READS REMAINING
    await samplesPage.clickReadsRemainingToggle();

    // Filtering Step|Reads Remaining|% Reads Remaining
    const readsRemainingTable = await samplesPage.getBasesRemainingTable();
    const expectedReadsRemainingTable = [
      {
        "Filtering Step": VALIDATE_INPUT,
        "Reads Remaining": "3,092",
        "% Reads Remaining": "100.00%",
      },
      {
        "Filtering Step": ERCC_BOWTIE2_FILTER,
        "Reads Remaining": "3,092",
        "% Reads Remaining": "100.00%",
      },
      {
        "Filtering Step": "Fastp Qc",
        "Reads Remaining": "3,068",
        "% Reads Remaining": "99.22%",
      },
      {
        "Filtering Step": BOWTIE2_FILTER,
        "Reads Remaining": "3,066",
        "% Reads Remaining": "99.16%",
      },
      {
        "Filtering Step": HISAT2_FILTER,
        "Reads Remaining": "3,066",
        "% Reads Remaining": "99.16%",
      },
      {
        "Filtering Step": CZID_DEDUP,
        "Reads Remaining": ["3,066", "(3,066 unique)"],
        "% Reads Remaining": "99.16%",
      },
      {
        "Filtering Step": "Subsample",
        "Reads Remaining": "3,066",
        "% Reads Remaining": "99.16%",
      },
    ];
    collector.collect(
      async () =>
        expect(readsRemainingTable.length).toEqual(
          expectedReadsRemainingTable.length,
        ),
      READS_REMAINING_COLUMN_COUNT,
    );
    for (const i in expectedReadsRemainingTable) {
      await verifyBasesRemainingUpperAndLowerBounds(
        readsRemainingTable[i],
        expectedReadsRemainingTable[i],
        READS,
      );
    }

    await samplesPage.clickSampleDetailsCloseIcon();
    // #endregion 5. Verify metrics under ""Sample details"" -> ""Pipelines""

    // #region 6. From the sample report, click on the Download button for:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_report.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_report.csv`).toEqual(
          reportTableCsv.suggestedFilename(),
        ),
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    downloadedContent.push(reportTableCsv);

    // - Non-Host Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    // - mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_nonhost.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_nonhost.fasta`).toEqual(
          nonHostReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Unmapped Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const unmappedReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    // - mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_unidentified.fasta"
    collector.collect(
      async () =>
        expect(`${sampleName}_unidentified.fasta`).toEqual(
          unmappedReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    downloadedContent.push(unmappedReadsFasta);
    // #endregion 6. From the sample report, click on the Download button for:

    // #region 7. Verify the specified data file outputs against baseline outputs"

    // The following files from the downloads folder should match those of the baseline run:
    // 2021
    // Outputs: Output mWGS
    // project 1151
    // samples 50118
    await compareDataFilesWithTolerance(
      downloadedContent,
      "mNGS/mWGS_PE_SRR7002140_TA/e7",
      sampleName,
      MWGS_PE_SRR7002140_TAP,
    );
    // #endregion 7. Verify the specified data file outputs against baseline outputs"
  });

  test("SNo e8: mNGS Illumina Paired Read RNA Mosquito Sample Report & Download Data Validation", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for mWGS_RNA_mosquito-1-aedes-rna_10p (see "Data") as a Metagenomic, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // sample fastq:
      // mWGS_RNA_mosquito-1-aedes-rna_10p_R1.fastq.gz
      // https://drive.google.com/file/d/1cknRbz6wGYwoYDFhH9GO8IfBcDQBBMM9/view?usp=drive_link
      // mWGS_RNA_mosquito-1-aedes-rna_10p_R2.fastq.gz
      // https://drive.google.com/file/d/1kwdYlFtuPZK8uPfPflayVOuwpUrL-lO8/view?usp=drive_link
      MWGS_RNA_MOSQUITO_FILES,
      MWGS_RNA_MOSQUITO_SAMPLE_NAMES,
      WORKFLOWS.MNGS,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Mosquito
        hostOrganism: "Mosquito",
        // - Sequencing Platform=Illumina
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for mWGS_RNA_mosquito-1-aedes-rna_10p (see "Data") as a Metagenomic, use the configuration:

    // #region 3. Select ""Metagenomics"" tab
    let sampleName = "";
    let samplesPage = new SamplesPage(page);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      await samplesPage.waitForReportComplete(uploadedSample.id);
      await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Metagenomics"" tab

    // #region 4. Verify "Taxon" section data
    samplesPage = await projectPage.clickSample(sampleName);

    // Comparing with baseline sample report(s) (older versions reports of the same sample):
    const reportTable = await samplesPage.getReportFilterTable();
    const expectedReportTable = {
      Taxon: /Gonomyia\( \d+ eukaryotic species(?:\s*:\d+)? \)/,
      Score: "-",
      "Z Score": "-",
      rPM: ["59,059.1", "0.0"],
      r: ["19,110", "0"],
      contig: ["8", "0"],
      "contig r": ["18,652", "0"],
      "%id": ["94.0", "0.0"],
      L: ["718.9", "0.0"],
      "E value": ["10-277", "0"],
      NTNR: "",
    };

    // "mWGS_RNA_mosquito-1-aedes-rna_10p" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // Top NT hit is:
    const row1 = reportTable[0];
    for (const key of Object.keys(expectedReportTable)) {
      await verifyReportTableValuesUpperAndLowerBounds(
        row1[key],
        expectedReportTable[key],
        `Sample Report - ${key}`,
      );
    }
    // #endregion 4. Verify "Taxon" section data

    // #region 5. Verify metrics under "Sample details" -> "Pipelines"
    await samplesPage.clickSampleDetailsButton();
    await samplesPage.clickPipelinesTab();

    // PIPELINE INFO
    const pipelineInfoTable = await samplesPage.getPipelineInfoTable();
    const expectedPipelineInfoTable = {
      "Analysis Type": "Metagenomic",
      "Sequencing Platform": "Illumina",
      "Pipeline Version": ["v8.3", PIPELINE_VISUALIZATION],
      "NCBI Index Date": DATE_2021_01_22,
      "Host Subtracted": "Mosquito",
      "Total Reads": "323,606",
      "ERCC Reads": "32 (0.01%)",
      "Passed Filters": "106,734 (32.98%)",
      "Unmapped Reads": "60,812",
      "Passed Quality Control": "88.70%",
      "Compression Ratio": "1.03",
      "Mean Insert Size": "--",
      "Date Processed": new Date().toISOString().substring(0, 10),
    };
    for (const key of Object.keys(expectedPipelineInfoTable)) {
      await verifyBasesRemainingUpperAndLowerBounds(
        pipelineInfoTable[key],
        expectedPipelineInfoTable[key],
        READS,
      );
    }

    // READS REMAINING
    await samplesPage.clickReadsRemainingToggle();

    // Filtering Step|Reads Remaining|% Reads Remaining
    const readsRemainingTable = await samplesPage.getBasesRemainingTable();
    const expectedReadsRemainingTable = [
      {
        "Filtering Step": VALIDATE_INPUT,
        "Reads Remaining": "323,606",
        "% Reads Remaining": "100.00%",
      },
      {
        "Filtering Step": ERCC_BOWTIE2_FILTER,
        "Reads Remaining": "323,574",
        "% Reads Remaining": "99.99%",
      },
      {
        "Filtering Step": "Fastp Qc",
        "Reads Remaining": "286,998",
        "% Reads Remaining": "88.69%",
      },
      {
        "Filtering Step": BOWTIE2_FILTER,
        "Reads Remaining": "109,510",
        "% Reads Remaining": "33.84%",
      },
      {
        "Filtering Step": HISAT2_FILTER,
        "Reads Remaining": "109,332",
        "% Reads Remaining": "33.79%",
      },
      {
        "Filtering Step": "Bowtie2 Human Filter",
        "Reads Remaining": "106,736",
        "% Reads Remaining": "32.98%",
      },
      {
        "Filtering Step": "Hisat2 Human Filter",
        "Reads Remaining": "106,734",
        "% Reads Remaining": "32.98%",
      },
      {
        "Filtering Step": CZID_DEDUP,
        "Reads Remaining": ["106,734", "(103,456 unique)"],
        "% Reads Remaining": "32.98%",
      },
      {
        "Filtering Step": "Subsample",
        "Reads Remaining": "106,734",
        "% Reads Remaining": "32.98%",
      },
    ];

    for (const i in expectedReadsRemainingTable) {
      await verifyBasesRemainingUpperAndLowerBounds(
        readsRemainingTable[i],
        expectedReadsRemainingTable[i],
        READS,
      );
    }

    await samplesPage.clickSampleDetailsCloseIcon();
    // #endregion 5. Verify metrics under "Sample details" -> "Pipelines"

    // #region 6. From the sample report, click on the Download button for:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_report.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_report.csv`).toEqual(
          reportTableCsv.suggestedFilename(),
        ),
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    downloadedContent.push(reportTableCsv);

    // - Non-Host Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_nonhost.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_nonhost.fasta`).toEqual(
          nonHostReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Non-Host Contigs (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostContigsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_contigs.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs.fasta`).toEqual(
          nonHostContigsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    downloadedContent.push(nonHostContigsFasta);

    // - Non-Host Contigs Summary (.csv)
    await samplesPage.clickDownloadButton();
    const nonHostContigsSummaryCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_contigs_summary.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs_summary.csv`).toEqual(
          nonHostContigsSummaryCsv.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    downloadedContent.push(nonHostContigsSummaryCsv);

    // - Unmapped Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const unmappedReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_unidentified.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_unidentified.fasta`).toEqual(
          unmappedReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    downloadedContent.push(unmappedReadsFasta);
    // #endregion 6. From the sample report, click on the Download button for:

    // #region 7. Verify the specified data file outputs against baseline outputs"

    // The following files from the downloads folder should match those of the baseline run:

    // 2021
    // Outputs: Output mWGS
    // project 1151
    // samples 50120
    await compareDataFilesWithTolerance(
      downloadedContent,
      "mNGS/mWGS_RNA_MOSQUITO_1_AEDES_RNA_10p/e8",
      sampleName,
      MWGS_RNA_MOSQUITO,
    );
    // #endregion 7. Verify the specified data file outputs against baseline outputs"
  });

  test("SNo e9: mNGS Illumina Paired Read RNA Human Sample Report & Download Data Validation", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for mWGS_RNA_human-128-lung-rna_10p_contigs (see "Data") as a Metagenomic, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // sample fastq:
      // mWGS_RNA_human-128-lung-rna_10p_R1.fastq.gz
      // https://drive.google.com/file/d/1QOwyK6rDitgjIjohj6KWXS5CRsZrLaSE/view?usp=drive_link
      // mWGS_RNA_human-128-lung-rna_10p_R2.fastq.gz
      // https://drive.google.com/file/d/1LwqDvXqb09H59pD-hy_NZk4pPWtznlo9/view?usp=drive_link
      MWGS_RNA_HUMAN_FILES,
      MWGS_RNA_HUMAN_SAMPLE_NAMES,
      WORKFLOWS.MNGS,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Human
        hostOrganism: "Human",
        // - Sequencing Platform=Illumina
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for mWGS_RNA_human-128-lung-rna_10p_contigs (see "Data") as a Metagenomic, use the configuration:

    // #region 3. Select ""Metagenomics"" tab
    let sampleName = "";
    let samplesPage = new SamplesPage(page);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      await samplesPage.waitForReportComplete(uploadedSample.id);
      await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Metagenomics"" tab

    // #region 4. Verify "Taxon" section data
    samplesPage = await projectPage.clickSample(sampleName);

    // Comparing with baseline sample report(s) (older versions reports of the same sample):
    const reportTable = await samplesPage.getReportFilterTable();
    const expectedReportTable = {
      Taxon: /Orthopneumovirus\( \d+ viral species(?:\s*:\d+)? \)/,
      Score: "-",
      "Z Score": "-",
      rPM: ["8,128.8", "8,120.2"],
      r: ["2,840", "2,837"],
      contig: ["3", "3"],
      "contig r": ["2,835", "2,835"],
      "%id": ["99.8", "97.9"],
      L: ["7,426.2", "1,283.6"],
      "E value": ["10-306", "10-306"],
      NTNR: "",
    };

    // "mWGS_RNA_human-128-lung-rna_10p_contigs" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // Top NT hit is:
    const row1 = reportTable[0];
    for (const key of Object.keys(expectedReportTable)) {
      await verifyReportTableValuesUpperAndLowerBounds(
        row1[key],
        expectedReportTable[key],
        `Sample Report - ${key}`,
      );
    }
    // #endregion 4. Verify "Taxon" section data

    // #region 5. Verify metrics under "Sample details" -> "Pipelines"
    await samplesPage.clickSampleDetailsButton();
    await samplesPage.clickPipelinesTab();

    // PIPELINE INFO
    const pipelineInfoTable = await samplesPage.getPipelineInfoTable();
    const expectedPipelineInfoTable = {
      "Analysis Type": "Metagenomic",
      "Sequencing Platform": "Illumina",
      "Pipeline Version": ["v8.3", PIPELINE_VISUALIZATION],
      "NCBI Index Date": DATE_2021_01_22,
      "Host Subtracted": "Human",
      "Total Reads": "407,182",
      "ERCC Reads": "57,808 (14.20%)",
      "Passed Filters": "4,236 (1.04%)",
      "Unmapped Reads": "321",
      "Passed Quality Control": "75.87%",
      "Compression Ratio": "1.06",
      "Mean Insert Size": "165±69",
      "Date Processed": new Date().toISOString().substring(0, 10),
    };
    for (const key of Object.keys(expectedPipelineInfoTable)) {
      await verifyBasesRemainingUpperAndLowerBounds(
        pipelineInfoTable[key],
        expectedPipelineInfoTable[key],
        READS,
      );
    }

    // READS REMAINING
    await samplesPage.clickReadsRemainingToggle();

    // Filtering Step|Reads Remaining|% Reads Remaining
    const readsRemainingTable = await samplesPage.getBasesRemainingTable();
    const expectedReadsRemainingTable = [
      {
        "Filtering Step": VALIDATE_INPUT,
        "Reads Remaining": "407,182",
        "% Reads Remaining": "100.00%",
      },
      {
        "Filtering Step": ERCC_BOWTIE2_FILTER,
        "Reads Remaining": "349,374",
        "% Reads Remaining": "85.80%",
      },
      {
        "Filtering Step": "Fastp Qc",
        "Reads Remaining": "265,058",
        "% Reads Remaining": "65.10%",
      },
      {
        "Filtering Step": BOWTIE2_FILTER,
        "Reads Remaining": "4,248",
        "% Reads Remaining": "1.04%",
      },
      {
        "Filtering Step": HISAT2_FILTER,
        "Reads Remaining": "4,236",
        "% Reads Remaining": "1.04%",
      },
      {
        "Filtering Step": CZID_DEDUP,
        "Reads Remaining": ["4,236", "(4,014 unique)"],
        "% Reads Remaining": "1.04%",
      },
      {
        "Filtering Step": "Subsample",
        "Reads Remaining": "4,236",
        "% Reads Remaining": "1.04%",
      },
    ];
    for (const i in expectedReadsRemainingTable) {
      await verifyBasesRemainingUpperAndLowerBounds(
        readsRemainingTable[i],
        expectedReadsRemainingTable[i],
        READS,
      );
    }

    await samplesPage.clickSampleDetailsCloseIcon();
    // #endregion 5. Verify metrics under "Sample details" -> "Pipelines"

    // #region 6. From the sample report, click on the Download button for:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_report.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_report.csv`).toEqual(
          reportTableCsv.suggestedFilename(),
        ),
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    downloadedContent.push(reportTableCsv);

    // - Non-Host Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_nonhost.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_nonhost.fasta`).toEqual(
          nonHostReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Non-Host Contigs (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostContigsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_contigs.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs.fasta`).toEqual(
          nonHostContigsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    downloadedContent.push(nonHostContigsFasta);

    // - Non-Host Contigs Summary (.csv)
    await samplesPage.clickDownloadButton();
    const nonHostContigsSummaryCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_contigs_summary.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs_summary.csv`).toEqual(
          nonHostContigsSummaryCsv.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    downloadedContent.push(nonHostContigsSummaryCsv);

    // - Unmapped Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const unmappedReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_unidentified.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_unidentified.fasta`).toEqual(
          unmappedReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    downloadedContent.push(unmappedReadsFasta);
    // #endregion 6. From the sample report, click on the Download button for:

    // #region 7. Verify the specified data file outputs against baseline outputs

    // The following files from the downloads folder should match those of the baseline run:
    // 2021
    // Outputs: Output mWGS
    // project 1151
    // samples 50124
    await compareDataFilesWithTolerance(
      downloadedContent,
      "mNGS/mWGS_RNA_HUMAN_128_LUNG_RNA_10p/e9",
      sampleName,
      MWGS_RNA_HUMAN,
    );
    // #endregion 7. Verify the specified data file outputs against baseline outputs
  });

  test.skip("SNo e14: mNGS Nanopore Human Sample Report & Download Data Validation - New database", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `SNo-e14_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for HG002_long_reads_metaG (see ""Data"") as a Metagenomic, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // sample fastq: HG002_long_reads_metaG.fastq.gz
      // https://drive.google.com/file/d/1lGcjevdszr7sGZnQXf7fT2NjfZhp78M7/view?usp=drive_link
      [HG002_LONG_READS_METAG],
      [HG002_LONG_READS_METAG_BASELINE_NAME],
      WORKFLOWS.LMNGS,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Human
        hostOrganism: "Human",
        // - Sequencing Platform=Nanopore
        sequencingPlatform: WORKFLOWS.LMNGS, // Nanopore
        // - Guppy Basecaller Settings=hac
        guppyBasecaller: "hac",
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for HG002_long_reads_metaG (see ""Data"") as a Metagenomic, use the configuration:

    // #region 3. Select ""Metagenomics Nanopore"" tab
    let sampleName = "";
    let samplesPage = new SamplesPage(page);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      await samplesPage.waitForReportComplete(uploadedSample.id);
      await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Metagenomics Nanopore"" tab

    // #region 4. Verify ""Taxon"" section data
    samplesPage = await projectPage.clickSample(sampleName);

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):
    const reportTable = await samplesPage.getReportFilterTable();

    // ""HG002_long_reads_metaG"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // Top NT hit is:
    const row1 = reportTable[0];
    // Taxon=Lymphocryptovirus( 1 viral species:1 )
    collector.collect(
      async () =>
        expect(row1["Taxon"]).toEqual("Lymphocryptovirus( 1 viral species )"),
      SAMPLE_REPORT_TAXON,
    );

    // bMP=189,668.0 | 137,520.0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["bPM"],
      ["189,668.0", "137,520.0"],
      SAMPLE_REPORT_BPM,
    );

    // b=1,647,549 | 1,194,561
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["b"],
      ["1,647,549", "1,194,561"],
      SAMPLE_REPORT_B,
    );

    // r=130 | 115
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["r"],
      ["130", "115"],
      SAMPLE_REPORT_R,
    );

    // contig=3 | 3
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["contig"],
      ["3", "3"],
      SAMPLE_REPORT_CONTIG,
    );

    // contig b=1,194,561 | 1,194,561
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["contig b"],
      ["1,194,561", "1,194,561"],
      SAMPLE_REPORT_CONTIG_B,
    );

    // % id=92.6 | 98.9
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["%id"],
      ["92.6", "98.9"],
      SAMPLE_REPORT_PERCENTAGE_ID,
    );

    // L=63,570.0 | 1,954.5
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["L"],
      ["63,570.0", "1,954.5"],
      SAMPLE_REPORT_L,
    );

    // E value=10-308 | 10-304
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["E value"],
      ["10-308", "10-304"],
      SAMPLE_REPORT_E_VALUE,
    );
    // #endregion 4. Verify ""Taxon"" section data

    // #region 5. Verify metrics under ""Sample details"" -> ""Pipelines""
    await samplesPage.clickSampleDetailsButton();
    await samplesPage.clickPipelinesTab();

    // PIPELINE INFO
    // Analysis Type=Metagenomic
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsAnalysisType()).toEqual(
          "Metagenomic",
        ),
      SAMPLE_DETAILS_ANALYSIS_TYPE,
    );

    // Sequencing Platform=Nanopore
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsSequencingPlatform()).toEqual(
          "Nanopore",
        ),
      SAMPLE_DETAILS_SEQUENCING_PLATFORM,
    );

    // Pipeline Version=v0.7 View Pipeline Visualization {VARIABLE VALUE}
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsPipelineVersion()).toEqual(
          PIPELINE_VISUALIZATION_7,
        ),
      SAMPLE_DETAILS_PIPELINE_VERSION,
    );

    // Guppy Basecaller Version=hac
    collector.collect(
      async () =>
        expect(
          await samplesPage.getSampleDetailsGuppyBasecallerVersion(),
        ).toEqual("hac"),
      SAMPLE_DETAILS_GUPPY_BASECALLER_VERSION,
    );

    // NCBI Index Date=2021-01-22 {VARIABLE VALUE}
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsNcbiIndexDate()).toEqual(
          DATE_2024_02_06,
        ),
      SAMPLE_DETAILS_NCBI_INDEX_DATE,
    );

    // Host Subtracted=Human
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsHostSubtracted()).toEqual(
          "Human",
        ),
      SAMPLE_DETAILS_HOST_SUBTRACTED,
    );

    // Total Reads=265
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsTotalReads(),
      "265",
      SAMPLE_DETAILS_TOTAL_READS,
    );

    // ERCC Reads=--
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsErccReads(),
      "--",
      SAMPLE_DETAILS_ERCC_READS,
    );

    // Passed Filters=163 (61.51%)
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsPassedFilters(),
      "163 (61.51%)",
      SAMPLE_DETAILS_PASSED_FILTERS,
    );

    // Unmapped Reads=29
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsUnmappedReads(),
      "30",
      SAMPLE_DETAILS_UNMAPPED_READS,
    );

    // Passed Quality Control=100.00%
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsPassedQualityControl(),
      "100.00%",
      SAMPLE_DETAILS_PASSED_QUALITY_CONTROL,
    );

    // Date Processed=2024-02-24 {VARIABLE VALUE}
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsDateProcessed()).toEqual(
          new Date().toISOString().substring(0, 10),
        ),
      SAMPLE_DETAILS_DATE_PROCESSED,
    );

    // BASES REMAINING
    await samplesPage.clickBasesRemainingToggle();

    // Filtering Step|Bases Remaining|% Bases Remaining
    const basesRemainingTable = await samplesPage.getBasesRemainingTable();

    // Validate Input|8,686,470|100.00%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[0], {
      "Filtering Step": VALIDATE_INPUT,
      "Bases Remaining": "8,686,470",
      "% Bases Remaining": "100.00%",
    });

    // Quality Filter|8,686,470|100.00%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[1], {
      "Filtering Step": QUALITY_FILTER,
      "% Bases Remaining": "100.00%",
      "Bases Remaining": "8,686,470",
    });

    // Host Filter|1,671,959|19.25%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[2], {
      "Filtering Step": HOST_FILTER,
      "Bases Remaining": "1,671,959",
      "% Bases Remaining": "19.25%",
    });

    // Human Filter|1,671,959|19.25%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[3], {
      "Filtering Step": HUMAN_FILTER,
      "Bases Remaining": "1,671,959",
      "% Bases Remaining": "19.25%",
    });

    // Subsampling|1,671,959|19.25%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[4], {
      "Filtering Step": "Subsampling",
      "Bases Remaining": "1,671,959",
      "% Bases Remaining": "19.25%",
    });

    await samplesPage.clickSampleDetailsCloseIcon();
    // #endregion 5. Verify metrics under ""Sample details"" -> ""Pipelines""

    // #region 6. From the sample report, click on the Download button for:

    // 6. Verify the specified data file outputs against baseline outputs
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - HG002_long_reads_metaG_contigs.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_report.csv`).toEqual(
          reportTableCsv.suggestedFilename(),
        ),
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    downloadedContent.push(reportTableCsv);

    // - Non-Host Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    // - HG002_long_reads_metaG_contigs_summary.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_nonhost.fasta`).toEqual(
          nonHostReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Non-Host Contigs (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostContigsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    // - HG002_long_reads_metaG_nonhost.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs.fasta`).toEqual(
          nonHostContigsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    downloadedContent.push(nonHostContigsFasta);

    // - Non-Host Contigs Summary (.csv)
    await samplesPage.clickDownloadButton();
    const nonHostContigsSummaryCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    // - HG002_long_reads_metaG_report.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs_summary.csv`).toEqual(
          nonHostContigsSummaryCsv.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    downloadedContent.push(nonHostContigsSummaryCsv);

    // - Unmapped Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const unmappedReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    // - HG002_long_reads_metaG_unidentified.fasta"
    collector.collect(
      async () =>
        expect(`${sampleName}_unidentified.fasta`).toEqual(
          unmappedReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    downloadedContent.push(unmappedReadsFasta);

    // The following files from the downloads folder should match those of the baseline run:
    // Index Date: 2024
    // Outputs: Output
    // https://drive.google.com/drive/folders/1P8tUw0TTPNeVCPYiW7VZgS_hEQVTW4tN
    await compareDataFilesWithTolerance(
      downloadedContent,
      "mNGS/HG002_long_reads_metaG/e14",
      sampleName,
      HG002_LONG_READS_METAG_BASELINE_NAME,
    );
    // #endregion 6. From the sample report, click on the Download button for:
  });

  test.skip("SNo e15: mNGS Nanopore Mosquito Sample Report & Download Data Validation  - New database", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `SNo-e15_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for 28A-idseq-mosq.2to4mil_subsample_10p (see ""Data"") as a Metagenomic, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // sample fastq: HG002_long_reads_metaG.fastq.gz
      // https://drive.google.com/file/d/1lGcjevdszr7sGZnQXf7fT2NjfZhp78M7/view?usp=drive_link
      IDSEQ_MOSQ_SAMPLE_FILES,
      IDSEQ_MOSQ_SAMPLE_NAMES,
      WORKFLOWS.LMNGS,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Mosquito
        hostOrganism: "Mosquito",
        // - Sequencing Platform=Nanopore
        sequencingPlatform: WORKFLOWS.LMNGS, // Nanopore
        // - Guppy Basecaller Settings=hac
        guppyBasecaller: "hac",
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for 28A-idseq-mosq.2to4mil_subsample_10p (see ""Data"") as a Metagenomic, use the configuration:

    // #region 3. Select ""Metagenomics Nanopore"" tab
    let sampleName = "";
    let samplesPage = new SamplesPage(page);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      await samplesPage.waitForReportComplete(uploadedSample.id);
      await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Metagenomics Nanopore"" tab

    // #region 4. Verify ""Taxon"" section data
    samplesPage = await projectPage.clickSample(sampleName);

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):
    const reportTable = await samplesPage.getReportFilterTable();

    // ""28A-idseq-mosq.2to4mil_subsample_10p"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // Top NT hit is:
    const row1 = reportTable[0];
    // Taxon=Acinetobacter( 3 bacterial species:1 )
    collector.collect(
      async () =>
        expect(row1["Taxon"]).toEqual("Acinetobacter( 2 bacterial species )"),
      SAMPLE_REPORT_TAXON,
    ); // Expected: Taxon=Acinetobacter( 3 bacterial species:1 ), Actual: Acinetobacter( 2 bacterial species )

    // bMP=5,094.5 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["bPM"],
      ["5,094.5", "0.0"],
      SAMPLE_REPORT_BPM,
    );

    // b=29,807 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["b"],
      ["29,807", "0"],
      SAMPLE_REPORT_B,
    );

    // r=6 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["r"],
      ["6", "0"],
      SAMPLE_REPORT_R,
    );

    // contig=0 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["contig"],
      ["0", "0"],
      SAMPLE_REPORT_CONTIG,
    );

    // contig b=0 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["contig b"],
      ["0", "0"],
      SAMPLE_REPORT_CONTIG_B,
    );

    // % id=93.9 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["%id"],
      ["93.9", "0.0"],
      SAMPLE_REPORT_PERCENTAGE_ID,
    );

    // L=4,910.0 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["L"],
      ["4,910.0", "0.0"],
      SAMPLE_REPORT_L,
    );

    // E value=10-308 | 0
    await verifyReportTableValuesUpperAndLowerBounds(
      row1["E value"],
      ["10-308", "0"],
      SAMPLE_REPORT_E_VALUE,
    );
    // #endregion 4. Verify ""Taxon"" section data

    // #region 5. Verify metrics under ""Sample details"" -> ""Pipelines""
    await samplesPage.clickSampleDetailsButton();
    await samplesPage.clickPipelinesTab();

    // PIPELINE INFO
    // Analysis Type=Metagenomic
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsAnalysisType()).toEqual(
          "Metagenomic",
        ),
      SAMPLE_DETAILS_ANALYSIS_TYPE,
    );

    // Sequencing Platform=Nanopore
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsSequencingPlatform()).toEqual(
          "Nanopore",
        ),
      SAMPLE_DETAILS_SEQUENCING_PLATFORM,
    );

    // Pipeline Version=v0.7 View Pipeline Visualization {VARIABLE VALUE}
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsPipelineVersion()).toEqual(
          PIPELINE_VISUALIZATION_7,
        ),
      SAMPLE_DETAILS_PIPELINE_VERSION,
    );

    // Guppy Basecaller Version=hac
    collector.collect(
      async () =>
        expect(
          await samplesPage.getSampleDetailsGuppyBasecallerVersion(),
        ).toEqual("hac"),
      SAMPLE_DETAILS_GUPPY_BASECALLER_VERSION,
    );

    // NCBI Index Date=2024-02-06 {VARIABLE VALUE}
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsNcbiIndexDate()).toEqual(
          DATE_2024_02_06,
        ),
      SAMPLE_DETAILS_NCBI_INDEX_DATE,
    );

    // Host Subtracted=Mosquito
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsHostSubtracted()).toEqual(
          "Mosquito",
        ),
      SAMPLE_DETAILS_HOST_SUBTRACTED,
    );

    // Total Reads=2,000
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsTotalReads(),
      "2,000",
      SAMPLE_DETAILS_TOTAL_READS,
    );

    // ERCC Reads=--
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsErccReads(),
      "--",
      SAMPLE_DETAILS_ERCC_READS,
    );

    // Passed Filters=97 (4.85%)
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsPassedFilters(),
      "97 (4.85%)",
      SAMPLE_DETAILS_PASSED_FILTERS,
    );

    // Unmapped Reads=58
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsUnmappedReads(),
      "58",
      SAMPLE_DETAILS_UNMAPPED_READS,
    );

    // Passed Quality Control=99.95%
    await verifyPipelineUpperAndLowerBounds(
      await samplesPage.getSampleDetailsPassedQualityControl(),
      "99.95%",
      SAMPLE_DETAILS_PASSED_QUALITY_CONTROL,
    );

    // Date Processed=2024-04-03 {VARIABLE VALUE}
    collector.collect(
      async () =>
        expect(await samplesPage.getSampleDetailsDateProcessed()).toEqual(
          new Date().toISOString().substring(0, 10),
        ),
      SAMPLE_DETAILS_DATE_PROCESSED,
    );

    // BASES REMAINING
    await samplesPage.clickBasesRemainingToggle();

    // Filtering Step|Bases Remaining|% Bases Remaining
    const basesRemainingTable = await samplesPage.getBasesRemainingTable();
    // Validate Input|5,850,822|100.00%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[0], {
      "Filtering Step": VALIDATE_INPUT,
      "Bases Remaining": "5,850,822",
      "% Bases Remaining": "100.00%",
    });

    // Quality Filter|5,850,466|99.99%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[1], {
      "Filtering Step": QUALITY_FILTER,
      "% Bases Remaining": "99.99%",
      "Bases Remaining": "5,850,466",
    });

    // Host Filter|404,940|6.92%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[2], {
      "Filtering Step": HOST_FILTER,
      "Bases Remaining": "404,940",
      "% Bases Remaining": "6.92%",
    });

    // Human Filter|285,564|4.88%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[3], {
      "Filtering Step": HUMAN_FILTER,
      "Bases Remaining": "285,564",
      "% Bases Remaining": "4.88%",
    });

    // Subsampling|285,564|4.88%
    await verifyBasesRemainingUpperAndLowerBounds(basesRemainingTable[4], {
      "Filtering Step": "Subsampling",
      "Bases Remaining": "285,564",
      "% Bases Remaining": "4.88%",
    });

    await samplesPage.clickSampleDetailsCloseIcon();
    // #endregion 5. Verify metrics under ""Sample details"" -> ""Pipelines""

    // #region 6. From the sample report, click on the Download button for:

    // 6. Verify the specified data file outputs against baseline outputs
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - 28A-idseq-mosq.2to4mil_subsample_10p_contigs.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_report.csv`).toEqual(
          reportTableCsv.suggestedFilename(),
        ),
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    downloadedContent.push(reportTableCsv);

    // - Non-Host Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    // - 28A-idseq-mosq.2to4mil_subsample_10p_contigs_summary.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_nonhost.fasta`).toEqual(
          nonHostReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Non-Host Contigs Summary (.csv)
    await samplesPage.clickDownloadButton();
    const nonHostContigsSummaryCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    // - 28A-idseq-mosq.2to4mil_subsample_10p_report.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs_summary.csv`).toEqual(
          nonHostContigsSummaryCsv.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    downloadedContent.push(nonHostContigsSummaryCsv);

    // - Non-Host Contigs (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostContigsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    // - 28A-idseq-mosq.2to4mil_subsample_10p_nonhost.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs.fasta`).toEqual(
          nonHostContigsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    downloadedContent.push(nonHostContigsFasta);

    // - Unmapped Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const unmappedReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    // - 28A-idseq-mosq.2to4mil_subsample_10p_unidentified.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_unidentified.fasta`).toEqual(
          unmappedReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    downloadedContent.push(unmappedReadsFasta);

    // The following files from the downloads folder should match those of the baseline run:

    // sample fastq: 28A-idseq-mosq.2to4mil_subsample_10p.fq.gz
    // https://drive.google.com/file/d/1ZqKtet7Jslk0KNVJ7BGUwhnGGuj_l1Wo/view?usp=drive_link

    // Outputs: Output_NewDB
    // https://drive.google.com/drive/folders/119QjRhTUS0V5q5j2LPEYmDhWoFp_lRxr?usp=drive_link
    await compareDataFilesWithTolerance(
      downloadedContent,
      "mNGS/28A-idseq-mosq_2to4mil_subsample_10p/e15",
      sampleName,
      IDSEQ_MOSQ_2TO4MIL_SUBSAMPLE,
    );
    // #endregion 6. From the sample report, click on the Download button for:
  });

  test("SNo e16: mNGS Illumina Single Read Sample Report & Download Data Validation - New database", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `SNo-e16_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p (see ""Data"") as a Metagenomic, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // sample fastq: mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_R1.fastq.gz
      // https://drive.google.com/file/d/13wf2ZZKzozGV-taslLDBEYjQtPh_Bc6w/view?usp=drive_link
      MWGS_SE_SAMPLE_FILES,
      MWGS_SE_SAMPLE_NAMES,
      WORKFLOWS.MNGS,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Human
        hostOrganism: "Human",
        // - Sequencing Platform=Illumina
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p (see ""Data"") as a Metagenomic, use the configuration:

    // #region 3. Select ""Metagenomics"" tab
    let sampleName = "";
    let samplesPage = new SamplesPage(page);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      await samplesPage.waitForReportComplete(uploadedSample.id);
      await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Metagenomics"" tab

    // #region 4. Verify ""Taxon"" section data
    samplesPage = await projectPage.clickSample(sampleName);

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):
    const reportTable = await samplesPage.getReportFilterTable();
    const expectedReportTable = {
      Taxon: /Streptococcus\( \d+ bacterial species(?:\s*:\d+)? \)/,
      Score: "-",
      "Z Score": "-",
      rPM: ["571,798.2", "533,635.2"],
      r: ["884", "825"],
      contig: ["0", "0"],
      "contig r": ["0", "0"],
      "%id": ["98.6", "98.4"],
      L: ["123.3", "39.3"],
      "E value": ["10-69", "10-17"],
      NTNR: "",
    };

    // ""mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // Top NT hit is:
    const row1 = reportTable[0];
    for (const key of Object.keys(expectedReportTable)) {
      await verifyReportTableValuesUpperAndLowerBounds(
        row1[key],
        expectedReportTable[key],
        `Sample Report - ${key}`,
      );
    }
    // #endregion 4. Verify ""Taxon"" section data

    // #region 5. Verify metrics under ""Sample details"" -> ""Pipelines""
    await samplesPage.clickSampleDetailsButton();
    await samplesPage.clickPipelinesTab();

    // PIPELINE INFO
    const pipelineInfoTable = await samplesPage.getPipelineInfoTable();
    const expectedPipelineInfoTable = {
      "Analysis Type": "Metagenomic",
      "Sequencing Platform": "Illumina",
      "Pipeline Version": ["v8.3", PIPELINE_VISUALIZATION],
      "NCBI Index Date": DATE_2024_02_06,
      "Host Subtracted": "Human",
      "Total Reads": "1,546",
      "ERCC Reads": "--",
      "Passed Filters": "1,524 (98.58%)",
      "Unmapped Reads": "16",
      "Passed Quality Control": "99.61%",
      "Compression Ratio": "1.00",
      "Mean Insert Size": "--",
      "Date Processed": new Date().toISOString().substring(0, 10),
    };

    for (const key of Object.keys(expectedPipelineInfoTable)) {
      await verifyBasesRemainingUpperAndLowerBounds(
        pipelineInfoTable[key],
        expectedPipelineInfoTable[key],
        READS,
      );
    }

    // READS REMAINING
    await samplesPage.clickReadsRemainingToggle();

    // Filtering Step|Reads Remaining|% Reads Remaining
    const readsRemainingTable = await samplesPage.getBasesRemainingTable();
    const expectedReadsRemainingTable = [
      {
        "Filtering Step": VALIDATE_INPUT,
        "Reads Remaining": "1,546",
        "% Reads Remaining": "100.00%",
      },
      {
        "Filtering Step": ERCC_BOWTIE2_FILTER,
        "Reads Remaining": "1,546",
        "% Reads Remaining": "100.00%",
      },
      {
        "Filtering Step": "Fastp Qc",
        "Reads Remaining": "1,540",
        "% Reads Remaining": "99.61%",
      },
      {
        "Filtering Step": BOWTIE2_FILTER,
        "Reads Remaining": "1,524",
        "% Reads Remaining": "98.58%",
      },
      {
        "Filtering Step": HISAT2_FILTER,
        "Reads Remaining": "1,524",
        "% Reads Remaining": "98.58%",
      },
      {
        "Filtering Step": CZID_DEDUP,
        "Reads Remaining": ["1,524", "(1,520 unique)"],
        "% Reads Remaining": "98.58%",
      },
      {
        "Filtering Step": "Subsample",
        "Reads Remaining": "1,524",
        "% Reads Remaining": "98.58%",
      },
    ];

    collector.collect(
      async () =>
        expect(readsRemainingTable.length).toEqual(
          expectedReadsRemainingTable.length,
        ),
      READS_REMAINING_COLUMN_COUNT,
    );
    for (const i in expectedReadsRemainingTable) {
      await verifyBasesRemainingUpperAndLowerBounds(
        readsRemainingTable[i],
        expectedReadsRemainingTable[i],
        READS,
      );
    }

    await samplesPage.clickSampleDetailsCloseIcon();
    // #endregion 5. Verify metrics under ""Sample details"" -> ""Pipelines""

    // #region 6. From the sample report, click on the Download button for:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_report.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_report.csv`).toEqual(
          reportTableCsv.suggestedFilename(),
        ),
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    downloadedContent.push(reportTableCsv);

    // - Non-Host Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    // - mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_nonhost.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_nonhost.fasta`).toEqual(
          nonHostReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Unmapped Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const unmappedReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    // - mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_unidentified.fasta"
    collector.collect(
      async () =>
        expect(`${sampleName}_unidentified.fasta`).toEqual(
          unmappedReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    downloadedContent.push(unmappedReadsFasta);
    // #endregion 6. From the sample report, click on the Download button for:

    // #region 7. Verify the specified data file outputs against baseline outputs"
    // The following files from the downloads folder should match those of the baseline run:
    // Outputs: Output mWGS NewDB
    // 2024
    // project 1479
    // samples 50056
    await compareDataFilesWithTolerance(
      downloadedContent,
      "mNGS/mWGS_SE_SRR7002140_TA/e16",
      sampleName,
      MWGS_SE_SAMPLE,
    );
    // #endregion 7. Verify the specified data file outputs against baseline outputs"
  });

  test("SNo e17: mNGS Illumina Paired Read Sample Report & Download Data Validation - New database", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `SNo-e17_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p (see ""Data"") as a Metagenomic, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // "sample fastq:
      // mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_R1.fastq.gz
      // mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_R2.fastq.gz"
      // https://drive.google.com/file/d/1QNXYla-LTIQGk5HpCYwYEf1xyrFzw1eq/view?usp=drive_link
      MWGS_PE_SRR7002140_TAP_FILES,
      MWGS_PE_SRR7002140_TAP_SAMPLE_NAMES,
      WORKFLOWS.MNGS,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Human
        hostOrganism: "Human",
        // - Sequencing Platform=Illumina
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p (see ""Data"") as a Metagenomic, use the configuration:

    // #region 3. Select ""Metagenomics"" tab
    let sampleName = "";
    let samplesPage = new SamplesPage(page);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      await samplesPage.waitForReportComplete(uploadedSample.id);
      await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Metagenomics"" tab

    // #region 4. Verify ""Taxon"" section data
    samplesPage = await projectPage.clickSample(sampleName);

    // Comparing with baseline sample report(s) (older versions reports of the same sample):
    const reportTable = await samplesPage.getReportFilterTable();
    const expectedReportTable = {
      Taxon: /Streptococcus\( \d+ bacterial species(?:\s*:\d+)? \)/,
      Score: "-",
      "Z Score": "-",
      rPM: ["566,947.0", "531,047.9"],
      r: ["1,753", "1,642"],
      contig: ["0", "0"],
      "contig r": ["0", "0"],
      "%id": ["98.4", "98.0"],
      L: ["123.3", "39.3"],
      "E value": ["10-69", "10-17"],
      NTNR: "",
    };

    // ""mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // Top NT hit is:
    const row1 = reportTable[0];
    for (const key of Object.keys(expectedReportTable)) {
      await verifyReportTableValuesUpperAndLowerBounds(
        row1[key],
        expectedReportTable[key],
        `Sample Report - ${key}`,
      );
    }
    // #endregion 4. Verify ""Taxon"" section data

    // #region 5. Verify metrics under ""Sample details"" -> ""Pipelines""
    await samplesPage.clickSampleDetailsButton();
    await samplesPage.clickPipelinesTab();

    const pipelineInfoTable = await samplesPage.getPipelineInfoTable();
    const expectedPipelineInfoTable = {
      "Analysis Type": "Metagenomic",
      "Sequencing Platform": "Illumina",
      "Pipeline Version": ["v8.3", PIPELINE_VISUALIZATION],
      "NCBI Index Date": DATE_2024_02_06,
      "Host Subtracted": "Human",
      "Total Reads": "3,092",
      "ERCC Reads": "--",
      "Passed Filters": "3,036 (98.19%)",
      "Unmapped Reads": "30",
      "Passed Quality Control": "99.22%",
      "Compression Ratio": "1.00",
      "Mean Insert Size": "222±145",
      "Date Processed": new Date().toISOString().substring(0, 10),
    };

    // PIPELINE INFO
    // Analysis Type=Metagenomic
    for (const key of Object.keys(expectedPipelineInfoTable)) {
      await verifyBasesRemainingUpperAndLowerBounds(
        pipelineInfoTable[key],
        expectedPipelineInfoTable[key],
        READS,
      );
    }

    // READS REMAINING
    await samplesPage.clickReadsRemainingToggle();

    // Filtering Step|Reads Remaining|% Reads Remaining
    const readsRemainingTable = await samplesPage.getBasesRemainingTable();
    const expectedReadsRemainingTable = [
      {
        "Filtering Step": VALIDATE_INPUT,
        "Reads Remaining": "3,092",
        "% Reads Remaining": "100.00%",
      },
      {
        "Filtering Step": ERCC_BOWTIE2_FILTER,
        "Reads Remaining": "3,092",
        "% Reads Remaining": "100.00%",
      },
      {
        "Filtering Step": "Fastp Qc",
        "Reads Remaining": "3,068",
        "% Reads Remaining": "99.22%",
      },
      {
        "Filtering Step": BOWTIE2_FILTER,
        "Reads Remaining": "3,036",
        "% Reads Remaining": "98.19%",
      },
      {
        "Filtering Step": HISAT2_FILTER,
        "Reads Remaining": "3,036",
        "% Reads Remaining": "98.19%",
      },
      {
        "Filtering Step": CZID_DEDUP,
        "Reads Remaining": ["3,036", "(3,036 unique)"],
        "% Reads Remaining": "98.19%",
      },
      {
        "Filtering Step": "Subsample",
        "Reads Remaining": "3,036",
        "% Reads Remaining": "98.19%",
      },
    ];
    collector.collect(
      async () =>
        expect(readsRemainingTable.length).toEqual(
          expectedReadsRemainingTable.length,
        ),
      READS_REMAINING_COLUMN_COUNT,
    );
    for (const i in expectedReadsRemainingTable) {
      await verifyBasesRemainingUpperAndLowerBounds(
        readsRemainingTable[i],
        expectedReadsRemainingTable[i],
        READS,
      );
    }

    await samplesPage.clickSampleDetailsCloseIcon();
    // #endregion 5. Verify metrics under ""Sample details"" -> ""Pipelines""

    // #region 6. From the sample report, click on the Download button for:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_report.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_report.csv`).toEqual(
          reportTableCsv.suggestedFilename(),
        ),
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    downloadedContent.push(reportTableCsv);

    // - Non-Host Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    // - mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_nonhost.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_nonhost.fasta`).toEqual(
          nonHostReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Unmapped Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const unmappedReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    // - mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_unidentified.fasta"
    collector.collect(
      async () =>
        expect(`${sampleName}_unidentified.fasta`).toEqual(
          unmappedReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    downloadedContent.push(unmappedReadsFasta);
    // #endregion 6. From the sample report, click on the Download button for:

    // #region 7. Verify the specified data file outputs against baseline outputs"

    // The following files from the downloads folder should match those of the baseline run:
    // Outputs: Output mWGS NewDB project 1489 samples 50054
    await compareDataFilesWithTolerance(
      downloadedContent,
      "mNGS/mWGS_PE_SRR7002140_TA/e17",
      sampleName,
      MWGS_PE_SRR7002140_TAP,
    );
    // #endregion 7. Verify the specified data file outputs against baseline outputs"
  });

  test("SNo e18: mNGS Illumina Paired Read RNA Mosquito Sample Report & Download Data Validation - New database", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `SNo-e18_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for mWGS_RNA_mosquito-1-aedes-rna_10p (see ""Data"") as a Metagenomic, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // "sample fastq:
      // mWGS_RNA_mosquito-1-aedes-rna_10p_R1.fastq.gz
      // https://drive.google.com/file/d/1cknRbz6wGYwoYDFhH9GO8IfBcDQBBMM9/view?usp=drive_link
      // mWGS_RNA_mosquito-1-aedes-rna_10p_R2.fastq.gz"
      // https://drive.google.com/file/d/1kwdYlFtuPZK8uPfPflayVOuwpUrL-lO8/view?usp=drive_link
      MWGS_RNA_MOSQUITO_FILES,
      MWGS_RNA_MOSQUITO_SAMPLE_NAMES,
      WORKFLOWS.MNGS,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Mosquito
        hostOrganism: "Mosquito",
        // - Sequencing Platform=Illumina
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for mWGS_RNA_mosquito-1-aedes-rna_10p (see ""Data"") as a Metagenomic, use the configuration:

    // #region 3. Select ""Metagenomics"" tab
    let sampleName = "";
    let samplesPage = new SamplesPage(page);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      await samplesPage.waitForReportComplete(uploadedSample.id);
      await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Metagenomics"" tab

    // #region 4. Verify ""Taxon"" section data
    samplesPage = await projectPage.clickSample(sampleName);

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):
    const reportTable = await samplesPage.getReportFilterTable();

    // ""mWGS_RNA_mosquito-1-aedes-rna_10p"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // Top NT hit is:
    const row1 = reportTable[0];
    const expectedReportTable = {
      Taxon: /Gonomyia\( \d+ eukaryotic species(?:\s*:\d+)? \)/,
      Score: "-",
      "Z Score": "-",
      rPM: ["59,049.9", "0.0"],
      r: ["19,107", "0"],
      contig: ["8", "0"],
      "contig r": ["18,653", "0"],
      "%id": ["94.0", "0.0"],
      L: ["719.2", "0.0"],
      "E value": ["10-277", "0"],
      NTNR: "",
    };
    for (const key of Object.keys(expectedReportTable)) {
      await verifyReportTableValuesUpperAndLowerBounds(
        row1[key],
        expectedReportTable[key],
        `Sample Report - ${key}`,
      );
    }
    // #endregion 4. Verify ""Taxon"" section data

    // #region 5. Verify metrics under ""Sample details"" -> ""Pipelines""
    await samplesPage.clickSampleDetailsButton();
    await samplesPage.clickPipelinesTab();

    const pipelineInfoTable = await samplesPage.getPipelineInfoTable();
    const expectedPipelineInfoTable = {
      "Analysis Type": "Metagenomic",
      "Sequencing Platform": "Illumina",
      "Pipeline Version": ["v8.3", PIPELINE_VISUALIZATION],
      "NCBI Index Date": DATE_2024_02_06,
      "Host Subtracted": "Mosquito",
      "Total Reads": "323,606",
      "ERCC Reads": "32 (0.01%)",
      "Passed Filters": "106,772 (32.99%)",
      "Unmapped Reads": "60,558",
      "Passed Quality Control": "88.70%",
      "Compression Ratio": "1.03",
      "Mean Insert Size": "--",
      "Date Processed": new Date().toISOString().substring(0, 10),
    };
    for (const key of Object.keys(expectedPipelineInfoTable)) {
      await verifyBasesRemainingUpperAndLowerBounds(
        pipelineInfoTable[key],
        expectedPipelineInfoTable[key],
        READS,
      );
    }

    // READS REMAINING
    await samplesPage.clickReadsRemainingToggle();

    // Filtering Step|Reads Remaining|% Reads Remaining
    const readsRemainingTable = await samplesPage.getBasesRemainingTable();
    const expectedReadsRemainingTable = [
      {
        "Filtering Step": VALIDATE_INPUT,
        "Reads Remaining": "323,606",
        "% Reads Remaining": "100.00%",
      },
      {
        "Filtering Step": ERCC_BOWTIE2_FILTER,
        "Reads Remaining": "323,574",
        "% Reads Remaining": "99.99%",
      },
      {
        "Filtering Step": "Fastp Qc",
        "Reads Remaining": "286,998",
        "% Reads Remaining": "88.69%",
      },
      {
        "Filtering Step": BOWTIE2_FILTER,
        "Reads Remaining": "109,510",
        "% Reads Remaining": "33.84%",
      },
      {
        "Filtering Step": HISAT2_FILTER,
        "Reads Remaining": "109,332",
        "% Reads Remaining": "33.79%",
      },
      {
        "Filtering Step": "Bowtie2 Human Filter",
        "Reads Remaining": "106,774",
        "% Reads Remaining": "33.00%",
      },
      {
        "Filtering Step": "Hisat2 Human Filter",
        "Reads Remaining": "106,772",
        "% Reads Remaining": "32.99%",
      },
      {
        "Filtering Step": CZID_DEDUP,
        "Reads Remaining": ["106,772", "(103,492 unique)"],
        "% Reads Remaining": "32.99%",
      },
      {
        "Filtering Step": "Subsample",
        "Reads Remaining": "106,772",
        "% Reads Remaining": "32.99%",
      },
    ];
    collector.collect(
      async () =>
        expect(readsRemainingTable.length).toEqual(
          expectedReadsRemainingTable.length,
        ),
      READS_REMAINING_COLUMN_COUNT,
    );
    for (const i in expectedReadsRemainingTable) {
      await verifyBasesRemainingUpperAndLowerBounds(
        readsRemainingTable[i],
        expectedReadsRemainingTable[i],
        READS,
      );
    }

    await samplesPage.clickSampleDetailsCloseIcon();
    // #endregion 5. Verify metrics under ""Sample details"" -> ""Pipelines""

    // #region 6. From the sample report, click on the Download button for:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_report.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_report.csv`).toEqual(
          reportTableCsv.suggestedFilename(),
        ),
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    downloadedContent.push(reportTableCsv);

    // - Non-Host Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_nonhost.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_nonhost.fasta`).toEqual(
          nonHostReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Non-Host Contigs (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostContigsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_contigs.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs.fasta`).toEqual(
          nonHostContigsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    downloadedContent.push(nonHostContigsFasta);

    // - Non-Host Contigs Summary (.csv)
    await samplesPage.clickDownloadButton();
    const nonHostContigsSummaryCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_contigs_summary.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs_summary.csv`).toEqual(
          nonHostContigsSummaryCsv.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    downloadedContent.push(nonHostContigsSummaryCsv);

    // - Unmapped Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const unmappedReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_unidentified.fasta"
    collector.collect(
      async () =>
        expect(`${sampleName}_unidentified.fasta`).toEqual(
          unmappedReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    downloadedContent.push(unmappedReadsFasta);
    // #endregion 6. From the sample report, click on the Download button for:

    // #region 7. Verify the specified data file outputs against baseline outputs"

    // The following files from the downloads folder should match those of the baseline run:

    // 2024
    // Outputs: Output mWGS NewDB
    // New Baseline: project: 1485 Sample: 47360
    await compareDataFilesWithTolerance(
      downloadedContent,
      "mNGS/mWGS_RNA_MOSQUITO_1_AEDES_RNA_10p/e18",
      sampleName,
      MWGS_RNA_MOSQUITO,
    );
    // #endregion 7. Verify the specified data file outputs against baseline outputs"
  });

  test("SNo e19: mNGS Illumina Paired Read RNA Human Sample Report & Download Data Validation - New database", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `SNo-e19_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for mWGS_RNA_human-128-lung-rna_10p_contigs (see ""Data"") as a Metagenomic, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // "sample fastq:
      // mWGS_RNA_human-128-lung-rna_10p_R1.fastq.gz
      // https://drive.google.com/file/d/1QOwyK6rDitgjIjohj6KWXS5CRsZrLaSE/view?usp=drive_link
      // mWGS_RNA_human-128-lung-rna_10p_R2.fastq.gz"
      // https://drive.google.com/file/d/1LwqDvXqb09H59pD-hy_NZk4pPWtznlo9/view?usp=drive_link
      MWGS_RNA_HUMAN_FILES,
      MWGS_RNA_HUMAN_SAMPLE_NAMES,
      WORKFLOWS.MNGS,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Human
        hostOrganism: "Human",
        // - Sequencing Platform=Illumina
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for mWGS_RNA_human-128-lung-rna_10p_contigs (see ""Data"") as a Metagenomic, use the configuration:

    // #region 3. Select ""Metagenomics"" tab
    let sampleName = "";
    let samplesPage = new SamplesPage(page);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      await samplesPage.waitForReportComplete(uploadedSample.id);
      await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Metagenomics"" tab

    // #region 4. Verify ""Taxon"" section data
    samplesPage = await projectPage.clickSample(sampleName);

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):
    const reportTable = await samplesPage.getReportFilterTable();
    const expectedReportTable = {
      Taxon: /Orthopneumovirus\( \d+ viral species(?:\s*:\d+)? \)/,
      Score: "-",
      "Z Score": "-",
      rPM: ["8,128.8", "8,126.0"],
      r: ["2,840", "2,839"],
      contig: ["3", "3"],
      "contig r": ["2,835", "2,835"],
      "%id": ["99.6", "99.7"],
      L: ["7,434.9", "1,271.0"],
      "E value": ["10-306", "10-306"],
      NTNR: "",
    };

    // ""mWGS_RNA_human-128-lung-rna_10p_contigs"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // Top NT hit is:
    const row1 = reportTable[0];
    for (const key of Object.keys(expectedReportTable)) {
      await verifyReportTableValuesUpperAndLowerBounds(
        row1[key],
        expectedReportTable[key],
        `Sample Report - ${key}`,
      );
    }
    // #endregion 4. Verify ""Taxon"" section data

    // #region 5. Verify metrics under ""Sample details"" -> ""Pipelines""
    await samplesPage.clickSampleDetailsButton();
    await samplesPage.clickPipelinesTab();

    const pipelineInfoTable = await samplesPage.getPipelineInfoTable();
    const expectedPipelineInfoTable = {
      "Analysis Type": "Metagenomic",
      "Sequencing Platform": "Illumina",
      "Pipeline Version": ["v8.3", PIPELINE_VISUALIZATION],
      "NCBI Index Date": DATE_2024_02_06,
      "Host Subtracted": "Human",
      "Total Reads": "407,182",
      "ERCC Reads": "57,808 (14.20%)",
      "Passed Filters": "4,228 (1.04%)",
      "Unmapped Reads": "299",
      "Passed Quality Control": "75.87%",
      "Compression Ratio": "1.06",
      "Mean Insert Size": "164±69",
      "Date Processed": new Date().toISOString().substring(0, 10),
    };
    for (const key of Object.keys(expectedPipelineInfoTable)) {
      await verifyBasesRemainingUpperAndLowerBounds(
        pipelineInfoTable[key],
        expectedPipelineInfoTable[key],
        READS,
      );
    }

    // READS REMAINING
    await samplesPage.clickReadsRemainingToggle();

    // Filtering Step|Reads Remaining|% Reads Remaining
    const readsRemainingTable = await samplesPage.getBasesRemainingTable();
    const expectedReadsRemainingTable = [
      {
        "Filtering Step": VALIDATE_INPUT,
        "Reads Remaining": "407,182",
        "% Reads Remaining": "100.00%",
      },
      {
        "Filtering Step": ERCC_BOWTIE2_FILTER,
        "Reads Remaining": "349,374",
        "% Reads Remaining": "85.80%",
      },
      {
        "Filtering Step": "Fastp Qc",
        "Reads Remaining": "265,058",
        "% Reads Remaining": "65.10%",
      },
      {
        "Filtering Step": BOWTIE2_FILTER,
        "Reads Remaining": "4,238",
        "% Reads Remaining": "1.04%",
      },
      {
        "Filtering Step": HISAT2_FILTER,
        "Reads Remaining": "4,228",
        "% Reads Remaining": "1.04%",
      },
      {
        "Filtering Step": CZID_DEDUP,
        "Reads Remaining": ["4,228", "(4,006 unique)"],
        "% Reads Remaining": "1.04%",
      },
      {
        "Filtering Step": "Subsample",
        "Reads Remaining": "4,228",
        "% Reads Remaining": "1.04%",
      },
    ];
    collector.collect(
      async () =>
        expect(readsRemainingTable.length).toEqual(
          expectedReadsRemainingTable.length,
        ),
      READS_REMAINING_COLUMN_COUNT,
    );
    for (const i in expectedReadsRemainingTable) {
      await verifyBasesRemainingUpperAndLowerBounds(
        readsRemainingTable[i],
        expectedReadsRemainingTable[i],
        READS,
      );
    }

    await samplesPage.clickSampleDetailsCloseIcon();
    // #endregion 5. Verify metrics under ""Sample details"" -> ""Pipelines""

    // #region 6. From the sample report, click on the Download button for:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_report.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_report.csv`).toEqual(
          reportTableCsv.suggestedFilename(),
        ),
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    downloadedContent.push(reportTableCsv);

    // - Non-Host Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_nonhost.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_nonhost.fasta`).toEqual(
          nonHostReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Non-Host Contigs (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostContigsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_contigs.fasta
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs.fasta`).toEqual(
          nonHostContigsFasta.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    downloadedContent.push(nonHostContigsFasta);

    // - Non-Host Contigs Summary (.csv)
    await samplesPage.clickDownloadButton();
    const nonHostContigsSummaryCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_contigs_summary.csv
    collector.collect(
      async () =>
        expect(`${sampleName}_contigs_summary.csv`).toEqual(
          nonHostContigsSummaryCsv.suggestedFilename(),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_SUMMARY_CSV,
    );
    downloadedContent.push(nonHostContigsSummaryCsv);

    // - Unmapped Reads (.fasta)
    await samplesPage.clickDownloadButton();
    const unmappedReadsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_unidentified.fasta"
    collector.collect(
      async () =>
        expect(`${sampleName}_unidentified.fasta`).toEqual(
          unmappedReadsFasta.suggestedFilename(),
        ),
      DOWNLOAD_UNMAPPED_READS_FASTA,
    );
    downloadedContent.push(unmappedReadsFasta);
    // #endregion 6. From the sample report, click on the Download button for:

    // 7. Verify the specified data file outputs against baseline outputs"

    // The following files from the downloads folder should match those of the baseline run:
    // 2024
    // Outputs: Output mWGS NewDB
    // https://drive.google.com/drive/folders/19JpCFGJvd7E5AUUR3QWI_SRkFfPd7dkw?usp=sharing
    await compareDataFilesWithTolerance(
      downloadedContent,
      "mNGS/mWGS_RNA_HUMAN_128_LUNG_RNA_10p/e19",
      sampleName,
      MWGS_RNA_HUMAN,
    );
  });
});

// #region Helpers
/*
 * Calculate an upper and lower bound for a given number (expectedValue)
 * based on the given tollerance
 *
 * Example:
 * expectedValue = 100
 * tollerance = 0.10
 *
 * lowerBound = 100 * (1 - 0.10) = 100 * 0.90 = 90
 * upperBound = 100 * (1 + 0.10) = 100 * 1.10 = 110
 */
export async function getUpperAndLowerBounds(
  expectedValue: number,
  tollerance = 0.1,
) {
  if (expectedValue === 0) {
    return { lowerBound: -tollerance, upperBound: tollerance };
  } else {
    const lowerBound = expectedValue * (1 - tollerance);
    const upperBound = expectedValue * (1 + tollerance);
    return expectedValue >= 0
      ? { lowerBound, upperBound }
      : { lowerBound: upperBound, upperBound: lowerBound };
  }
}

async function verifyPipelineUpperAndLowerBounds(
  actual: any,
  expected: any,
  message = "",
) {
  const numberAndPercentage = /([\d,]+) \(([\d.]+)%\)/;
  const percentage = /([\d.]+)%/;
  const mean = /([\d.]+)[±^eE-]+([\d.]+)/;
  if (expected.match(numberAndPercentage) || expected.match(mean)) {
    const numbersRegex = expected.match(mean) ? mean : numberAndPercentage;

    const expectedNumberStr1 = expected.match(numbersRegex)[1];
    const expectedNumberStr2 = expected.match(numbersRegex)[2];

    const actualNumberStr1 = actual.match(numbersRegex)[1];
    const actualNumberStr2 = actual.match(numbersRegex)[2];
    await verifyUpperAndLowerBounds(
      await parseFloatFromFormattedNumber(actualNumberStr1),
      await parseFloatFromFormattedNumber(expectedNumberStr1),
      message,
    );
    await verifyUpperAndLowerBounds(
      await parseFloatFromFormattedNumber(actualNumberStr2),
      await parseFloatFromFormattedNumber(expectedNumberStr2),
      message,
    );
  } else if (expected.match(percentage)) {
    const expectedNumberStr = expected.match(percentage)[1];
    const actualNumberStr = actual.match(percentage)[1];
    await verifyUpperAndLowerBounds(
      await parseFloatFromFormattedNumber(actualNumberStr),
      await parseFloatFromFormattedNumber(expectedNumberStr),
      message,
    );
  } else if (expected.includes("-")) {
    collector.collect(async () => expect(actual).toMatch(expected), message);
  } else {
    await verifyUpperAndLowerBounds(
      await parseFloatFromFormattedNumber(actual),
      await parseFloatFromFormattedNumber(expected),
      message,
    );
  }
}

async function verifyReportTableValuesUpperAndLowerBounds(
  actualReportTableValues: any,
  expectedReportTableValues: any,
  message = "",
) {
  const eValueRegex = /(\d+)-(\d+)/;
  if (message.endsWith("Taxon")) {
    collector.collect(
      async () =>
        expect(actualReportTableValues).toMatch(expectedReportTableValues),
      message,
    );
  } else if (
    !Array.isArray(expectedReportTableValues) ||
    !Array.isArray(actualReportTableValues)
  ) {
    collector.collect(
      async () =>
        expect(actualReportTableValues).toEqual(expectedReportTableValues),
      message,
    ); // "-"
  } else if (
    expectedReportTableValues[0].match(eValueRegex) ||
    expectedReportTableValues[1].match(eValueRegex)
  ) {
    // Example "E Value"s: ["10-277", "0"], ["10-69", "10-17"], ["10-306", "10-306"]
    for (const i in expectedReportTableValues) {
      const eValueMatch = expectedReportTableValues[i].match(eValueRegex); // number-number
      if (eValueMatch) {
        const expectedEValue1 = parseInt(eValueMatch[1]);
        const expectedEValue2 = parseInt(eValueMatch[2]);

        const actualEValueMatch = actualReportTableValues[i].match(eValueRegex);
        const actualEValue1 = parseInt(actualEValueMatch[1]);
        const actualEValue2 = parseInt(actualEValueMatch[2]);

        await verifyUpperAndLowerBounds(
          actualEValue1,
          expectedEValue1,
          message,
        );
        await verifyUpperAndLowerBounds(
          actualEValue2,
          expectedEValue2,
          message,
        );
      } else {
        collector.collect(
          async () =>
            expect(actualReportTableValues[i]).toEqual(
              expectedReportTableValues[i],
            ),
          message,
        ); // "0"
      }
    }
  } else {
    const expected1 = await parseFloatFromFormattedNumber(
      expectedReportTableValues[0],
    );
    const expected2 = await parseFloatFromFormattedNumber(
      expectedReportTableValues[1],
    );
    const actual1 = await parseFloatFromFormattedNumber(
      actualReportTableValues[0],
    );
    const actual2 = await parseFloatFromFormattedNumber(
      actualReportTableValues[1],
    );

    await verifyUpperAndLowerBounds(actual1, expected1, message);
    await verifyUpperAndLowerBounds(actual2, expected2, message);
  }
}

async function verifyBasesRemainingUpperAndLowerBounds(
  actualBasesRemaining: any,
  expectedBasesRemaining: any,
  tableKey = "Bases",
) {
  const filteringStep = actualBasesRemaining["Filtering Step"];
  collector.collect(
    async () =>
      expect(filteringStep).toEqual(expectedBasesRemaining["Filtering Step"]),
    "Sample Details - Filtering Step",
  );

  const remainingKey = `${tableKey} Remaining`;
  const percentageKey = `% ${tableKey} Remaining`;
  const message = `Sample Details - ${remainingKey}`;
  if (Array.isArray(expectedBasesRemaining[remainingKey])) {
    if (!Array.isArray(actualBasesRemaining[remainingKey])) {
      collector.collect(
        async () =>
          expect(actualBasesRemaining[remainingKey]).toEqual(
            expectedBasesRemaining[remainingKey],
          ),
        message,
      );
    } else {
      const basesRemaining = await parseIntFromFormattedNumber(
        actualBasesRemaining[remainingKey][0],
      );
      const basesRemainingUnique = await parseIntFromUniqueNumber(
        actualBasesRemaining[remainingKey][1],
      );

      const expectedBasesRemainingValue = await parseIntFromFormattedNumber(
        expectedBasesRemaining[remainingKey][0],
      );
      await verifyUpperAndLowerBounds(
        basesRemaining,
        expectedBasesRemainingValue,
        message,
      );

      const expectedBasesRemainingUniqueValue = await parseIntFromUniqueNumber(
        expectedBasesRemaining[remainingKey][1],
      );
      await verifyUpperAndLowerBounds(
        basesRemainingUnique,
        expectedBasesRemainingUniqueValue,
        message,
      );
    }
  } else if (typeof expectedBasesRemaining[remainingKey] === "string") {
    if (actualBasesRemaining[remainingKey].includes("%")) {
      const percentageBasesRemaining = await parseFloatFromPercentage(
        actualBasesRemaining[percentageKey],
      );
      const expectedPercentageBasesRemaining = await parseFloatFromPercentage(
        expectedBasesRemaining[percentageKey],
      );
      await verifyUpperAndLowerBounds(
        percentageBasesRemaining,
        expectedPercentageBasesRemaining,
        message,
      );
    } else if (expectedBasesRemaining[remainingKey].match(/[\d,]+/)) {
      const basesRemaining = await parseIntFromFormattedNumber(
        actualBasesRemaining[remainingKey],
      );
      const expectedBasesRemainingValue = await parseIntFromFormattedNumber(
        expectedBasesRemaining[remainingKey],
      );
      await verifyUpperAndLowerBounds(
        basesRemaining,
        expectedBasesRemainingValue,
        message,
      );
    } else {
      collector.collect(
        async () =>
          expect(actualBasesRemaining[remainingKey]).toEqual(
            expectedBasesRemaining[remainingKey],
          ),
        message,
      );
    }
  } else {
    collector.collect(
      async () =>
        expect(actualBasesRemaining[remainingKey]).toEqual(
          expectedBasesRemaining[remainingKey],
        ),
      message,
    );
  }
}

async function verifyUpperAndLowerBounds(
  actual: any,
  expected: any,
  message = "",
) {
  const expectedRange = await getUpperAndLowerBounds(expected);
  const msg = `${message} ${actual} vs ${expected}: Diff ${
    Math.abs((actual - expected) / ((actual + expected) / 2)) * 100
  }`;
  collector.collect(
    async () => expect(actual).toBeGreaterThanOrEqual(expectedRange.lowerBound),
    msg,
  );
  collector.collect(
    async () => expect(actual).toBeLessThanOrEqual(expectedRange.upperBound),
    msg,
  );
}

async function parseFloatFromFormattedNumber(numberString: string) {
  return parseFloat(numberString.replace(/,/g, ""));
}

async function parseIntFromFormattedNumber(numberString: string) {
  return parseInt(numberString.replace(/,/g, ""));
}

async function parseIntFromUniqueNumber(numberString: string) {
  const basesRemainingUniqueMatch = numberString.match(/\(([0-9,]+) unique\)/);
  return parseIntFromFormattedNumber(basesRemainingUniqueMatch[1]);
}

async function parseFloatFromPercentage(percentage: string) {
  const percentageMatch = percentage.match(/\d+\.?\d*%/);
  collector.collect(async () => expect(percentageMatch[0]).toBeDefined());

  return parseFloat(percentageMatch[0]);
}

function parseCSV(data: any, options: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    parse(data, options, (err, output) => {
      if (err) reject(err);
      else resolve(output);
    });
  });
}

async function compareDataFilesWithTolerance(
  downloadedContent: Array<Download>,
  fixtureDir: string,
  sampleName: string,
  baselineName: string,
  tollerance = 0.1,
) {
  for (const content of downloadedContent) {
    let contentName = content.suggestedFilename();

    if (contentName.endsWith(".zip") || contentName.endsWith(".fasta")) {
      continue; // Skip these types
    }
    const contentPath = await content.path();
    const stats = await fs.stat(contentPath);
    if (stats.size >= 50_000) {
      continue; // Skip. Diff on large files takes too long
    }
    if (contentName.startsWith(sampleName)) {
      // This name is dynamic
      contentName = contentName.replace(sampleName, baselineName);
    }

    const actualOutputData = await fs.readFile(contentPath);
    const expectedBaselineData = await fs.readFile(
      OUTPUT_PATH(fixtureDir, contentName),
    );

    let actualOutputStr = actualOutputData.toString();
    actualOutputStr = actualOutputStr.replace(sampleName, baselineName).trim();

    const expectedBaselineStr = expectedBaselineData.toString().trim();

    // Only if numbers differs >10% from previous runs
    const expectedMaxDiff = expectedBaselineStr.length * tollerance;
    const diff = fastDiff(actualOutputStr, expectedBaselineStr);

    const actualDiff = diff.length;
    if (contentName.endsWith(".csv") && actualDiff > expectedMaxDiff) {
      await compareCSV(contentName, actualOutputData, expectedBaselineData);
    } else {
      collector.collect(
        async () => expect(actualDiff).toBeLessThanOrEqual(expectedMaxDiff),
        `${contentName} overall diff`,
      );
    }
  }
}

async function sortCSV(csvData: any, key: string) {
  return csvData.sort((a, b) => {
    if (a[key] < b[key]) {
      return -1;
    }
    if (a[key] > b[key]) {
      return 1;
    }
    return 0;
  });
}

async function compareCSV(
  contentName: string,
  actualOutputData: any,
  expectedBaselineData: any,
) {
  const options = { columns: true, skip_empty_lines: true };

  const sortKey = contentName.endsWith("_summary.csv")
    ? "contig_name"
    : "tax_id";
  let actualData = await parseCSV(actualOutputData, options);
  actualData = await sortCSV(actualData, sortKey);
  let expectedData = await parseCSV(expectedBaselineData, options);
  expectedData = await sortCSV(expectedData, sortKey);

  collector.collect(
    async () => expect(actualData.length).toEqual(expectedData.length),
    `${contentName} length`,
  );
  for (const i in expectedData) {
    const actualRow = actualData[i];
    const expectedRow = expectedData[i];
    collector.collect(
      async () => expect(actualRow).toBeDefined(),
      `${contentName} row ${i} undefined`,
    );
    const message = `${contentName} row ${i} `;
    if (actualRow === undefined) {
      continue;
    }

    for (const key of Object.keys(expectedRow)) {
      const actualValue = actualRow[key];
      const expectedValue = expectedRow[key];

      if (NO_DIFF_FIELDS.includes(key) || !expectedValue || !actualValue) {
        collector.collect(
          async () => expect(actualValue).toEqual(expectedValue),
          message + key,
        );
      } else if (expectedValue.startsWith("[")) {
        if (!actualValue.startsWith("[")) {
          collector.collect(
            async () => expect(actualValue).toEqual(expectedValue),
            message + key,
          );
        } else {
          const expectedArray = await JSON.parse(expectedValue);
          const actualArray = await JSON.parse(actualValue);
          for (const i in expectedArray) {
            await verifyUpperAndLowerBounds(
              parseFloat(actualArray[i]),
              parseFloat(expectedArray[i]),
              message + key,
            );
          }
        }
      } else {
        await verifyUpperAndLowerBounds(
          parseFloat(actualValue),
          parseFloat(expectedValue),
          message + key,
        );
      }
    }
  }
}
// #endregion Helpers
