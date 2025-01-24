import * as fs from "fs/promises";
import { WORKFLOWS } from "@e2e/constants/common";
import {
  MWGS_SE_SRR7002140_TA_252_DNA_BLAC_VANP_10P,
  MWGS_PE_SRR7002140_TAP_R1,
  MWGS_PE_SRR7002140_TAP_R2,
  MWGS_RNA_MOSQUITO_1_AEDES_RNA_10p_R1,
  MWGS_RNA_MOSQUITO_1_AEDES_RNA_10p_R2,
  MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R1,
  MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R2,
} from "@e2e/constants/sample";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { AssertionCollector } from "@e2e/utils/assertion-collector";
import { test, expect, Download } from "@playwright/test";
import fastDiff = require("fast-diff");
import { ProjectPage } from "../../page-objects/project-page";
import {
  compareCSV,
  parseCSVArray,
  verifyUpperAndLowerBounds,
} from "@e2e/utils/download";

const MWGS_SE_SAMPLE = "mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p";
const MWGS_PE_SRR7002140_TAP = "mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p";

const SAMPLE_REPORT_SAMPLE_NAME = "Sample Report - Sample Name";

const LINCOSAMIDE_ANTIBIOTIC_MACROLIDE_ANTIBIOTIC =
  "lincosamide antibiotic; macrolide antibiotic";
const ANTIBIOTIC_TARGET_ALTERATION = "antibiotic target alteration";
const PROTEIN_HOMOLOG = "protein homolog";
const MSR_TYPE_ABC_F_PROTEIN = "msr-type ABC-F protein";
const MACROLIDE_ANTIBIOTIC_STREPTOGRAMIN_ANTIBIOTIC =
  "macrolide antibiotic; streptogramin antibiotic";
const ANTIBIOTIC_TARGET_PROTECTION = "antibiotic target protection";
const FLUOROQUINOLONE_ANTIBIOTIC = "fluoroquinolone antibiotic";
const ANTIBIOTIC_EFFLUX = "antibiotic efflux";
const TETRACYCLINE_ANTIBIOTIC = "tetracycline antibiotic";
const GLYCOPEPTIDE_ANTIBIOTIC = "glycopeptide antibiotic";
const ANTIBIOTIC_INACTIVATION = "antibiotic inactivation";
const TEM_BETA_LACTAMASE = "TEM beta-lactamase";
const MONOBACTAM_CEPHALOSPORIN_PENAM_PENEM =
  "monobactam; cephalosporin; penam; penem";
const BETA_LACTAM_ANTIBIOTIC = "beta-lactam antibiotic";

const DOWNLOAD_REPORT_TABLE_CSV = "Download Report table (.csv)";
const DOWNLOAD_NON_HOST_READS_FASTA = "Download Non-Host Reads (.fasta)";
const DOWNLOAD_NON_HOST_CONTIGS_FASTA = "Download Non-Host Contigs (.fasta)";
const DOWNLOAD_COMPREHENSIVE_AMR_METRICS_FILE_TSV =
  "Download Comprehensive AMR Metrics File (.tsv)";
const DOWNLOAD_INTERMEDIATE_FILES_ZIP = "Download Intermediate Files (.zip)";

const KEY_MAPPING = {
  gene: "Gene",
  gene_family: "Gene Family",
  drug_class: "Drug Class",
  high_level_drug_class: "High-level Drug Class",
  mechanism: "Mechanism",
  model: "Model",
  cutoff: "Cutoff",
  contigs: "Contigs",
  contig_coverage_breadth: "%Cov",
  contig_percent_id: "%Id",
  contig_species: "Contig SpeciesBETA",
  reads: "Reads",
  rpm: "rPM",
  read_coverage_breadth: "%Cov_13",
  read_coverage_depth: "Cov. Depth",
  dpm: "dPM",
  read_species: "Read SpeciesBETA",
};

const NO_DIFF_FIELDS = [
  "gene",
  "gene_family",
  "drug_class",
  "high_level_drug_class",
  "mechanism",
  "model",
  "read_species",
  "cutoff",
  "contig_species",
];
const OUTPUT_PATH = (outputDir: string, filename: string) =>
  `./fixtures/outputs/${outputDir}/${filename}`;

const RUN_PIPELINE = true;
const WAIT_FOR_PIPELINE = true;
const TEST_TIMEOUT = 60 * 1000 * 40;

let collector: AssertionCollector;

/*
 * AMR E2E
 */
test.describe("AMR E2E | Functional: P-1", () => {
  test.beforeEach(() => {
    collector = new AssertionCollector();
  });

  test.afterEach(() => {
    collector.throwIfAny();
  });

  test("SNo e10: AMR Single Read Sample Report & Data Validation", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.AMR}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p (see ""Data"") as Antimicrobial Resistance, use the configuration:
    const samples = await setupSamples(
      page,
      project,
      // sample fastq: mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_R1.fastq.gz
      // https://drive.google.com/file/d/13wf2ZZKzozGV-taslLDBEYjQtPh_Bc6w/view?usp=drive_link
      [MWGS_SE_SRR7002140_TA_252_DNA_BLAC_VANP_10P],
      [MWGS_SE_SAMPLE],
      WORKFLOWS.AMR,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Human
        hostOrganism: "Human",
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p (see ""Data"") as Antimicrobial Resistance, use the configuration:

    // #region 3. Select ""Antimicrobial"" tab
    let sampleName = "";
    await projectPage.navigateToSamples(project.id, WORKFLOWS.AMR);
    await projectPage.clickAntimicrobialTab();
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Antimicrobial"" tab

    // #region 4. Verify ""genes"" section data
    const samplesPage = await projectPage.clickSample(sampleName);

    // ""mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // AMR hits
    await samplesPage.clickShowHideColumns();
    await samplesPage.clickShowAllColumns();
    await samplesPage.pressEscape();

    const reportTable = await samplesPage.getAntimicrobialResistanceTable();

    // gene,gene_family,drug_class,high_level_drug_class,mechanism,model,cutoff,contigs,contig_coverage_breadth,contig_percent_id,contig_species,reads,rpm,read_coverage_breadth,read_coverage_depth,dpm,read_species
    // RlmA(II),non-erm 23S ribosomal RNA methyltransferase (G748),macrolide antibiotic; lincosamide antibiotic,lincosamide antibiotic; macrolide antibiotic,antibiotic target alteration,protein homolog,,0,,,,1,646.83,14.84,0.15,97.02,
    // mel,msr-type ABC-F protein,macrolide antibiotic; streptogramin antibiotic,macrolide antibiotic; streptogramin antibiotic,antibiotic target protection,protein homolog,,0,,,,1,646.83,10.34,0.1,64.68,
    // patB,ATP-binding cassette (ABC) antibiotic efflux pump,fluoroquinolone antibiotic,fluoroquinolone antibiotic,antibiotic efflux,protein homolog,,0,,,,1,646.83,7.13,0.07,45.28,
    // pmrA,major facilitator superfamily (MFS) antibiotic efflux pump,fluoroquinolone antibiotic,fluoroquinolone antibiotic,antibiotic efflux,protein homolog,,0,,,,1,646.83,5.92,0.06,38.81,Streptococcus pneumoniae (chromosome): 1;
    // tet(M),tetracycline-resistant ribosomal protection protein,tetracycline antibiotic,tetracycline antibiotic,antibiotic target protection,protein homolog,,0,,,,1,646.83,6.56,0.07,45.28,
    // vanP,glycopeptide resistance gene cluster; Van ligase,glycopeptide antibiotic,glycopeptide antibiotic,antibiotic target alteration,protein homolog,,0,,,,1,646.83,12.24,0.12,77.62,
    const expectedReportTable = [
      {
        gene: "RlmA(II)",
        gene_family: "non-erm 23S ribosomal RNA methyltransferase (G748)",
        drug_class: LINCOSAMIDE_ANTIBIOTIC_MACROLIDE_ANTIBIOTIC,
        high_level_drug_class: LINCOSAMIDE_ANTIBIOTIC_MACROLIDE_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_TARGET_ALTERATION,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "1",
        rpm: "646.83",
        read_coverage_breadth: "14.84",
        read_coverage_depth: "0.15",
        dpm: "97.02",
        read_species: "-",
      },
      {
        gene: "mel",
        gene_family: MSR_TYPE_ABC_F_PROTEIN,
        drug_class: MACROLIDE_ANTIBIOTIC_STREPTOGRAMIN_ANTIBIOTIC,
        high_level_drug_class: MACROLIDE_ANTIBIOTIC_STREPTOGRAMIN_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_TARGET_PROTECTION,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "1",
        rpm: "646.83",
        read_coverage_breadth: "10.34",
        read_coverage_depth: "0.1",
        dpm: "64.68",
        read_species: "-",
      },
      {
        gene: "patB",
        gene_family: "ATP-binding cassette (ABC) antibiotic efflux pump",
        drug_class: FLUOROQUINOLONE_ANTIBIOTIC,
        high_level_drug_class: FLUOROQUINOLONE_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_EFFLUX,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "1",
        rpm: "646.83",
        read_coverage_breadth: "7.13",
        read_coverage_depth: "0.07",
        dpm: "45.28",
        read_species: "-",
      },
      {
        gene: "pmrA",
        gene_family:
          "major facilitator superfamily (MFS) antibiotic efflux pump",
        drug_class: FLUOROQUINOLONE_ANTIBIOTIC,
        high_level_drug_class: FLUOROQUINOLONE_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_EFFLUX,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "1",
        rpm: "646.83",
        read_coverage_breadth: "5.92",
        read_coverage_depth: "0.06",
        dpm: "38.81",
        read_species: "Streptococcus pneumoniae (chromosome): 1",
      },
      {
        gene: "tet(M)",
        gene_family: "tetracycline-resistant ribosomal protection protein",
        drug_class: TETRACYCLINE_ANTIBIOTIC,
        high_level_drug_class: TETRACYCLINE_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_TARGET_PROTECTION,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "1",
        rpm: "646.83",
        read_coverage_breadth: "6.56",
        read_coverage_depth: "0.07",
        dpm: "45.28",
        read_species: "-",
      },
      {
        gene: "vanP",
        gene_family: "Van ligase; glycopeptide resistance gene cluster",
        drug_class: GLYCOPEPTIDE_ANTIBIOTIC,
        high_level_drug_class: GLYCOPEPTIDE_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_TARGET_ALTERATION,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "1",
        rpm: "646.83",
        read_coverage_breadth: "12.24",
        read_coverage_depth: "0.12",
        dpm: "77.62",
        read_species: "-",
      },
    ];
    await verifyAMRReportTable(reportTable, expectedReportTable);
    // #endregion 4. Verify ""genes"" section data

    // #region 5. From the sample report, click on the Download button for:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_report.csv"
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
    // - mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_7529_non_host_reads.fasta
    collector.collect(
      async () =>
        expect(nonHostReadsFasta.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*non_host_reads.fasta`),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Non-Host Contigs (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostContigsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    // - mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_7529_contigs.fasta
    collector.collect(
      async () =>
        expect(nonHostContigsFasta.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*contigs.fasta`),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    downloadedContent.push(nonHostContigsFasta);

    // - Comprehensive AMR Metrics File (.tsv)
    await samplesPage.clickDownloadButton();
    const comprehensiveAmrMetricsTsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_COMPREHENSIVE_AMR_METRICS_FILE_TSV,
    );
    // - mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_7529_comprehensive_amr_metrics.tsv
    collector.collect(
      async () =>
        expect(comprehensiveAmrMetricsTsv.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*comprehensive_amr_metrics.tsv`),
        ),
      DOWNLOAD_COMPREHENSIVE_AMR_METRICS_FILE_TSV,
    );
    downloadedContent.push(comprehensiveAmrMetricsTsv);

    // - Intermediate Files (.zip)
    await samplesPage.clickDownloadButton();
    const outputsZip = await samplesPage.clickDownloadOption(
      DOWNLOAD_INTERMEDIATE_FILES_ZIP,
    );
    // - mWGS_SE_SRR7002140_TA.252.DNA_blaC_vanP_10p_7529_outputs.zip
    collector.collect(
      async () =>
        expect(outputsZip.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*outputs.zip`),
        ),
      DOWNLOAD_INTERMEDIATE_FILES_ZIP,
    );
    downloadedContent.push(outputsZip);
    // #endregion 5. From the sample report, click on the Download button for:

    // #region 6. Verify the specified data file outputs against baseline outputs

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):
    // The following files from the downloads folder should match those of the baseline run:
    // Outputs: Output AMR
    // https://drive.google.com/drive/folders/1vZxC7A-y69Oi0j7M-3wRZCoLTWLlML0L?usp=drive_link
    await compareDataFilesWithTolerance(
      downloadedContent,
      "AMR/mWGS_SE_SRR7002140_TA/e10",
      sampleName,
      MWGS_SE_SAMPLE,
    );
    // #endregion 6. Verify the specified data file outputs against baseline outputs
  });

  test("SNo e11: AMR Paired Read Sample Report & Download Data Validation", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.AMR}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p (see ""Data"") as Antimicrobial Resistance, use the configuration:
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
      WORKFLOWS.AMR,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Human
        hostOrganism: "Human",
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );

    // #endregion 2. Upload sample fastq files for mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p (see ""Data"") as Antimicrobial Resistance, use the configuration:

    // #region 3. Select ""Antimicrobial"" tab
    let sampleName = "";
    await projectPage.navigateToSamples(project.id, WORKFLOWS.AMR);
    await projectPage.clickAntimicrobialTab();
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Antimicrobial"" tab

    // #region 4. Verify ""genes"" section data
    const samplesPage = await projectPage.clickSample(sampleName);

    // ""mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // AMR hits
    await samplesPage.clickShowHideColumns();
    await samplesPage.clickShowAllColumns();
    await samplesPage.pressEscape();

    const reportTable = await samplesPage.getAntimicrobialResistanceTable();

    // gene,gene_family,drug_class,high_level_drug_class,mechanism,model,cutoff,contigs,contig_coverage_breadth,contig_percent_id,contig_species,reads,rpm,read_coverage_breadth,read_coverage_depth,dpm,read_species
    // RlmA(II),non-erm 23S ribosomal RNA methyltransferase (G748),macrolide antibiotic; lincosamide antibiotic,lincosamide antibiotic; macrolide antibiotic,antibiotic target alteration,protein homolog,,0,,,,2,646.83,29.09,0.29,93.79,
    // mel,msr-type ABC-F protein,macrolide antibiotic; streptogramin antibiotic,macrolide antibiotic; streptogramin antibiotic,antibiotic target protection,protein homolog,,0,,,,2,646.83,11.74,0.21,67.92,
    // patB,ATP-binding cassette (ABC) antibiotic efflux pump,fluoroquinolone antibiotic,fluoroquinolone antibiotic,antibiotic efflux,protein homolog,,0,,,,2,646.83,14.26,0.14,45.28,
    // pmrA,major facilitator superfamily (MFS) antibiotic efflux pump,fluoroquinolone antibiotic,fluoroquinolone antibiotic,antibiotic efflux,protein homolog,,0,,,,3,970.25,26.25,0.27,87.32,Streptococcus pneumoniae (chromosome): 1;
    // tet(M),tetracycline-resistant ribosomal protection protein,tetracycline antibiotic,tetracycline antibiotic,antibiotic target protection,protein homolog,,0,,,,2,646.83,8.28,0.13,42.04,
    // vanP,glycopeptide resistance gene cluster; Van ligase,glycopeptide antibiotic,glycopeptide antibiotic,antibiotic target alteration,protein homolog,,0,,,,2,646.83,24.49,0.24,77.62,
    const expectedReportTable = [
      {
        gene: "RlmA(II)",
        gene_family: "non-erm 23S ribosomal RNA methyltransferase (G748)",
        drug_class: "macrolide antibiotic; lincosamide antibiotic",
        high_level_drug_class: LINCOSAMIDE_ANTIBIOTIC_MACROLIDE_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_TARGET_ALTERATION,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "2",
        rpm: "646.83",
        read_coverage_breadth: "29.09",
        read_coverage_depth: "0.29",
        dpm: "93.79",
        read_species: "-",
      },
      {
        gene: "mel",
        gene_family: MSR_TYPE_ABC_F_PROTEIN,
        drug_class: MACROLIDE_ANTIBIOTIC_STREPTOGRAMIN_ANTIBIOTIC,
        high_level_drug_class: MACROLIDE_ANTIBIOTIC_STREPTOGRAMIN_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_TARGET_PROTECTION,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "2",
        rpm: "646.83",
        read_coverage_breadth: "11.74",
        read_coverage_depth: "0.21",
        dpm: "67.92",
        read_species: "-",
      },
      {
        gene: "patB",
        gene_family: "ATP-binding cassette (ABC) antibiotic efflux pump",
        drug_class: FLUOROQUINOLONE_ANTIBIOTIC,
        high_level_drug_class: FLUOROQUINOLONE_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_EFFLUX,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "2",
        rpm: "646.83",
        read_coverage_breadth: "14.26",
        read_coverage_depth: "0.14",
        dpm: "45.28",
        read_species: "-",
      },
      {
        gene: "pmrA",
        gene_family:
          "major facilitator superfamily (MFS) antibiotic efflux pump",
        drug_class: FLUOROQUINOLONE_ANTIBIOTIC,
        high_level_drug_class: FLUOROQUINOLONE_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_EFFLUX,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "3",
        rpm: "970.25",
        read_coverage_breadth: "26.25",
        read_coverage_depth: "0.27",
        dpm: "87.32",
        read_species: "Streptococcus pneumoniae (chromosome): 1;",
      },
      {
        gene: "tet(M)",
        gene_family: "tetracycline-resistant ribosomal protection protein",
        drug_class: TETRACYCLINE_ANTIBIOTIC,
        high_level_drug_class: TETRACYCLINE_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_TARGET_PROTECTION,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "2",
        rpm: "646.83",
        read_coverage_breadth: "8.28",
        read_coverage_depth: "0.13",
        dpm: "42.04",
        read_species: "-",
      },
      {
        gene: "vanP",
        gene_family: "glycopeptide resistance gene cluster; Van ligase",
        drug_class: GLYCOPEPTIDE_ANTIBIOTIC,
        high_level_drug_class: GLYCOPEPTIDE_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_TARGET_ALTERATION,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "2",
        rpm: "646.83",
        read_coverage_breadth: "24.49",
        read_coverage_depth: "0.24",
        dpm: "77.62",
        read_species: "-",
      },
    ];
    await verifyAMRReportTable(reportTable, expectedReportTable);
    // #endregion 4. Verify ""genes"" section data

    // #region 5. From the sample report, click on the Download button for:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );

    // - mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_report.csv"
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

    // - mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_7528_non_host_reads.fasta
    collector.collect(
      async () =>
        expect(nonHostReadsFasta.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*non_host_reads.fasta`),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Non-Host Contigs (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostContigsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );

    // - mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_7528_contigs.fasta
    collector.collect(
      async () =>
        expect(nonHostContigsFasta.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*contigs.fasta`),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    downloadedContent.push(nonHostContigsFasta);

    // - Comprehensive AMR Metrics File (.tsv)
    await samplesPage.clickDownloadButton();
    const comprehensiveAmrMetricsTsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_COMPREHENSIVE_AMR_METRICS_FILE_TSV,
    );

    // - mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_7528_comprehensive_amr_metrics.tsv
    collector.collect(
      async () =>
        expect(comprehensiveAmrMetricsTsv.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*comprehensive_amr_metrics.tsv`),
        ),
      DOWNLOAD_COMPREHENSIVE_AMR_METRICS_FILE_TSV,
    );
    downloadedContent.push(comprehensiveAmrMetricsTsv);

    // - Intermediate Files (.zip)
    await samplesPage.clickDownloadButton();
    const outputsZip = await samplesPage.clickDownloadOption(
      DOWNLOAD_INTERMEDIATE_FILES_ZIP,
    );

    // - mWGS_PE_SRR7002140_TA.252.DNA_blaC_vanP_10p_7528_outputs.zip
    collector.collect(
      async () =>
        expect(outputsZip.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*outputs.zip`),
        ),
      DOWNLOAD_INTERMEDIATE_FILES_ZIP,
    );
    downloadedContent.push(outputsZip);

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):

    // The following files from the downloads folder should match those of the baseline run:
    // 2021
    // Outputs: Output AMR
    // https://drive.google.com/drive/folders/13rtxmrK0wB9o7tpD28yuK4C56AmloG2o?usp=drive_link
    await compareDataFilesWithTolerance(
      downloadedContent,
      "AMR/mWGS_PE_SRR7002140_TA/e11",
      sampleName,
      MWGS_PE_SRR7002140_TAP,
    );
    // #endregion 5. From the sample report, click on the Download button for:
  });

  test("SNo e12: AMR Paired Read RNA Mosquito Sample Report & Download Data Validation", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.AMR}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for mWGS_RNA_mosquito-1-aedes-rna_10p (see ""Data"") as Antimicrobial Resistance, use the configuration:
    const MWGS_RNA_MOSQUITO = "mWGS_RNA_mosquito-1-aedes-rna_10p";
    const samples = await setupSamples(
      page,
      project,
      // "sample fastq:
      // mWGS_RNA_mosquito-1-aedes-rna_10p_R1.fastq.gz
      // https://drive.google.com/file/d/1cknRbz6wGYwoYDFhH9GO8IfBcDQBBMM9/view?usp=drive_link
      // mWGS_RNA_mosquito-1-aedes-rna_10p_R2.fastq.gz"
      // https://drive.google.com/file/d/1kwdYlFtuPZK8uPfPflayVOuwpUrL-lO8/view?usp=drive_link
      [
        MWGS_RNA_MOSQUITO_1_AEDES_RNA_10p_R1,
        MWGS_RNA_MOSQUITO_1_AEDES_RNA_10p_R2,
      ],
      [MWGS_RNA_MOSQUITO],
      WORKFLOWS.AMR,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Mosquito
        hostOrganism: "Mosquito",
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion 2. Upload sample fastq files for mWGS_RNA_mosquito-1-aedes-rna_10p (see ""Data"") as Antimicrobial Resistance, use the configuration:

    // #region 3. Select ""Antimicrobial"" tab
    let sampleName = "";
    await projectPage.navigateToSamples(project.id, WORKFLOWS.AMR);
    await projectPage.clickAntimicrobialTab();
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Antimicrobial"" tab

    // #region 4. Verify ""genes"" section data
    const samplesPage = await projectPage.clickSample(sampleName);

    // ""mWGS_RNA_mosquito-1-aedes-rna_10p"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // AMR hits
    await samplesPage.clickShowHideColumns();
    await samplesPage.clickShowAllColumns();
    await samplesPage.pressEscape();

    const reportTable = await samplesPage.getAntimicrobialResistanceTable();

    // gene,gene_family,drug_class,high_level_drug_class,mechanism,model,cutoff,contigs,contig_coverage_breadth,contig_percent_id,contig_species,reads,rpm,read_coverage_breadth,read_coverage_depth,dpm,read_species
    // Erm(37),Erm 23S ribosomal RNA methyltransferase,macrolide antibiotic; lincosamide antibiotic; streptogramin antibiotic; streptogramin A antibiotic; streptogramin B antibiotic,macrolide antibiotic; lincosamide antibiotic; streptogramin antibiotic,antibiotic target alteration,protein homolog,Nudged,1,3.3333,100.0,,,0.0,,,0.0,
    // MexD,resistance-nodulation-cell division (RND) antibiotic efflux pump,macrolide antibiotic; fluoroquinolone antibiotic; aminoglycoside antibiotic; cephalosporin; penam; tetracycline antibiotic; aminocoumarin antibiotic; diaminopyrimidine antibiotic; phenicol antibiotic,macrolide antibiotic; aminocoumarin antibiotic; tetracycline antibiotic; beta-lactam antibiotic; phenicol antibiotic; fluoroquinolone antibiotic; diaminopyrimidine antibiotic; aminoglycoside antibiotic,antibiotic efflux,protein homolog,Nudged,1,0.6705,100.0,,,0.0,,,0.0,
    // Staphylococcus aureus mupB conferring resistance to mupirocin,antibiotic-resistant isoleucyl-tRNA synthetase (ileS),mupirocin-like antibiotic,mupirocin-like antibiotic,antibiotic target alteration,protein homolog,Nudged,1,0.677,100.0,,,0.0,,,0.0,
    // arr-2,rifampin ADP-ribosyltransferase (Arr),rifamycin antibiotic,rifamycin antibiotic,antibiotic inactivation,protein homolog,Nudged,1,3.9735,100.0,,,0.0,,,0.0,
    // catQ,chloramphenicol acetyltransferase (CAT),phenicol antibiotic,phenicol antibiotic,antibiotic inactivation,protein homolog,Nudged,1,3.6364,100.0,,,0.0,,,0.0,
    // dfrA23,trimethoprim resistant dihydrofolate reductase dfr,diaminopyrimidine antibiotic,diaminopyrimidine antibiotic,antibiotic target replacement,protein homolog,Nudged,1,3.2086,100.0,,,0.0,,,0.0,
    // msrA,msr-type ABC-F protein,macrolide antibiotic; streptogramin antibiotic; streptogramin B antibiotic,macrolide antibiotic; streptogramin antibiotic,antibiotic target protection,protein homolog,Nudged,1,1.4315,100.0,,,0.0,,,0.0,
    const expectedReportTable = [
      {
        gene: "Erm(37)",
        gene_family: "Erm 23S ribosomal RNA methyltransferase",
        drug_class:
          "macrolide antibiotic; lincosamide antibiotic; streptogramin antibiotic; streptogramin A antibiotic; streptogramin B antibiotic",
        high_level_drug_class:
          "macrolide antibiotic; lincosamide antibiotic; streptogramin antibiotic",
        mechanism: ANTIBIOTIC_TARGET_ALTERATION,
        model: PROTEIN_HOMOLOG,
        cutoff: "Nudged",
        contigs: "1",
        contig_coverage_breadth: "3.3333",
        contig_percent_id: "100.0",
        contig_species: "-",
        reads: "-",
        rpm: "0.0",
        read_coverage_breadth: "-",
        read_coverage_depth: "-",
        dpm: "0.0",
        read_species: "-",
      },
      {
        gene: "MexD",
        gene_family:
          "resistance-nodulation-cell division (RND) antibiotic efflux pump",
        drug_class:
          "macrolide antibiotic; fluoroquinolone antibiotic; aminoglycoside antibiotic; cephalosporin; penam; tetracycline antibiotic; aminocoumarin antibiotic; diaminopyrimidine antibiotic; phenicol antibiotic",
        high_level_drug_class:
          "macrolide antibiotic; aminocoumarin antibiotic; tetracycline antibiotic; beta-lactam antibiotic; phenicol antibiotic; fluoroquinolone antibiotic; diaminopyrimidine antibiotic; aminoglycoside antibiotic",
        mechanism: "antibiotic efflux",
        model: PROTEIN_HOMOLOG,
        cutoff: "Nudged",
        contigs: "1",
        contig_coverage_breadth: "0.6705",
        contig_percent_id: "100.0",
        contig_species: "-",
        reads: "-",
        rpm: "0.0",
        read_coverage_breadth: "-",
        read_coverage_depth: "-",
        dpm: "0.0",
        read_species: "-",
      },
      {
        gene: "arr-2",
        gene_family: "rifampin ADP-ribosyltransferase (Arr)",
        drug_class: "rifamycin antibiotic",
        high_level_drug_class: "rifamycin antibiotic",
        mechanism: ANTIBIOTIC_INACTIVATION,
        model: PROTEIN_HOMOLOG,
        cutoff: "Nudged",
        contigs: "1",
        contig_coverage_breadth: "3.9735",
        contig_percent_id: "100.0",
        contig_species: "-",
        reads: "-",
        rpm: "0.0",
        read_coverage_breadth: "-",
        read_coverage_depth: "-",
        dpm: "0.0",
        read_species: "-",
      },
      {
        gene: "catQ",
        gene_family: "chloramphenicol acetyltransferase (CAT)",
        drug_class: "phenicol antibiotic",
        high_level_drug_class: "phenicol antibiotic",
        mechanism: ANTIBIOTIC_INACTIVATION,
        model: PROTEIN_HOMOLOG,
        cutoff: "Nudged",
        contigs: "1",
        contig_coverage_breadth: "3.6364",
        contig_percent_id: "100.0",
        contig_species: "-",
        reads: "-",
        rpm: "0.0",
        read_coverage_breadth: "-",
        read_coverage_depth: "-",
        dpm: "0.0",
        read_species: "-",
      },
      {
        gene: "dfrA23",
        gene_family: "trimethoprim resistant dihydrofolate reductase dfr",
        drug_class: "diaminopyrimidine antibiotic",
        high_level_drug_class: "diaminopyrimidine antibiotic",
        mechanism: "antibiotic target replacement",
        model: PROTEIN_HOMOLOG,
        cutoff: "Nudged",
        contigs: "1",
        contig_coverage_breadth: "3.2086",
        contig_percent_id: "100.0",
        contig_species: "-",
        reads: "-",
        rpm: "0.0",
        read_coverage_breadth: "-",
        read_coverage_depth: "-",
        dpm: "0.0",
        read_species: "-",
      },
      {
        gene: "msrA",
        gene_family: "msr-type ABC-F protein",
        drug_class:
          "macrolide antibiotic; streptogramin antibiotic; streptogramin B antibiotic",
        high_level_drug_class: "macrolide antibiotic; streptogramin antibiotic",
        mechanism: "antibiotic target protection",
        model: PROTEIN_HOMOLOG,
        cutoff: "Nudged",
        contigs: "1",
        contig_coverage_breadth: "1.4315",
        contig_percent_id: "100.0",
        contig_species: "-",
        reads: "-",
        rpm: "0.0",
        read_coverage_breadth: "-",
        read_coverage_depth: "-",
        dpm: "0.0",
        read_species: "-",
      },
      {
        gene: "Staphylococcus aureus mupB conferring resistance to mupirocin",
        gene_family: "antibiotic-resistant isoleucyl-tRNA synthetase (ileS)",
        drug_class: "mupirocin-like antibiotic",
        high_level_drug_class: "mupirocin-like antibiotic",
        mechanism: ANTIBIOTIC_TARGET_ALTERATION,
        model: PROTEIN_HOMOLOG,
        cutoff: "Nudged",
        contigs: "1",
        contig_coverage_breadth: "0.677",
        contig_percent_id: "100.0",
        contig_species: "-",
        reads: "-",
        rpm: "0.0",
        read_coverage_breadth: "-",
        read_coverage_depth: "-",
        dpm: "0.0",
        read_species: "-",
      },
    ];
    await verifyAMRReportTable(reportTable, expectedReportTable);
    // #endregion 4. Verify ""genes"" section data

    // #region 5. From the sample report, click on the Download button for:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_report.csv"
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
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_7530_non_host_reads.fasta
    collector.collect(
      async () =>
        expect(nonHostReadsFasta.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*non_host_reads.fasta`),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Non-Host Contigs (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostContigsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_7530_contigs.fasta
    collector.collect(
      async () =>
        expect(nonHostContigsFasta.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*contigs.fasta`),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    downloadedContent.push(nonHostContigsFasta);

    // - Comprehensive AMR Metrics File (.tsv)
    await samplesPage.clickDownloadButton();
    const comprehensiveAmrMetricsTsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_COMPREHENSIVE_AMR_METRICS_FILE_TSV,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_7530_comprehensive_amr_metrics.tsv
    collector.collect(
      async () =>
        expect(comprehensiveAmrMetricsTsv.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*comprehensive_amr_metrics.tsv`),
        ),
      DOWNLOAD_COMPREHENSIVE_AMR_METRICS_FILE_TSV,
    );
    downloadedContent.push(comprehensiveAmrMetricsTsv);

    // - Intermediate Files (.zip)"
    await samplesPage.clickDownloadButton();
    const outputsZip = await samplesPage.clickDownloadOption(
      DOWNLOAD_INTERMEDIATE_FILES_ZIP,
    );
    // - mWGS_RNA_mosquito-1-aedes-rna_10p_7530_outputs.zip
    collector.collect(
      async () =>
        expect(outputsZip.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*outputs.zip`),
        ),
      DOWNLOAD_INTERMEDIATE_FILES_ZIP,
    );
    downloadedContent.push(outputsZip);

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):
    // The following files from the downloads folder should match those of the baseline run:
    // 2021
    // Outputs: Output AMR
    // https://drive.google.com/drive/folders/1ub63WaGCKq9owsJmUaTkSG-ipP7VmCF4?usp=drive_link
    await compareDataFilesWithTolerance(
      downloadedContent,
      "AMR/MWGS_RNA_MOSQUITO/e12",
      sampleName,
      MWGS_RNA_MOSQUITO,
    );
    // #endregion 5. From the sample report, click on the Download button for:
  });

  test("SNo e13: AMR Paired Read RNA Human Sample Report & Download Data Validation", async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for mWGS_RNA_human-128-lung-rna_10p_contigs (see ""Data"") as Antimicrobial Resistance, use the configuration:
    const MWGS_RNA_HUMAN = "mWGS_RNA_human-128-lung-rna_10p";
    const samples = await setupSamples(
      page,
      project,
      // "sample fastq:
      // mWGS_RNA_human-128-lung-rna_10p_R1.fastq.gz
      // https://drive.google.com/file/d/1QOwyK6rDitgjIjohj6KWXS5CRsZrLaSE/view?usp=drive_link
      // mWGS_RNA_human-128-lung-rna_10p_R2.fastq.gz"
      // https://drive.google.com/file/d/1LwqDvXqb09H59pD-hy_NZk4pPWtznlo9/view?usp=drive_link
      [MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R1, MWGS_RNA_HUMAN_128_LUNG_RNA_10p_R2],
      [MWGS_RNA_HUMAN],
      WORKFLOWS.AMR,
      {
        runPipeline: RUN_PIPELINE,
        // - Host=Human
        hostOrganism: "Human",
        // and allow the pipeline to complete
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );

    // #endregion 2. Upload sample fastq files for mWGS_RNA_human-128-lung-rna_10p_contigs (see ""Data"") as Antimicrobial Resistance, use the configuration:

    // #region 3. Select ""Antimicrobial"" tab
    let sampleName = "";
    await projectPage.navigateToSamples(project.id, WORKFLOWS.AMR);
    await projectPage.clickAntimicrobialTab();
    if (WAIT_FOR_PIPELINE) {
      const uploadedSample = samples[0];
      sampleName = uploadedSample.name;
    } else {
      sampleName = (await projectPage.selectCompletedSamples(1))[0];
    }
    // #endregion 3. Select ""Antimicrobial"" tab

    // #region 4. Verify ""genes"" section data
    const samplesPage = await projectPage.clickSample(sampleName);

    // ""mWGS_RNA_human-128-lung-rna_10p_contigs"" DATA
    const actualSampleName = await samplesPage.getSampleName();
    collector.collect(
      async () => expect(actualSampleName).toEqual(sampleName),
      SAMPLE_REPORT_SAMPLE_NAME,
    );

    // AMR hits
    await samplesPage.clickShowHideColumns();
    await samplesPage.clickShowAllColumns();
    await samplesPage.pressEscape();

    const reportTable = await samplesPage.getAntimicrobialResistanceTable();

    // gene,gene_family,drug_class,high_level_drug_class,mechanism,model,cutoff,contigs,contig_coverage_breadth,contig_percent_id,contig_species,reads,rpm,read_coverage_breadth,read_coverage_depth,dpm,read_species
    // TEM-116,TEM beta-lactamase,monobactam; cephalosporin; penam; penem,beta-lactam antibiotic,antibiotic inactivation,protein homolog,,0,,,,50.0,143.17,81.65,5.72,16.38,Escherichia coli (chromosome or plasmid): 7; Escherichia coli (plasmid): 3;
    // TEM-194,TEM beta-lactamase,monobactam; cephalosporin; penam; penem,beta-lactam antibiotic,antibiotic inactivation,protein homolog,Nudged,1,8.3624,100.0,Unknown taxonomy (chromosome or plasmid),,0.0,,,0.0,
    // TEM-229,TEM beta-lactamase,monobactam; cephalosporin; penam; penem,beta-lactam antibiotic,antibiotic inactivation,protein homolog,Nudged,1,72.4739,100.0,Unknown taxonomy (chromosome or plasmid),,0.0,,,0.0,
    const expectedReportTable = [
      {
        gene: "TEM-116",
        gene_family: TEM_BETA_LACTAMASE,
        drug_class: MONOBACTAM_CEPHALOSPORIN_PENAM_PENEM,
        high_level_drug_class: BETA_LACTAM_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_INACTIVATION,
        model: PROTEIN_HOMOLOG,
        cutoff: "-",
        contigs: "0",
        contig_coverage_breadth: "-",
        contig_percent_id: "-",
        contig_species: "-",
        reads: "50.0",
        rpm: "143.17",
        read_coverage_breadth: "81.65",
        read_coverage_depth: "5.72",
        dpm: "16.38",
        read_species:
          "Escherichia coli (chromosome or plasmid): 7; Escherichia coli (plasmid): 3;",
      },
      {
        gene: "TEM-194",
        gene_family: TEM_BETA_LACTAMASE,
        drug_class: MONOBACTAM_CEPHALOSPORIN_PENAM_PENEM,
        high_level_drug_class: BETA_LACTAM_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_INACTIVATION,
        model: PROTEIN_HOMOLOG,
        cutoff: "Nudged",
        contigs: "1",
        contig_coverage_breadth: "8.3624",
        contig_percent_id: "100.0",
        contig_species: "Unknown taxonomy (chromosome or plasmid)",
        reads: "-",
        rpm: "0.0",
        read_coverage_breadth: "-",
        read_coverage_depth: "-",
        dpm: "0.0",
        read_species: "-",
      },
      {
        gene: "TEM-229",
        gene_family: TEM_BETA_LACTAMASE,
        drug_class: MONOBACTAM_CEPHALOSPORIN_PENAM_PENEM,
        high_level_drug_class: BETA_LACTAM_ANTIBIOTIC,
        mechanism: ANTIBIOTIC_INACTIVATION,
        model: PROTEIN_HOMOLOG,
        cutoff: "Nudged",
        contigs: "1",
        contig_coverage_breadth: "72.4739",
        contig_percent_id: "100.0",
        contig_species: "Unknown taxonomy (chromosome or plasmid)",
        reads: "-",
        rpm: "0.0",
        read_coverage_breadth: "-",
        read_coverage_depth: "-",
        dpm: "0.0",
        read_species: "-",
      },
    ];
    await samplesPage.pause(60);
    await verifyAMRReportTable(reportTable, expectedReportTable);
    // #endregion 4. Verify ""genes"" section data

    // #region 5. From the sample report, click on the Download button for:
    const downloadedContent = [];

    // - Report table (.csv)
    await samplesPage.clickDownloadButton();
    const reportTableCsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_REPORT_TABLE_CSV,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_report.csv"
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
    // - mWGS_RNA_human-128-lung-rna_10p_7531_non_host_reads.fasta
    collector.collect(
      async () =>
        expect(nonHostReadsFasta.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*non_host_reads.fasta`),
        ),
      DOWNLOAD_NON_HOST_READS_FASTA,
    );
    downloadedContent.push(nonHostReadsFasta);

    // - Non-Host Contigs (.fasta)
    await samplesPage.clickDownloadButton();
    const nonHostContigsFasta = await samplesPage.clickDownloadOption(
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_7531_contigs.fasta
    collector.collect(
      async () =>
        expect(nonHostContigsFasta.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*contigs.fasta`),
        ),
      DOWNLOAD_NON_HOST_CONTIGS_FASTA,
    );
    downloadedContent.push(nonHostContigsFasta);

    // - Comprehensive AMR Metrics File (.tsv)
    await samplesPage.clickDownloadButton();
    const comprehensiveAmrMetricsTsv = await samplesPage.clickDownloadOption(
      DOWNLOAD_COMPREHENSIVE_AMR_METRICS_FILE_TSV,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_7531_comprehensive_amr_metrics.tsv
    collector.collect(
      async () =>
        expect(comprehensiveAmrMetricsTsv.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*comprehensive_amr_metrics.tsv`),
        ),
      DOWNLOAD_COMPREHENSIVE_AMR_METRICS_FILE_TSV,
    );
    downloadedContent.push(comprehensiveAmrMetricsTsv);

    // - Intermediate Files (.zip)"
    await samplesPage.clickDownloadButton();
    const outputsZip = await samplesPage.clickDownloadOption(
      DOWNLOAD_INTERMEDIATE_FILES_ZIP,
    );
    // - mWGS_RNA_human-128-lung-rna_10p_7531_outputs.zip
    collector.collect(
      async () =>
        expect(outputsZip.suggestedFilename()).toMatch(
          new RegExp(`${sampleName}_[\\d_]*outputs.zip`),
        ),
      DOWNLOAD_INTERMEDIATE_FILES_ZIP,
    );
    downloadedContent.push(outputsZip);

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):

    // The following files from the downloads folder should match those of the baseline run:

    // 2021
    // Outputs: Output AMR
    // https://drive.google.com/drive/folders/1XBLDjWdFZezq7VDyerbErRgfqWnF1b65?usp=drive_link
    await compareDataFilesWithTolerance(
      downloadedContent,
      "AMR/MWGS_RNA_HUMAN/e13",
      sampleName,
      MWGS_RNA_HUMAN,
    );
    // #endregion 5. From the sample report, click on the Download button for:
  });
});

// #region Helpers
async function verifyAMRReportTable(
  reportTable: any,
  expectedReportTable: any,
) {
  for (const i in reportTable) {
    const expectedRow = expectedReportTable[i];
    const actualRow = reportTable[i];
    for (const key of Object.keys(expectedRow)) {
      const actualValue = actualRow[KEY_MAPPING[key]];
      const expectedValue = expectedRow[key];
      const errorMsg = `Sample Report - ${key} Row ${i}`;
      if (await expectedValue.includes(";")) {
        const expectedArray = (await parseCSVArray(expectedValue)).sort();
        const actualArray = (await parseCSVArray(actualValue)).sort();
        for (const index in expectedArray) {
          collector.collect(
            async () =>
              expect(actualArray[index]).toEqual(expectedArray[index]),
            errorMsg + ` index ${index}`,
          );
        }
      } else if (NO_DIFF_FIELDS.includes(key) || expectedValue === "-") {
        collector.collect(
          async () => expect(actualValue).toEqual(expectedValue),
          errorMsg,
        );
      } else {
        await verifyUpperAndLowerBounds(
          parseFloat(actualValue),
          parseFloat(expectedValue),
          errorMsg + key,
          collector,
        );
      }
    }
  }
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
      continue; // Skip. Diff on large files will timeout in saucelabs
    }
    if (contentName.startsWith(sampleName)) {
      // This name is dynamic
      const regex = new RegExp(`${baselineName}_[\\d_]*`);
      contentName = contentName.replace(regex, `${baselineName}_`);
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
      await compareCSV(
        contentName,
        actualOutputData,
        expectedBaselineData,
        collector,
      );
    } else {
      collector.collect(
        async () => expect(actualDiff).toBeLessThanOrEqual(expectedMaxDiff),
        `${contentName} overall diff`,
      );
    }
  }
}

// #endregion Helpers
