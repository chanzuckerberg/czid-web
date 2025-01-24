import * as fs from "fs/promises";
import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_NO_HOST_1,
  SAMPLE_FILE_NO_HOST_2,
} from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import {
  UploadPage,
  SARS_COV2_REF_FILENAME,
  SARS_COV2_TRIM_PRIMER_FILENAME,
  WETLAB_PROTOCOL,
} from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import AdmZip = require("adm-zip");
import fastDiff = require("fast-diff");
import { ProjectPage } from "../../page-objects/project-page";

let project = null;
let projectPage = null;

// #region Expected data
const commonZipFiles = [
  "depths.png",
  "no_host_1.fq.gz",
  "report.tsv",
  "report.txt",
  "samtools_depth.txt",
  "stats.json",
];
const expectedZipFiles = [
  ...commonZipFiles,
  "aligned_reads.bam",
  "consensus.fa",
  "ercc_stats.txt",
  "no_host_2.fq.gz",
  "primertrimmed.bam",
  "primertrimmed.bam.bai",
  "variants.vcf.gz",
];

const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const SC2_NANOPORE_SAMPLE = "sars-cov-2_SRR11178050_10p";
const WGS_SARS_SAMPLE = "wgs_SARS_CoV2_no_host";
const OUTPUT_PATH = (outputDir: string, filename: string) =>
  `./fixtures/outputs/${outputDir}/${filename}`;
const WAIT_TIME = 60 * 1000 * 15;
const WAIT_FOR_PIPELINE = false;
const UPLOAD_TIMEOUT = 60 * 1000 * 5;
// #endregion Expected data

/*
 * WGS - Sample report
 */
test.describe("Data Validation: P-1", () => {
  test.beforeEach(async () => {
    test.setTimeout(WAIT_TIME);
  });

  test("SNo e1: WGS Sample Report & Download Data Validation", async ({
    page,
  }) => {
    // #region 1. Login to CZ ID staging
    projectPage = new ProjectPage(page);
    project = await projectPage.getOrCreateProject(`SNo-e1_${WORKFLOWS.WGS}`);
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for wgs_SARS_CoV2_no_host (see "Data") as a Viral Consensus Genome, use the configuration:
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.selectProject(project.name);

    // https://drive.google.com/file/d/1U-r_B4bioVGdXGTojzYgPaz-LFpNEpKY/view
    // https://drive.google.com/file/d/1ethRpFJ1DPrUhbQ66V9ZaK8ao_gy4gqt/view
    await uploadPage.uploadSampleFiles(WGS_SAMPLE_FILES, true, UPLOAD_TIMEOUT);

    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.WGS);

    // - reference=wgs_SARS_CoV2_reference.fa
    await uploadPage.uploadRefSequence(SARS_COV2_REF_FILENAME); // https://drive.google.com/file/d/1gGSZRuFV0s5s1J0eBsu2zYcM6WaM2rbV/view

    // - primer regions=wgs_SARS_CoV2_primers_regions.bed
    await uploadPage.uploadTrimPrimer(SARS_COV2_TRIM_PRIMER_FILENAME); // https://drive.google.com/file/d/1YY2AUJraiYA7v13hGFrPIQRoKdwVzZ2d/view

    // - Taxonomy=Unkonwn
    await uploadPage.setUploadTaxonFilter("Unknown");

    await uploadPage.clickContinue();

    // - Host=Human
    let sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(
      WGS_SAMPLE_FILES,
      sampleNames,
    );
    for (const sampleName of sampleNames) {
      inputs[sampleName].hostOrganism = "Human";
    }

    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();
    expect(await uploadPage.getErrors()).toEqual([]);

    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForUploadComplete();

    // and allow the pipeline to complete
    const samplePage = new SamplesPage(page);
    if (WAIT_FOR_PIPELINE) {
      await samplePage.waitForAllReportsComplete(project.name, sampleNames);
      await projectPage.waitForSamplesComplete(
        project.id,
        WORKFLOWS.WGS,
        sampleNames,
        WAIT_TIME,
      );
    } else {
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
      sampleNames = await projectPage.selectCompletedSamples(
        sampleNames.length,
      );
    }
    const sampleName = sampleNames[0];
    // #endregion 2. Upload sample fastq files for wgs_SARS_CoV2_no_host (see "Data") as a Viral Consensus Genome, use the configuration:

    // #region 3. Select "Consensus Genomes" tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    await projectPage.waitForSamplesComplete(
      project.id,
      WORKFLOWS.WGS,
      sampleNames,
      WAIT_TIME,
    );
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
        Taxon: "",
        "Mapped Reads": "108023",
        "GC Content": "37.9%",
        SNPs: "0",
        "%id": "100%",
        "Informative Nucleotides": "29639",
        "% Genome Called": "99.5%",
        "Missing Bases": "127",
        "Ambiguous Bases": "1",
      },
    ];
    const consensusGenomeTable =
      await samplePage.getIsMyConsensusGenomeCompleteTable();
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
      ...expectedZipFiles,
      `${sampleNames[0]}.muscle.out.fasta`,
      "wgs_SARS_CoV2_primers_regions.bed",
      "wgs_SARS_CoV2_reference.fa",
    ];
    expectedZippedFiles = expectedZippedFiles.sort();
    zippedFileNames = zippedFileNames.sort();
    expect(zippedFileNames).toEqual(expectedZippedFiles);

    await compareDataFilesWithTolerance(
      zipContents,
      "wgs_SARS_CoV2",
      sampleName,
      WGS_SARS_SAMPLE,
    );
    // #endregion 8. Verify the specified data file outputs against baseline outputs
  });

  test("SNo e2: WGS SC2 Sample Report & Download Data Validation", async ({
    page,
  }) => {
    // #region 1. Login to CZ ID staging
    projectPage = new ProjectPage(page);
    project = await projectPage.getOrCreateProject(`SNo-e2_${WORKFLOWS.WGS}`);
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for wgs_SARS_CoV2_no_host (see ""Data"") as a SARS-CoV-2 Consensus Genome, use the configuration:
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.SC2);

    // - Sequencing Platform=Illumina
    await uploadPage.clickSequencingPlatform(SEQUENCING_PLATFORMS.MNGS);
    await uploadPage.setWetLabFilter(WETLAB_PROTOCOL);

    await uploadPage.uploadSampleFiles(WGS_SAMPLE_FILES, true, UPLOAD_TIMEOUT);

    await uploadPage.clickContinue();

    // - Host=Human
    let sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(
      WGS_SAMPLE_FILES,
      sampleNames,
    );
    for (const sampleName of sampleNames) {
      inputs[sampleName].hostOrganism = "Human";
    }

    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();
    expect(await uploadPage.getErrors()).toEqual([]);

    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForUploadComplete();

    // and allow the pipeline to complete
    const samplePage = new SamplesPage(page);
    if (WAIT_FOR_PIPELINE) {
      await samplePage.waitForAllReportsComplete(project.name, sampleNames);
      await projectPage.waitForSamplesComplete(
        project.id,
        WORKFLOWS.WGS,
        sampleNames,
        WAIT_TIME,
      );
    } else {
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
      sampleNames = await projectPage.selectCompletedSamples(
        sampleNames.length,
      );
    }
    const sampleName = sampleNames[0];
    // #endregion 2. Upload sample fastq files for wgs_SARS_CoV2_no_host (see ""Data"") as a SARS-CoV-2 Consensus Genome, use the configuration:

    // #region 3. Select ""Consensus Genomes"" tab
    await projectPage.clickConsensusGenomeTab();
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
        Taxon: "Severe acute respiratory syndrome coronavirus 2",
        "Mapped Reads": "106253",
        "GC Content": "37.9%",
        SNPs: "76",
        "%id": "99.7%",
        "Informative Nucleotides": "29533",
        "% Genome Called": "98.8%",
        "Missing Bases": "224",
        "Ambiguous Bases": "1",
      },
    ];
    const consensusGenomeTable =
      await samplePage.getIsMyConsensusGenomeCompleteTable();
    expect(consensusGenomeTable).toEqual(expectedData);

    // How good is the coverage?" data is consistent with below values:
    // - NCBI reference = MN908947.3

    // - Reference Length = 29903
    const expectedReferenceLength = "29903";
    const actualReferenceLength = await samplePage.getReferenceLength();
    expect(actualReferenceLength).toEqual(expectedReferenceLength);

    // - Coverage Depth = 409.4x
    const expectedCoverageDept = "380.6x";
    const actualCoverageDept = await samplePage.getCoverageDept();
    expect(actualCoverageDept).toEqual(expectedCoverageDept);

    // - Coverage Breadth = 99.9%
    const expectedCoverageBreadth = "99.6%";
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
      ...expectedZipFiles,
      `${sampleName}.muscle.out.fasta`,
    ];
    expectedZippedFiles = expectedZippedFiles.sort();
    zippedFileNames = zippedFileNames.sort();
    expect(zippedFileNames).toEqual(expectedZippedFiles);

    await compareDataFilesWithTolerance(
      zipContents,
      "wgs_SARS_CoV2",
      sampleName,
      WGS_SARS_SAMPLE,
    );
    // #endregion 8. Verify the specified data file outputs against baseline outputs"
  });

  test("SNo e3: WGS SC2 Nanopore Sample Report & Download Data Validation", async ({
    page,
  }) => {
    // #region 1. Login to CZ ID staging
    projectPage = new ProjectPage(page);
    project = await projectPage.getOrCreateProject(
      `SNo-e3_${SEQUENCING_PLATFORMS.LMNGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload sample fastq files for sars-cov-2_SRR11178050_10p (see ""Data"") as a SARS-CoV-2 Consensus Genome, use the configuration:
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.selectProject(project.name);
    await uploadPage.clickCheckboxForWorkflow(WORKFLOWS.SC2);

    await uploadPage.uploadSampleFiles(
      [`${SC2_NANOPORE_SAMPLE}.fastq.gz`],
      true,
      UPLOAD_TIMEOUT,
    );

    // - Sequencing Platform=Nanopore
    await uploadPage.clickSequencingPlatform(WORKFLOWS.LMNGS);

    // - Used Clear Labs=No
    await uploadPage.clickClearLabsToggle("No");
    await uploadPage.setWetLabFilter(WETLAB_PROTOCOL);

    await uploadPage.clickContinue();

    // - Host=Human
    let sampleNames = await uploadPage.getMetadataSampleNames();
    const inputs = await uploadPage.getRandomizedSampleInputs(
      WGS_SAMPLE_FILES,
      sampleNames,
    );
    for (const sampleName of sampleNames) {
      inputs[sampleName].hostOrganism = "Human";
    }

    await uploadPage.setManualInputs(inputs);
    await uploadPage.clickContinue();
    expect(await uploadPage.getErrors()).toEqual([]);

    await uploadPage.clickTermsAgreementCheckbox();
    await uploadPage.clickStartUploadButton();
    await uploadPage.waitForUploadComplete();

    // and allow the pipeline to complete
    const samplePage = new SamplesPage(page);
    if (WAIT_FOR_PIPELINE) {
      await samplePage.waitForAllReportsComplete(project.name, sampleNames);
      await projectPage.waitForSamplesComplete(
        project.id,
        WORKFLOWS.WGS,
        sampleNames,
        WAIT_TIME,
      );
    } else {
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
      sampleNames = await projectPage.selectCompletedSamples(
        sampleNames.length,
      );
    }
    const sampleName = sampleNames[0];
    // #endregion 2. Upload sample fastq files for sars-cov-2_SRR11178050_10p (see ""Data"") as a SARS-CoV-2 Consensus Genome, use the configuration:

    // #region 3. Select ""Consensus Genomes"" tab
    await projectPage.clickConsensusGenomeTab();
    // #endregion 3. Select ""Consensus Genomes"" tab

    // #region 4. Verify ""How good is the coverage?"" section data
    await projectPage.clickSample(sampleNames[0]);
    await samplePage.clickConsensusGenomeTab();

    // "sars-cov-2_SRR11178050_10p"" DATA
    // ""How good is the coverage?"" data is consistent with below values:
    // - NCBI reference = MN908947.3
    const expectedNCBIReferenceLength = "MN908947.3";
    const actualNCBIReferenceLength = await samplePage.getNCBIReferenceLength();
    expect(actualNCBIReferenceLength).toEqual(expectedNCBIReferenceLength);

    // - Reference Length = 29903
    const expectedReferenceLength = "29903";
    const actualReferenceLength = await samplePage.getReferenceLength();
    expect(actualReferenceLength).toEqual(expectedReferenceLength);

    // - Coverage Depth = 1.4x
    const expectedCoverageDept = "1.5x";
    const actualCoverageDept = await samplePage.getCoverageDept();
    expect(actualCoverageDept).toEqual(expectedCoverageDept);

    // - Coverage Breadth = 62.3%
    const expectedCoverageBreadth = "68.1%";
    const actualCoverageBreadth = await samplePage.getCoverageBreadth();
    expect(actualCoverageBreadth).toEqual(expectedCoverageBreadth);
    // #endregion 4. Verify ""How good is the coverage?"" section data

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
    // Comparing with baseline sample report(s) (older versions reports of the same sample):
    // (.zip) file contains all Analysis output files
    // The following files unzipped from the downloads folder should match those of the baseline run:
    // - depths.png
    // - no_host_1.fq.gz
    // - report.tsv
    // - report.txt
    // - samtools_depth.txt
    // - sars-cov-2_SRR11178050_10p.consensus.fasta
    // - sars-cov-2_SRR11178050_10p.merged.vcf
    // - sars-cov-2_SRR11178050_10p.muscle.out.fasta
    // - sars-cov-2_SRR11178050_10p.primertrimmed.rg.sorted.bam
    // - sars-cov-2_SRR11178050_10p.primertrimmed.rg.sorted.bam.bai
    // - sars-cov-2_SRR11178050_10p.sorted.bam
    // - sars-cov-2_SRR11178050_10p.sorted.bam.bai
    // - stats.json"
    const zipContents = zip.getEntries();
    let zippedFileNames = [];
    for (const content of zipContents) {
      zippedFileNames.push(content.entryName);
    }
    zippedFileNames = zippedFileNames.sort();
    const dynamicFileNames = [
      `${sampleName}.consensus.fasta`,
      `${sampleName}.merged.vcf`,
      `${sampleName}.muscle.out.fasta`,
      `${sampleName}.primertrimmed.rg.sorted.bam`,
      `${sampleName}.primertrimmed.rg.sorted.bam.bai`,
      `${sampleName}.sorted.bam`,
      `${sampleName}.sorted.bam.bai`,
    ];
    const expectedZippedFiles = [...commonZipFiles, ...dynamicFileNames].sort();
    expect(zippedFileNames).toEqual(expectedZippedFiles);

    await compareDataFilesWithTolerance(
      zipContents,
      "sars-cov-2",
      sampleName,
      SC2_NANOPORE_SAMPLE,
    );
    // #endregion 8. Verify the specified data file outputs against baseline outputs
  });
});

async function compareDataFilesWithTolerance(
  zipContents: AdmZip.IZipEntry[],
  fixtureDir: string,
  sampleName: string,
  baselineName: string,
  percentage = 0.99,
) {
  for (const content of zipContents) {
    let contentName = content.name;
    if (contentName.startsWith(sampleName)) {
      // This name is dynamic
      contentName = contentName.replace(sampleName, baselineName);
    }
    const analysisOutputData = content.getData();

    const parts = contentName.split(".");
    const fileExtention = parts[parts.length - 1];
    const binaryFiles = ["bam", "png", "gz", "bai"];
    if (binaryFiles.includes(fileExtention)) {
      // Diffing large binary files takes several minutes
      expect(analysisOutputData.length).toBeGreaterThan(0); // Expect a non-empty binary file
      continue;
    }

    const fixtureFilePath = OUTPUT_PATH(fixtureDir, contentName);
    const baselineData = await fs.readFile(fixtureFilePath);

    let stringifiedAnalysisOutputData = analysisOutputData.toString();

    stringifiedAnalysisOutputData = stringifiedAnalysisOutputData.replace(
      sampleName,
      baselineName,
    );

    const stringifiedBaselineData = baselineData.toString();

    const resultDiff = fastDiff(
      stringifiedAnalysisOutputData,
      stringifiedBaselineData,
    );
    const tollerance = stringifiedBaselineData.length * percentage;
    expect(resultDiff.length).toBeLessThanOrEqual(tollerance);
  }
}
