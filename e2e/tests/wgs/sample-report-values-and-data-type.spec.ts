import { WORKFLOWS } from "@e2e/constants/common";
import { SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2 } from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage } from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

let project = null;
let projectPage = null;

// #region Expected data
const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const NO_HOST_1 = "no_host_1";
const NO_HOST_2 = "no_host_2";
const WGS_SAMPLE_NAMES = [NO_HOST_1, NO_HOST_2];
const PIPELINE_VERSION = "Consensus Genome Pipeline v3.4.18";
const GC_CONTENT_LABEL = "GC Content";
const INFORMATIVE_NUCLEOTIDES_LABEL = "Informative Nucleotides";
const GENOME_CALLED_LABEL = "% Genome Called";
const MISSING_BASES_LABEL = "Missing Bases";
const AMBIGUOUS_BASES_LABEL = "Ambiguous Bases";
const REFERENCE_ACCESSION_LENGTH_LABEL = "Reference Accession Length";
const COVERAGE_DEPTH_LABEL = "Coverage Depth";
const expectedData = {
  "no_host_1": {
    "ConsensusGenomeData": [{
      Taxon: "",
      "Mapped Reads": "545789",
      "GC Content": "37.9%",
      SNPs: "0",
      "%id": "100%",
      "Informative Nucleotides": "29778",
      "% Genome Called": "100%",
      "Missing Bases": "13",
      "Ambiguous Bases": "2",
    }],
    "PipelineVersion": PIPELINE_VERSION,
    "ReferenceLength": "29793",
    "CoverageDept": "2108.3x",
    "CoverageBreadth": "100.0%",
  },
  "no_host_2": {
    "ConsensusGenomeData": [{
      Taxon: "",
      "Mapped Reads": "547079",
      "GC Content": "37.9%",
      SNPs: "0",
      "%id": "100%",
      "Informative Nucleotides": "29779",
      "% Genome Called": "100%",
      "Missing Bases": "13",
      "Ambiguous Bases": "1",
    }],
    "PipelineVersion": PIPELINE_VERSION,
    "ReferenceLength": "29793",
    "CoverageDept": "2121.9x",
    "CoverageBreadth": "100.0%",
  },
};
const CHIKUNGUNYA_VIRUS_SPECIES = "Chikungunya virus (species)";
// #endregion Expected data


/*
 * WGS - Sample report Values & Data type
 */
test.describe("Data Validation: P-0", () => {

  test("SNo 28: Data report validation (Human) JAN", async ({ page }) => {
    await runPipelineIfNeeded(page, "Test_SNo_28", "Human", "Unknown");

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select "x" project
    await projectPage.getProjectByName(project.name);
    // #endregion 2. At Project tab, select "x" project

    // #region 3. Select "Consensus Genomes" tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 3. Select "Consensus Genomes" tab

    const expectedDataHuman = expectedData;
    const samplesPage = new SamplesPage(page);
    for (const sampleName of Object.keys(expectedDataHuman)) {
      // #region 4. Click on "no_host_x" WGS sample
      await projectPage.clickSample(sampleName);
      await samplesPage.clickConsensusGenomeTab();
      // #endregion 4. Click on "no_host_x" WGS sample

      // #region 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data
      const actualConsensusGenomeData = await samplesPage.getIsMyConsensusGenomeCompleteTable();
      const expectedConsensusGenomeData = expectedDataHuman[sampleName]["ConsensusGenomeData"];
      expect(actualConsensusGenomeData).toEqual(expectedConsensusGenomeData);
      // #endregion 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data

      // #region 6. Verify Consensus Genome Pipeline version
      const expectedPipelineVersion = expectedDataHuman[sampleName]["PipelineVersion"];
      const actualPipelineVersion = await samplesPage.getPipelineVersion();
      expect(actualPipelineVersion).toEqual(expectedPipelineVersion);
      // #endregion 6. Verify Consensus Genome Pipeline version

      // #region 7. Hover over "How good is the coverage?" histogram
      const expectedReferenceLength = expectedDataHuman[sampleName]["ReferenceLength"];
      const actualReferenceLength = await samplesPage.getReferenceLength();
      expect(actualReferenceLength).toEqual(expectedReferenceLength);

      const expectedCoverageDept = expectedDataHuman[sampleName]["CoverageDept"];
      const actualCoverageDept = await samplesPage.getCoverageDept();
      expect(actualCoverageDept).toEqual(expectedCoverageDept);

      const expectedCoverageBreadth = expectedDataHuman[sampleName]["CoverageBreadth"];
      const actualCoverageBreadth = await samplesPage.getCoverageBreadth();
      expect(actualCoverageBreadth).toEqual(expectedCoverageBreadth);

      await samplesPage.hoverOverCoverageVizHistogram();

      // Base Pair Range - integer - integer
      const expectedHoverBasePairRange = /[0-9]+–[0-9]+/;
      const actualHoverBasePairRange = await samplesPage.getHoverBasePairRange();
      expect(actualHoverBasePairRange).toMatch(expectedHoverBasePairRange);

      // Coverage Depth - decimal (followed by ""x"")
      const expectedHoverCoverageDepth = /\d+\.\d+x/;
      const actualHoverCoverageDepth = await samplesPage.getHoverCoverageDepth();
      expect(actualHoverCoverageDepth).toMatch(expectedHoverCoverageDepth);

      // Coverage Breadth - percentage (0-100% range)
      const expectedHoverCoverageBreadth = /\d{1,3}\.\d{1}%/;
      const actualHoverCoverageBreadth = await samplesPage.getHoverCoverageBreadth();
      expect(actualHoverCoverageBreadth).toMatch(expectedHoverCoverageBreadth);
      // #endregion 7. Hover over "How good is the coverage?" histogram

      // #region 8. Click on Sample Details link and verify Metadata - Host is "Human"
      await samplesPage.clickSampleDetailsButton();
      const expectedMetadataHost = "Human";
      const actualMetadataHost = await samplesPage.getSampleDetailsMetadataHost();
      expect(actualMetadataHost).toEqual(expectedMetadataHost);
      // #endregion 8. Click on Sample Details link and verify Metadata - Host is "Human"

      // #region 9. Go back to "x" CG sample list and cliick on "no_host_x" WGS sample
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
      // #endregion 9. Go back to "floo sp95b" CG sample list and cliick on "no_host_x" WGS sample

      // 10. Repeat steps 5-8
    }
  });

  test("SNo 31: Sample report values displayed in project sample view list", async ({ page }) => {
    await runPipelineIfNeeded(page, "Test_SNo_31", "Human", "Unknown");

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select "x" project
    await projectPage.getProjectByName(project.name);
    // #endregion 2. At Project tab, select "x" project

    // #region 3. Select "Consensus Genomes" tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 3. Select "Consensus Genomes" tab

    // #region 4. Click on (+) sign at sample list table and add columns:
    const addColumns = [
      GC_CONTENT_LABEL,
      "SNPs",
      "%id",
      INFORMATIVE_NUCLEOTIDES_LABEL,
      GENOME_CALLED_LABEL,
      MISSING_BASES_LABEL,
      AMBIGUOUS_BASES_LABEL,
      REFERENCE_ACCESSION_LENGTH_LABEL,
      COVERAGE_DEPTH_LABEL,
    ];
    await projectPage.selectPlusColumnOptions(addColumns);
    // #endregion 4. Click on (+) sign at sample list table and add columns:

    // #region Observe "no_host_x" WGS sample record and verify values and data types
    const samplesTable = await projectPage.getSamplesTable();
    const samplesTableOrderByName = {};
    for (const row of samplesTable) {
      samplesTableOrderByName[row["Sample"][0]] = row;
    }
    const expectedColumnData = {
      "no_host_1": {
        "GC Content": "37.9%",
        "SNPs": "0",
        "%id": "100%",
        "Informative Nucleotides": "29,778",
        "% Genome Called": "100%",
        "Missing Bases": "13",
        "Ambiguous Bases": "2",
        "Reference Accession Length": "29,790",
        "Coverage Depth": "2108.27",
      },
      "no_host_2": {
        "GC Content": "37.9%",
        "SNPs": "0",
        "%id": "100%",
        "Informative Nucleotides": "29,779",
        "% Genome Called": "100%",
        "Missing Bases": "13",
        "Ambiguous Bases": "1",
        "Reference Accession Length": "29,790",
        "Coverage Depth": "2121.95",
      },
    };
    // 5. Observe "no_host_1" WGS sample record and verify values and data types
    // 6. Observe "no_host_2" WGS sample record and verify values and data types
    for (const sampleName of WGS_SAMPLE_NAMES) {
      // "no_host_x" DATA
      const noHostData = samplesTableOrderByName[sampleName];
      const expectedData = expectedColumnData[sampleName];

      expect(noHostData[GC_CONTENT_LABEL]).toEqual(expectedData[GC_CONTENT_LABEL]);
      expect(noHostData["SNPs"]).toEqual(expectedData["SNPs"]);
      expect(noHostData["%id"]).toEqual(expectedData["%id"]);
      expect(noHostData[INFORMATIVE_NUCLEOTIDES_LABEL]).toEqual(expectedData[INFORMATIVE_NUCLEOTIDES_LABEL]);
      expect(noHostData[GENOME_CALLED_LABEL]).toEqual(expectedData[GENOME_CALLED_LABEL]);
      expect(noHostData[MISSING_BASES_LABEL]).toEqual(expectedData[MISSING_BASES_LABEL]);
      expect(noHostData[AMBIGUOUS_BASES_LABEL]).toEqual(expectedData[AMBIGUOUS_BASES_LABEL]);
      expect(noHostData[REFERENCE_ACCESSION_LENGTH_LABEL]).toEqual(expectedData[REFERENCE_ACCESSION_LENGTH_LABEL]);
      expect(noHostData[COVERAGE_DEPTH_LABEL]).toEqual(expectedData[COVERAGE_DEPTH_LABEL]);
    }
    // #endregion Observe "no_host_x" WGS sample record and verify values and data types
  });

  test("SNo 34: Data report validation (ERCC Only) JAN", async ({ page }) => {
    await runPipelineIfNeeded(page, "Test_SNo_34", "ERCC Only", "Unknown");

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select "x" project
    await projectPage.getProjectByName(project.name);
    // #endregion 2. At Project tab, select "x" project

    // #region 3. Select "Consensus Genomes" tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 3. Select "Consensus Genomes" tab

    const expectedDataERCCOnly = expectedData;
    const samplesPage = new SamplesPage(page);
    for (const sampleName of Object.keys(expectedDataERCCOnly)) {
      // #region 4. Click on "no_host_x" WGS sample
      await projectPage.clickSample(sampleName);
      await samplesPage.clickConsensusGenomeTab();
      // #endregion 4. Click on "no_host_x" WGS sample

      // #region 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data
      const actualConsensusGenomeData = await samplesPage.getIsMyConsensusGenomeCompleteTable();
      const expectedConsensusGenomeData = expectedDataERCCOnly[sampleName]["ConsensusGenomeData"];
      expect(actualConsensusGenomeData).toEqual(expectedConsensusGenomeData);
      // #endregion 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data

      // #region 6. Verify Consensus Genome Pipeline version
      const expectedPipelineVersion = expectedDataERCCOnly[sampleName]["PipelineVersion"];
      const actualPipelineVersion = await samplesPage.getPipelineVersion();
      expect(actualPipelineVersion).toEqual(expectedPipelineVersion);
      // #endregion 6. Verify Consensus Genome Pipeline version

      // #region 7. Hover over "How good is the coverage?" histogram
      const expectedReferenceLength = expectedDataERCCOnly[sampleName]["ReferenceLength"];
      const actualReferenceLength = await samplesPage.getReferenceLength();
      expect(actualReferenceLength).toEqual(expectedReferenceLength);

      const expectedCoverageDept = expectedDataERCCOnly[sampleName]["CoverageDept"];
      const actualCoverageDept = await samplesPage.getCoverageDept();
      expect(actualCoverageDept).toEqual(expectedCoverageDept);

      const expectedCoverageBreadth = expectedDataERCCOnly[sampleName]["CoverageBreadth"];
      const actualCoverageBreadth = await samplesPage.getCoverageBreadth();
      expect(actualCoverageBreadth).toEqual(expectedCoverageBreadth);

      await samplesPage.hoverOverCoverageVizHistogram();

      // Base Pair Range - integer - integer
      const expectedHoverBasePairRange = /[0-9]+–[0-9]+/;
      const actualHoverBasePairRange = await samplesPage.getHoverBasePairRange();
      expect(actualHoverBasePairRange).toMatch(expectedHoverBasePairRange);

      // Coverage Depth - decimal (followed by ""x"")
      const expectedHoverCoverageDepth = /\d+\.\d+x/;
      const actualHoverCoverageDepth = await samplesPage.getHoverCoverageDepth();
      expect(actualHoverCoverageDepth).toMatch(expectedHoverCoverageDepth);

      // Coverage Breadth - percentage (0-100% range)
      const expectedHoverCoverageBreadth = /\d{1,3}\.\d{1}%/;
      const actualHoverCoverageBreadth = await samplesPage.getHoverCoverageBreadth();
      expect(actualHoverCoverageBreadth).toMatch(expectedHoverCoverageBreadth);
      // #endregion 7. Hover over "How good is the coverage?" histogram

      // #region 8. Click on Sample Details link and verify Metadata - Host is "Human"
      await samplesPage.clickSampleDetailsButton();
      const expectedMetadataHost = "ERCC only";
      const actualMetadataHost = await samplesPage.getSampleDetailsMetadataHost();
      expect(actualMetadataHost).toEqual(expectedMetadataHost);
      // #endregion 8. Click on Sample Details link and verify Metadata - Host is "Human"

      // #region 9. Go back to "x" CG sample list and cliick on "no_host_x" WGS sample
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
      // #endregion 9. Go back to "floo sp95b" CG sample list and cliick on "no_host_x" WGS sample

      // 10. Repeat steps 5-8
    }
  });

  test("SNo 35: Data report validation (Human) - Chikungunya virus (species) JAN", async ({ page }) => {
    await runPipelineIfNeeded(page, "Test_SNo_35", "Human", "Chikungunya virus");

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select "x" project
    await projectPage.getProjectByName(project.name);
    // #endregion 2. At Project tab, select "x" project

    // #region 3. Select "Consensus Genomes" tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 3. Select "Consensus Genomes" tab

    expectedData["no_host_1"]["ConsensusGenomeData"][0]["Taxon"] = CHIKUNGUNYA_VIRUS_SPECIES;
    expectedData["no_host_2"]["ConsensusGenomeData"][0]["Taxon"] = CHIKUNGUNYA_VIRUS_SPECIES;
    const expectedDataChikungunyaVirus = expectedData;
    const samplesPage = new SamplesPage(page);
    for (const sampleName of Object.keys(expectedDataChikungunyaVirus)) {
      // #region 4. Click on "no_host_x" WGS sample
      await projectPage.clickSample(sampleName);
      await samplesPage.clickConsensusGenomeTab();
      // #endregion 4. Click on "no_host_x" WGS sample

      // #region 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data
      const actualConsensusGenomeData = await samplesPage.getIsMyConsensusGenomeCompleteTable();
      const expectedConsensusGenomeData = expectedDataChikungunyaVirus[sampleName]["ConsensusGenomeData"];
      expect(actualConsensusGenomeData).toEqual(expectedConsensusGenomeData);
      // #endregion 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data

      // #region 6. Verify Consensus Genome Pipeline version
      const expectedPipelineVersion = expectedDataChikungunyaVirus[sampleName]["PipelineVersion"];
      const actualPipelineVersion = await samplesPage.getPipelineVersion();
      expect(actualPipelineVersion).toEqual(expectedPipelineVersion);
      // #endregion 6. Verify Consensus Genome Pipeline version

      // #region 7. Hover over "How good is the coverage?" histogram
      const expectedReferenceLength = expectedDataChikungunyaVirus[sampleName]["ReferenceLength"];
      const actualReferenceLength = await samplesPage.getReferenceLength();
      expect(actualReferenceLength).toEqual(expectedReferenceLength);

      const expectedCoverageDept = expectedDataChikungunyaVirus[sampleName]["CoverageDept"];
      const actualCoverageDept = await samplesPage.getCoverageDept();
      expect(actualCoverageDept).toEqual(expectedCoverageDept);

      const expectedCoverageBreadth = expectedDataChikungunyaVirus[sampleName]["CoverageBreadth"];
      const actualCoverageBreadth = await samplesPage.getCoverageBreadth();
      expect(actualCoverageBreadth).toEqual(expectedCoverageBreadth);

      await samplesPage.hoverOverCoverageVizHistogram();

      // Base Pair Range - integer - integer
      const expectedHoverBasePairRange = /[0-9]+–[0-9]+/;
      const actualHoverBasePairRange = await samplesPage.getHoverBasePairRange();
      expect(actualHoverBasePairRange).toMatch(expectedHoverBasePairRange);

      // Coverage Depth - decimal (followed by ""x"")
      const expectedHoverCoverageDepth = /\d+\.\d+x/;
      const actualHoverCoverageDepth = await samplesPage.getHoverCoverageDepth();
      expect(actualHoverCoverageDepth).toMatch(expectedHoverCoverageDepth);

      // Coverage Breadth - percentage (0-100% range)
      const expectedHoverCoverageBreadth = /\d{1,3}\.\d{1}%/;
      const actualHoverCoverageBreadth = await samplesPage.getHoverCoverageBreadth();
      expect(actualHoverCoverageBreadth).toMatch(expectedHoverCoverageBreadth);
      // #endregion 7. Hover over "How good is the coverage?" histogram

      // #region 8. Click on Sample Details link and verify Metadata - Host is "Human"
      await samplesPage.clickSampleDetailsButton();
      const expectedMetadataHost = "Human";
      const actualMetadataHost = await samplesPage.getSampleDetailsMetadataHost();
      expect(actualMetadataHost).toEqual(expectedMetadataHost);
      // #endregion 8. Click on Sample Details link and verify Metadata - Host is "Human"

      // #region 9. Go back to "x" CG sample list and cliick on "no_host_x" WGS sample
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
      // #endregion 9. Go back to "floo sp95b" CG sample list and cliick on "no_host_x" WGS sample

      // 10. Repeat steps 5-8
    }
  });

  test("SNo 36: Data report validation (ERCC Only) - Chikungunya virus (species) JAN", async ({ page }) => {
    await runPipelineIfNeeded(page, "Test_SNo_36", "ERCC Only", "Chikungunya virus");

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select "x" project
    await projectPage.getProjectByName(project.name);
    // #endregion 2. At Project tab, select "x" project

    // #region 3. Select "Consensus Genomes" tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 3. Select "Consensus Genomes" tab

    expectedData["no_host_1"]["ConsensusGenomeData"][0]["Taxon"] = CHIKUNGUNYA_VIRUS_SPECIES;
    expectedData["no_host_2"]["ConsensusGenomeData"][0]["Taxon"] = CHIKUNGUNYA_VIRUS_SPECIES;
    const expectedDataERCCOnlyChikungunyaVirus = expectedData;
    const samplesPage = new SamplesPage(page);
    for (const sampleName of Object.keys(expectedDataERCCOnlyChikungunyaVirus)) {
      // #region 4. Click on "no_host_x" WGS sample
      await projectPage.clickSample(sampleName);
      await samplesPage.clickConsensusGenomeTab();
      // #endregion 4. Click on "no_host_x" WGS sample

      // #region 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data
      const actualConsensusGenomeData = await samplesPage.getIsMyConsensusGenomeCompleteTable();
      const expectedConsensusGenomeData = expectedDataERCCOnlyChikungunyaVirus[sampleName]["ConsensusGenomeData"];
      expect(actualConsensusGenomeData).toEqual(expectedConsensusGenomeData);
      // #endregion 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data

      // #region 6. Verify Consensus Genome Pipeline version
      const expectedPipelineVersion = expectedDataERCCOnlyChikungunyaVirus[sampleName]["PipelineVersion"];
      const actualPipelineVersion = await samplesPage.getPipelineVersion();
      expect(actualPipelineVersion).toEqual(expectedPipelineVersion);
      // #endregion 6. Verify Consensus Genome Pipeline version

      // #region 7. Hover over "How good is the coverage?" histogram
      const expectedReferenceLength = expectedDataERCCOnlyChikungunyaVirus[sampleName]["ReferenceLength"];
      const actualReferenceLength = await samplesPage.getReferenceLength();
      expect(actualReferenceLength).toEqual(expectedReferenceLength);

      const expectedCoverageDept = expectedDataERCCOnlyChikungunyaVirus[sampleName]["CoverageDept"];
      const actualCoverageDept = await samplesPage.getCoverageDept();
      expect(actualCoverageDept).toEqual(expectedCoverageDept);

      const expectedCoverageBreadth = expectedDataERCCOnlyChikungunyaVirus[sampleName]["CoverageBreadth"];
      const actualCoverageBreadth = await samplesPage.getCoverageBreadth();
      expect(actualCoverageBreadth).toEqual(expectedCoverageBreadth);

      await samplesPage.hoverOverCoverageVizHistogram();

      // Base Pair Range - integer - integer
      const expectedHoverBasePairRange = /[0-9]+–[0-9]+/;
      const actualHoverBasePairRange = await samplesPage.getHoverBasePairRange();
      expect(actualHoverBasePairRange).toMatch(expectedHoverBasePairRange);

      // Coverage Depth - decimal (followed by ""x"")
      const expectedHoverCoverageDepth = /\d+\.\d+x/;
      const actualHoverCoverageDepth = await samplesPage.getHoverCoverageDepth();
      expect(actualHoverCoverageDepth).toMatch(expectedHoverCoverageDepth);

      // Coverage Breadth - percentage (0-100% range)
      const expectedHoverCoverageBreadth = /\d{1,3}\.\d{1}%/;
      const actualHoverCoverageBreadth = await samplesPage.getHoverCoverageBreadth();
      expect(actualHoverCoverageBreadth).toMatch(expectedHoverCoverageBreadth);
      // #endregion 7. Hover over "How good is the coverage?" histogram

      // #region 8. Click on Sample Details link and verify Metadata - Host is "Human"
      await samplesPage.clickSampleDetailsButton();
      const expectedMetadataHost = "ERCC only";
      const actualMetadataHost = await samplesPage.getSampleDetailsMetadataHost();
      expect(actualMetadataHost).toEqual(expectedMetadataHost);
      // #endregion 8. Click on Sample Details link and verify Metadata - Host is "Human"

      // #region 9. Go back to "x" CG sample list and cliick on "no_host_x" WGS sample
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
      // #endregion 9. Go back to "floo sp95b" CG sample list and cliick on "no_host_x" WGS sample

      // 10. Repeat steps 5-8
    }
  });
});

async function runPipelineIfNeeded(page: any, projectName: string, hostOrganism: string, taxon: string) {
  projectPage = new ProjectPage(page);
  project = await projectPage.getOrCreateProject(projectName);
  const samplesPage = new SamplesPage(page);

  let samples = [];
  let ranPipeline = false;
  const noHostSample1 = await samplesPage.getSamples(project.name, WGS_SAMPLE_NAMES[0]);
  const noHostSample2 = await samplesPage.getSamples(project.name, WGS_SAMPLE_NAMES[1]);
  if (noHostSample1.length <= 0 && noHostSample2.length <= 0) {
    test.setTimeout(60 * 1000 * 20); // Inclease the test runtime to let the piepline run

    const uploadPage = new UploadPage(page);
    const inputs = await uploadPage.getRandomizedSampleInputs(WGS_SAMPLE_FILES, WGS_SAMPLE_NAMES);
    for (const sampleName of WGS_SAMPLE_NAMES) {
      inputs[sampleName].hostOrganism = hostOrganism;
    }
    await uploadPage.e2eCSVSampleUpload(WGS_SAMPLE_FILES, project, WORKFLOWS.WGS, inputs, true, taxon);
    samples = await samplesPage.getSamples(project.name, WGS_SAMPLE_NAMES[1]);
    ranPipeline = true;
  }

  if (ranPipeline) {
    await samplesPage.waitForReportComplete(samples[0].id); // Wait for the last report to finish
  }
}