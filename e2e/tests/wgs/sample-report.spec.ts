import * as fs from "fs/promises";
import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import { SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2 } from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage, SARS_COV2_REF_FILENAME, SARS_COV2_TRIM_PRIMER_FILENAME } from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import AdmZip = require("adm-zip");
import { ProjectPage } from "../../page-objects/project-page";

let project = null;
let projectPage = null;

// #region Expected data
const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const OUTPUT_PATH = (filename: string) => `./fixtures/outputs/${filename}`;
// #endregion Expected data


/*
 * WGS - Sample report
 */
test.describe("Data Validation: P-1", () => {

  test("SNo e1: Data report validation example", async ({ page }) => {
    const WAIT_TIME = 60 * 1000 * 40;
    test.setTimeout(WAIT_TIME);

    // #region 1. Login to CZ ID staging
    projectPage = new ProjectPage(page);
    project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.WGS}`);
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for wgs_SARS_CoV2_no_host (see "Data") as a Viral Consensus Genome, use the configuration:
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.selectProject(project.name);

    // https://drive.google.com/file/d/1U-r_B4bioVGdXGTojzYgPaz-LFpNEpKY/view
    // https://drive.google.com/file/d/1ethRpFJ1DPrUhbQ66V9ZaK8ao_gy4gqt/view
    await uploadPage.uploadSampleFiles(WGS_SAMPLE_FILES);

    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.WGS);

    // - reference=wgs_SARS_CoV2_reference.fa
    await uploadPage.uploadRefSequence(SARS_COV2_REF_FILENAME); // https://drive.google.com/file/d/1gGSZRuFV0s5s1J0eBsu2zYcM6WaM2rbV/view

    // - primer regions=wgs_SARS_CoV2_primers_regions.bed
    await uploadPage.uploadTrimPrimer(SARS_COV2_TRIM_PRIMER_FILENAME); // https://drive.google.com/file/d/1YY2AUJraiYA7v13hGFrPIQRoKdwVzZ2d/view

    // - Taxonomy=Unkonwn
    await uploadPage.setUploadTaxonFilter("Unknown");

    await uploadPage.clickContinue();

    // - Host=Human
    const sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(WGS_SAMPLE_FILES, sampleNames);
    for (const sampleName of sampleNames) {
      inputs[sampleName].hostOrganism = "Human";
    }

    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();

    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForUploadComplete();

    // and allow the pipeline to complete
    const samplePage = new SamplesPage(page);
    samplePage.waitForAllReportsComplete(project.name, sampleNames);
    // #endregion 2. Upload sample fastq files for wgs_SARS_CoV2_no_host (see "Data") as a Viral Consensus Genome, use the configuration:

    // #region 3. Select "Consensus Genomes" tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    await projectPage.waitForSamplesComplete(project.id, WORKFLOWS.WGS, sampleNames, WAIT_TIME);
    // #endregion 3. Select "Consensus Genomes" tab

    // #region 4. Verify "Is my consensus genome complete?" and "How good is the coverage?" section data
    await projectPage.clickSample(sampleNames[0]);
    await samplePage.clickConsensusGenomeTab();

    // ""wgs_SARS_CoV2_no_host"" DATA
    // ""Is my consensus genome complete?"" data is consistent with below values:
    // - Taxon = EMPTY
    // - Mapped Reads = 108003
    // - GC Content = 37.9%
    // - SNPs = 0
    // - %id = 100%
    // - Informative Nucleotides = 29672
    // - %Genome Called = 99.6%
    // - Missing Bases = 94
    // - Ambiguous Bases = 1
    const expectedData = [
      {
        "Taxon": "",
        "Mapped Reads": "108023",
        "GC Content": "37.9%",
        "SNPs": "0",
        "%id": "100%",
        "Informative Nucleotides": "29639",
        "% Genome Called": "99.5%",
        "Missing Bases": "127",
        "Ambiguous Bases": "1",
      },
    ];
    const consensusGenomeTable = await samplePage.getIsMyConsensusGenomeCompleteTable();
    expect(consensusGenomeTable).toEqual(expectedData);

    // ""How good is the coverage?"" data is consistent with below values:
    // - Reference Length = 29790
    const expectedReferenceLength = "29790";
    const actualReferenceLength = await samplePage.getReferenceLength();
    expect(actualReferenceLength).toEqual(expectedReferenceLength);

    // - Coverage Depth = 420.5x
    const expectedCoverageDept = "420.4x";
    const actualCoverageDept = await samplePage.getCoverageDept();
    expect(actualCoverageDept).toEqual(expectedCoverageDept);

    // - Coverage Breadth = 99.9%
    const expectedCoverageBreadth = "99.9%";
    const actualCoverageBreadth = await samplePage.getCoverageBreadth();
    expect(actualCoverageBreadth).toEqual(expectedCoverageBreadth);
    // #endregion 4. Verify "Is my consensus genome complete?" and "How good is the coverage?" section data

    // #region 5. From the sample report, click on the Download All button
    const download = await samplePage.clickDownloadAllButton();
    // #endregion 5. From the sample report, click on the Download All button

    // #region 6. Save (.zip) file
    const downloadPath = await download.path();
    // #endregion 6. Save (.zip) file

    // #region 7. Open .zip file
    const zip = new AdmZip(downloadPath);
    // #endregion 7. Open .zip file

    // #region 8. Verify the specified data file outputs against baseline outputs
    const zipContents = zip.getEntries();
    let zippedFileNames = [];
    for (const content of zipContents) {
      zippedFileNames.push(content.entryName);
    }
    zippedFileNames = zippedFileNames.sort();
    /*
    "Comparing with baseline sample report(s) (older versions reports of the same sample):

    (.zip) file contains all Analysis output files
    The following files unzipped from the downloads folder should match those of the baseline run:
    - aligned_reads.bam
    - consensus.fa
    - depths.png
    - ercc_stats.txt
    - no_host_1.fq.gz
    - no_host_2.fq.gz
    - primertrimmed.bam
    - primertrimmed.bam.bai
    - report.tsv
    - report.txt
    - samtools_depth.txt
    - stats.json
    - variants.vcf.gz
    - wgs_SARS_CoV2_no_host.muscle.out.fasta
    - wgs_SARS_CoV2_primers_regions.bed
    - wgs_SARS_CoV2_reference.fa"
    */
    let expectedZippedFiles = [
      "aligned_reads.bam",
      "consensus.fa",
      "depths.png",
      "ercc_stats.txt",
      "no_host_1.fq.gz",
      "no_host_2.fq.gz",
      "primertrimmed.bam",
      "primertrimmed.bam.bai",
      "report.tsv",
      "report.txt",
      "samtools_depth.txt",
      "stats.json",
      "variants.vcf.gz",
      `${sampleNames[0]}.muscle.out.fasta`,
      "wgs_SARS_CoV2_primers_regions.bed",
      "wgs_SARS_CoV2_reference.fa",
    ];
    expectedZippedFiles = expectedZippedFiles.sort();
    zippedFileNames = zippedFileNames.sort();
    expect(zippedFileNames).toEqual(expectedZippedFiles);

    for (const content of zipContents) {
      let contentName = content.name;
      const analysisOutputData = content.getData();

      if (contentName.endsWith(".muscle.out.fasta")) {
        // This name is dynamic. `${sampleNames[0]}.muscle.out.fasta`
        contentName = "wgs_SARS_CoV2_no_host.muscle.out.fasta"; // Static name in fixtures
      }
      const fixtureFilePath = OUTPUT_PATH(contentName);
      const baselineData = await fs.readFile(fixtureFilePath);

      expect(analysisOutputData).toEqual(baselineData);
    }
    // #endregion 8. Verify the specified data file outputs against baseline outputs
  });

  test("SNo e2: WGS SARS-CoV-2 Data report validation example", async ({ page }) => {
    const WAIT_TIME = 60 * 1000 * 40;
    test.setTimeout(WAIT_TIME);

    // #region 1. Login to CZ ID staging
    projectPage = new ProjectPage(page);
    project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.WGS}`);
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for wgs_SARS_CoV2_no_host (see ""Data"") as a SARS-CoV-2 Consensus Genome, use the configuration:
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.MNGS);

    // TODO: Do we also add WGS?

    // - Sequencing Platform=Illumina
    await uploadPage.clickSequencingPlatform(SEQUENCING_PLATFORMS.MNGS);

    await uploadPage.uploadSampleFiles(WGS_SAMPLE_FILES);
    const sampleNames = await uploadPage.getSampleNames();

    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.WGS);
    await uploadPage.uploadRefSequence(SARS_COV2_REF_FILENAME); // https://drive.google.com/file/d/1gGSZRuFV0s5s1J0eBsu2zYcM6WaM2rbV/view
    await uploadPage.setUploadTaxonFilter("Unknown");
    await uploadPage.clickContinue();

    // - Host=Human
    const inputs = await uploadPage.getRandomizedSampleInputs(WGS_SAMPLE_FILES, sampleNames);
    for (const sampleName of sampleNames) {
      inputs[sampleName].hostOrganism = "Human";
    }

    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();

    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForUploadComplete();

    // and allow the pipeline to complete
    const samplePage = new SamplesPage(page);
    samplePage.waitForAllReportsComplete(project.name, sampleNames);
    // #endregion 2. Upload sample fastq files for wgs_SARS_CoV2_no_host (see ""Data"") as a SARS-CoV-2 Consensus Genome, use the configuration:

    // #region 3. Select ""Consensus Genomes"" tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    await projectPage.waitForSamplesComplete(project.id, WORKFLOWS.WGS, sampleNames, WAIT_TIME);
    // #endregion 3. Select ""Consensus Genomes"" tab

    // #region 4. Verify ""Is my consensus genome complete?"" and ""How good is the coverage?"" section data
    await projectPage.clickSample(sampleNames[0]);
    await samplePage.clickConsensusGenomeTab();

    // wgs_SARS_CoV2_no_host" DATA
    // Is my consensus genome complete?" data is consistent with below values:
    // - Taxon = Severe acute respiratory syndrome coronavirus 2
    // - Mapped Reads = 106561
    // - GC Content = 37.9%
    // - SNPs = 79
    // - %id = 99.7%
    // - Informative Nucleotides = 29632
    // - %Genome Called = 99.1%
    // - Missing Bases = 125
    // - Ambiguous Bases = 1
    const expectedData = [
      {
        "Taxon": "",
        "Mapped Reads": "108037",
        "GC Content": "37.9%",
        "SNPs": "0",
        "%id": "100%",
        "Informative Nucleotides": "29760",
        "% Genome Called": "99.9%",
        "Missing Bases": "6",
        "Ambiguous Bases": "1",
      },
    ];
    const consensusGenomeTable = await samplePage.getIsMyConsensusGenomeCompleteTable();
    expect(consensusGenomeTable).toEqual(expectedData);

    // How good is the coverage?" data is consistent with below values:
    // - NCBI reference = MN908947.3

    // - Reference Length = 29903
    const expectedReferenceLength = "29790";
    const actualReferenceLength = await samplePage.getReferenceLength();
    expect(actualReferenceLength).toEqual(expectedReferenceLength);

    // - Coverage Depth = 409.4x
    const expectedCoverageDept = "422.0x";
    const actualCoverageDept = await samplePage.getCoverageDept();
    expect(actualCoverageDept).toEqual(expectedCoverageDept);

    // - Coverage Breadth = 99.9%
    const expectedCoverageBreadth = "99.9%";
    const actualCoverageBreadth = await samplePage.getCoverageBreadth();
    expect(actualCoverageBreadth).toEqual(expectedCoverageBreadth);
    // #endregion 4. Verify ""Is my consensus genome complete?"" and ""How good is the coverage?"" section data

    // #region 5. From the sample report, click on the Download All button
    const download = await samplePage.clickDownloadAllButton();
    // #endregion 5. From the sample report, click on the Download All button

    // #region 6. Save (.zip) file
    const downloadPath = await download.path();
    // #endregion 6. Save (.zip) file

    // #region 7. Open .zip file
    const zip = new AdmZip(downloadPath);
    // #endregion 7. Open .zip file

    // #region 8. Verify the specified data file outputs against baseline outputs"
    // (.zip) file contains all Analysis output files
    // The following files unzipped from the downloads folder should match those of the baseline run:
    // - aligned_reads.bam
    // - consensus.fa
    // - depths.png
    // - ercc_stats.txt
    // - no_host_1.fq.gz
    // - no_host_2.fq.gz
    // - primertrimmed.bam
    // - primertrimmed.bam.bai
    // - report.tsv
    // - report.txt
    // - samtools_depth.txt
    // - stats.json
    // - variants.vcf.gz
    // - wgs_SARS_CoV2_no_host_1.muscle.out.fasta
    const zipContents = zip.getEntries();
    let zippedFileNames = [];
    for (const content of zipContents) {
      zippedFileNames.push(content.entryName);
    }
    zippedFileNames = zippedFileNames.sort();
    let expectedZippedFiles = [
      "aligned_reads.bam",
      "consensus.fa",
      "depths.png",
      "ercc_stats.txt",
      "no_host_1.fq.gz",
      "no_host_2.fq.gz",
      "primertrimmed.bam",
      "primertrimmed.bam.bai",
      "report.tsv",
      "report.txt",
      "samtools_depth.txt",
      "stats.json",
      "variants.vcf.gz",
      `${sampleNames[0]}.muscle.out.fasta`,
      "wgs_SARS_CoV2_reference.fa",
    ];
    expectedZippedFiles = expectedZippedFiles.sort();
    zippedFileNames = zippedFileNames.sort();
    expect(zippedFileNames).toEqual(expectedZippedFiles);

    for (const content of zipContents) {
      let contentName = content.name;
      const analysisOutputData = content.getData();

      if (contentName.endsWith(".muscle.out.fasta")) {
        // This name is dynamic. `${sampleNames[0]}.muscle.out.fasta`
        contentName = "wgs_SARS_CoV2_no_host.muscle.out.fasta"; // Static name in fixtures
      }
      const fixtureFilePath = OUTPUT_PATH(contentName);
      const baselineData = await fs.readFile(fixtureFilePath);

      expect(analysisOutputData).toEqual(baselineData);
    }
    // #endregion 8. Verify the specified data file outputs against baseline outputs"
  });

});