import { WORKFLOWS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_NO_HOST_1,
  SAMPLE_FILE_NO_HOST_2,
} from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

// #region Expected data
const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const NO_HOST = "wgs_SARS_CoV2_no_host";
const WGS_SAMPLE_NAMES = [NO_HOST];
const PIPELINE_MAJOR_VERSION = "3";
const GC_CONTENT_LABEL = "GC Content";
const INFORMATIVE_NUCLEOTIDES_LABEL = "Informative Nucleotides";
const GENOME_CALLED_LABEL = "% Genome Called";
const MISSING_BASES_LABEL = "Missing Bases";
const AMBIGUOUS_BASES_LABEL = "Ambiguous Bases";
const REFERENCE_ACCESSION_LENGTH_LABEL = "Reference Accession Length";
const COVERAGE_DEPTH_LABEL = "Coverage Depth";
const expectedData = {
  wgs_SARS_CoV2_no_host: {
    ConsensusGenomeData: [
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
    ],
    PipelineVersion: PIPELINE_MAJOR_VERSION,
    ReferenceLength: "29790",
    CoverageDept: "420.4x",
    CoverageBreadth: "99.9%",
  },
};
const CHIKUNGUNYA_VIRUS = "Chikungunya virus";
// #endregion Expected data

/*
 * Viral CG (WGS) - Sample report: Values & Data type
 */
test.describe("Data Validation: P-0", () => {
  test("SNo 28: Data report validation (Human) JAN", async ({ page }) => {
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject("Test_SNo_28");
    await projectPage.deleteSamplesOlderThanGivenMonths(
      project,
      WORKFLOWS.WGS,
      5,
    );
    await setupSamples(
      page,
      project,
      WGS_SAMPLE_FILES,
      WGS_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      { hostOrganism: "Human", taxon: "Unknown", waitForPipeline: true },
    );

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
      const actualConsensusGenomeData =
        await samplesPage.getIsMyConsensusGenomeCompleteTable();
      const expectedConsensusGenomeData =
        expectedDataHuman[sampleName]["ConsensusGenomeData"];
      expect(actualConsensusGenomeData).toEqual(expectedConsensusGenomeData);
      // #endregion 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data

      // #region 6. Verify Consensus Genome Pipeline version
      const expectedPipelineRegex = new RegExp(
        `Consensus Genome Pipeline v${expectedDataHuman[sampleName]["PipelineVersion"]}.\\d+.\\d+`,
      );
      const actualPipelineVersion = await samplesPage.getPipelineVersion();
      expect(actualPipelineVersion).toMatch(expectedPipelineRegex);
      // #endregion 6. Verify Consensus Genome Pipeline version

      // #region 7. Hover over "How good is the coverage?" histogram
      const expectedReferenceLength =
        expectedDataHuman[sampleName]["ReferenceLength"];
      const actualReferenceLength = await samplesPage.getReferenceLength();
      expect(actualReferenceLength).toEqual(expectedReferenceLength);

      const expectedCoverageDept =
        expectedDataHuman[sampleName]["CoverageDept"];
      const actualCoverageDept = await samplesPage.getCoverageDept();
      expect(actualCoverageDept).toEqual(expectedCoverageDept);

      const expectedCoverageBreadth =
        expectedDataHuman[sampleName]["CoverageBreadth"];
      const actualCoverageBreadth = await samplesPage.getCoverageBreadth();
      expect(actualCoverageBreadth).toEqual(expectedCoverageBreadth);

      await samplesPage.hoverOverCoverageVizHistogram();

      // Base Pair Range - integer - integer
      const expectedHoverBasePairRange = /[0-9]+–[0-9]+/;
      const actualHoverBasePairRange =
        await samplesPage.getHoverBasePairRange();
      expect(actualHoverBasePairRange).toMatch(expectedHoverBasePairRange);

      // Coverage Depth - decimal (followed by ""x"")
      const expectedHoverCoverageDepth = /\d+\.\d+x/;
      const actualHoverCoverageDepth =
        await samplesPage.getHoverCoverageDepth();
      expect(actualHoverCoverageDepth).toMatch(expectedHoverCoverageDepth);

      // Coverage Breadth - percentage (0-100% range)
      const expectedHoverCoverageBreadth = /\d{1,3}\.\d{1}%/;
      const actualHoverCoverageBreadth =
        await samplesPage.getHoverCoverageBreadth();
      expect(actualHoverCoverageBreadth).toMatch(expectedHoverCoverageBreadth);
      // #endregion 7. Hover over "How good is the coverage?" histogram

      // #region 8. Click on Sample Details link and verify Metadata - Host is "Human"
      await samplesPage.clickSampleDetailsButton();
      const expectedMetadataHost = "Human";
      const actualMetadataHost =
        await samplesPage.getSampleDetailsMetadataHost();
      expect(actualMetadataHost).toEqual(expectedMetadataHost);
      // #endregion 8. Click on Sample Details link and verify Metadata - Host is "Human"

      // #region 9. Go back to "x" CG sample list and cliick on "no_host_x" WGS sample
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
      // #endregion 9. Go back to "floo sp95b" CG sample list and cliick on "no_host_x" WGS sample

      // 10. Repeat steps 5-8
    }
  });

  test("SNo 31: Sample report values displayed in project sample view list", async ({
    page,
  }) => {
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject("Test_SNo_31");
    await projectPage.deleteSamplesOlderThanGivenMonths(
      project,
      WORKFLOWS.WGS,
      5,
    );
    await setupSamples(
      page,
      project,
      WGS_SAMPLE_FILES,
      WGS_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      { hostOrganism: "Human", taxon: "Unknown", waitForPipeline: true },
    );

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
      wgs_SARS_CoV2_no_host: {
        "GC Content": "37.9%",
        SNPs: "0",
        "%id": "100%",
        "Informative Nucleotides": "29,639",
        "% Genome Called": "99.5%",
        "Missing Bases": "127",
        "Ambiguous Bases": "1",
        "Reference Accession Length": "29,790",
        "Coverage Depth": "420.40",
      },
    };
    // 5. Observe "no_host_1" WGS sample record and verify values and data types
    // 6. Observe "no_host_2" WGS sample record and verify values and data types
    for (const sampleName of WGS_SAMPLE_NAMES) {
      // "no_host_x" DATA
      const noHostData = samplesTableOrderByName[sampleName];
      const expectedData = expectedColumnData[sampleName];

      expect(noHostData[GC_CONTENT_LABEL]).toEqual(
        expectedData[GC_CONTENT_LABEL],
      );
      expect(noHostData["SNPs"]).toEqual(expectedData["SNPs"]);
      expect(noHostData["%id"]).toEqual(expectedData["%id"]);
      expect(noHostData[INFORMATIVE_NUCLEOTIDES_LABEL]).toEqual(
        expectedData[INFORMATIVE_NUCLEOTIDES_LABEL],
      );
      expect(noHostData[GENOME_CALLED_LABEL]).toEqual(
        expectedData[GENOME_CALLED_LABEL],
      );
      expect(noHostData[MISSING_BASES_LABEL]).toEqual(
        expectedData[MISSING_BASES_LABEL],
      );
      expect(noHostData[AMBIGUOUS_BASES_LABEL]).toEqual(
        expectedData[AMBIGUOUS_BASES_LABEL],
      );
      expect(noHostData[REFERENCE_ACCESSION_LENGTH_LABEL]).toEqual(
        expectedData[REFERENCE_ACCESSION_LENGTH_LABEL],
      );
      expect(noHostData[COVERAGE_DEPTH_LABEL]).toEqual(
        expectedData[COVERAGE_DEPTH_LABEL],
      );
    }
    // #endregion Observe "no_host_x" WGS sample record and verify values and data types
  });

  test("SNo 34: Data report validation (ERCC Only) JAN", async ({ page }) => {
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject("Test_SNo_34");
    await projectPage.deleteSamplesOlderThanGivenMonths(
      project,
      WORKFLOWS.WGS,
      5,
    );
    await setupSamples(
      page,
      project,
      WGS_SAMPLE_FILES,
      WGS_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      { hostOrganism: "ERCC Only", taxon: "Unknown", waitForPipeline: true },
    );

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
      const actualConsensusGenomeData =
        await samplesPage.getIsMyConsensusGenomeCompleteTable();
      const expectedConsensusGenomeData =
        expectedDataERCCOnly[sampleName]["ConsensusGenomeData"];
      expect(actualConsensusGenomeData).toEqual(expectedConsensusGenomeData);
      // #endregion 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data

      // #region 6. Verify Consensus Genome Pipeline version
      const expectedPipelineRegex = new RegExp(
        `Consensus Genome Pipeline v${expectedDataERCCOnly[sampleName]["PipelineVersion"]}.\\d+.\\d+`,
      );
      const actualPipelineVersion = await samplesPage.getPipelineVersion();
      expect(actualPipelineVersion).toMatch(expectedPipelineRegex);
      // #endregion 6. Verify Consensus Genome Pipeline version

      // #region 7. Hover over "How good is the coverage?" histogram
      const expectedReferenceLength =
        expectedDataERCCOnly[sampleName]["ReferenceLength"];
      const actualReferenceLength = await samplesPage.getReferenceLength();
      expect(actualReferenceLength).toEqual(expectedReferenceLength);

      const expectedCoverageDept =
        expectedDataERCCOnly[sampleName]["CoverageDept"];
      const actualCoverageDept = await samplesPage.getCoverageDept();
      expect(actualCoverageDept).toEqual(expectedCoverageDept);

      const expectedCoverageBreadth =
        expectedDataERCCOnly[sampleName]["CoverageBreadth"];
      const actualCoverageBreadth = await samplesPage.getCoverageBreadth();
      expect(actualCoverageBreadth).toEqual(expectedCoverageBreadth);

      await samplesPage.hoverOverCoverageVizHistogram();

      // Base Pair Range - integer - integer
      const expectedHoverBasePairRange = /[0-9]+–[0-9]+/;
      const actualHoverBasePairRange =
        await samplesPage.getHoverBasePairRange();
      expect(actualHoverBasePairRange).toMatch(expectedHoverBasePairRange);

      // Coverage Depth - decimal (followed by ""x"")
      const expectedHoverCoverageDepth = /\d+\.\d+x/;
      const actualHoverCoverageDepth =
        await samplesPage.getHoverCoverageDepth();
      expect(actualHoverCoverageDepth).toMatch(expectedHoverCoverageDepth);

      // Coverage Breadth - percentage (0-100% range)
      const expectedHoverCoverageBreadth = /\d{1,3}\.\d{1}%/;
      const actualHoverCoverageBreadth =
        await samplesPage.getHoverCoverageBreadth();
      expect(actualHoverCoverageBreadth).toMatch(expectedHoverCoverageBreadth);
      // #endregion 7. Hover over "How good is the coverage?" histogram

      // #region 8. Click on Sample Details link and verify Metadata - Host is "Human"
      await samplesPage.clickSampleDetailsButton();
      const expectedMetadataHost = "ERCC only";
      const actualMetadataHost =
        await samplesPage.getSampleDetailsMetadataHost();
      expect(actualMetadataHost).toEqual(expectedMetadataHost);
      // #endregion 8. Click on Sample Details link and verify Metadata - Host is "Human"

      // #region 9. Go back to "x" CG sample list and cliick on "no_host_x" WGS sample
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
      // #endregion 9. Go back to "floo sp95b" CG sample list and cliick on "no_host_x" WGS sample

      // 10. Repeat steps 5-8
    }
  });

  test("SNo 35: Data report validation (Human) - Chikungunya virus (species) JAN", async ({
    page,
  }) => {
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject("Test_SNo_35");
    await projectPage.deleteSamplesOlderThanGivenMonths(
      project,
      WORKFLOWS.WGS,
      5,
    );
    await setupSamples(
      page,
      project,
      WGS_SAMPLE_FILES,
      WGS_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      { hostOrganism: "Human", taxon: CHIKUNGUNYA_VIRUS, waitForPipeline: true },
    );

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select "x" project
    await projectPage.getProjectByName(project.name);
    // #endregion 2. At Project tab, select "x" project

    // #region 3. Select "Consensus Genomes" tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 3. Select "Consensus Genomes" tab

    for (const sampleName of WGS_SAMPLE_NAMES) {
      expectedData[sampleName]["ConsensusGenomeData"][0]["Taxon"] =
        CHIKUNGUNYA_VIRUS;
    }
    const expectedDataChikungunyaVirus = expectedData;
    const samplesPage = new SamplesPage(page);
    for (const sampleName of Object.keys(expectedDataChikungunyaVirus)) {
      // #region 4. Click on "no_host_x" WGS sample
      await projectPage.clickSample(sampleName);
      await samplesPage.clickConsensusGenomeTab();
      // #endregion 4. Click on "no_host_x" WGS sample

      // #region 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data
      const actualConsensusGenomeData =
        await samplesPage.getIsMyConsensusGenomeCompleteTable();
      const expectedConsensusGenomeData =
        expectedDataChikungunyaVirus[sampleName]["ConsensusGenomeData"];
      expect(actualConsensusGenomeData).toEqual(expectedConsensusGenomeData);
      // #endregion 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data

      // #region 6. Verify Consensus Genome Pipeline version
      const expectedPipelineRegex = new RegExp(
        `Consensus Genome Pipeline v${expectedDataChikungunyaVirus[sampleName]["PipelineVersion"]}.\\d+.\\d+`,
      );
      const actualPipelineVersion = await samplesPage.getPipelineVersion();
      expect(actualPipelineVersion).toMatch(expectedPipelineRegex);
      // #endregion 6. Verify Consensus Genome Pipeline version

      // #region 7. Hover over "How good is the coverage?" histogram
      const expectedReferenceLength =
        expectedDataChikungunyaVirus[sampleName]["ReferenceLength"];
      const actualReferenceLength = await samplesPage.getReferenceLength();
      expect(actualReferenceLength).toEqual(expectedReferenceLength);

      const expectedCoverageDept =
        expectedDataChikungunyaVirus[sampleName]["CoverageDept"];
      const actualCoverageDept = await samplesPage.getCoverageDept();
      expect(actualCoverageDept).toEqual(expectedCoverageDept);

      const expectedCoverageBreadth =
        expectedDataChikungunyaVirus[sampleName]["CoverageBreadth"];
      const actualCoverageBreadth = await samplesPage.getCoverageBreadth();
      expect(actualCoverageBreadth).toEqual(expectedCoverageBreadth);

      await samplesPage.hoverOverCoverageVizHistogram();

      // Base Pair Range - integer - integer
      const expectedHoverBasePairRange = /[0-9]+–[0-9]+/;
      const actualHoverBasePairRange =
        await samplesPage.getHoverBasePairRange();
      expect(actualHoverBasePairRange).toMatch(expectedHoverBasePairRange);

      // Coverage Depth - decimal (followed by ""x"")
      const expectedHoverCoverageDepth = /\d+\.\d+x/;
      const actualHoverCoverageDepth =
        await samplesPage.getHoverCoverageDepth();
      expect(actualHoverCoverageDepth).toMatch(expectedHoverCoverageDepth);

      // Coverage Breadth - percentage (0-100% range)
      const expectedHoverCoverageBreadth = /\d{1,3}\.\d{1}%/;
      const actualHoverCoverageBreadth =
        await samplesPage.getHoverCoverageBreadth();
      expect(actualHoverCoverageBreadth).toMatch(expectedHoverCoverageBreadth);
      // #endregion 7. Hover over "How good is the coverage?" histogram

      // #region 8. Click on Sample Details link and verify Metadata - Host is "Human"
      await samplesPage.clickSampleDetailsButton();
      const expectedMetadataHost = "Human";
      const actualMetadataHost =
        await samplesPage.getSampleDetailsMetadataHost();
      expect(actualMetadataHost).toEqual(expectedMetadataHost);
      // #endregion 8. Click on Sample Details link and verify Metadata - Host is "Human"

      // #region 9. Go back to "x" CG sample list and cliick on "no_host_x" WGS sample
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
      // #endregion 9. Go back to "floo sp95b" CG sample list and cliick on "no_host_x" WGS sample

      // 10. Repeat steps 5-8
    }
  });

  test("SNo 36: Data report validation (ERCC Only) - Chikungunya virus (species) JAN", async ({
    page,
  }) => {
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject("Test_SNo_36");
    await projectPage.deleteSamplesOlderThanGivenMonths(
      project,
      WORKFLOWS.WGS,
      5,
    );
    await setupSamples(
      page,
      project,
      WGS_SAMPLE_FILES,
      WGS_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      { hostOrganism: "ERCC Only", taxon: CHIKUNGUNYA_VIRUS, waitForPipeline: true },
    );

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select "x" project
    await projectPage.getProjectByName(project.name);
    // #endregion 2. At Project tab, select "x" project

    // #region 3. Select "Consensus Genomes" tab
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 3. Select "Consensus Genomes" tab

    for (const sampleName of WGS_SAMPLE_NAMES) {
      expectedData[sampleName]["ConsensusGenomeData"][0]["Taxon"] =
        CHIKUNGUNYA_VIRUS;
    }
    const expectedDataERCCOnlyChikungunyaVirus = expectedData;
    const samplesPage = new SamplesPage(page);
    for (const sampleName of Object.keys(
      expectedDataERCCOnlyChikungunyaVirus,
    )) {
      // #region 4. Click on "no_host_x" WGS sample
      await projectPage.clickSample(sampleName);
      await samplesPage.clickConsensusGenomeTab();
      // #endregion 4. Click on "no_host_x" WGS sample

      // #region 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data
      const actualConsensusGenomeData =
        await samplesPage.getIsMyConsensusGenomeCompleteTable();
      const expectedConsensusGenomeData =
        expectedDataERCCOnlyChikungunyaVirus[sampleName]["ConsensusGenomeData"];
      expect(actualConsensusGenomeData).toEqual(expectedConsensusGenomeData);
      // #endregion 5. Verify "Is my consensuos genome complete?" and "How good is the coverage?" section data

      // #region 6. Verify Consensus Genome Pipeline version
      const expectedPipelineRegex = new RegExp(
        `Consensus Genome Pipeline v${expectedDataERCCOnlyChikungunyaVirus[sampleName]["PipelineVersion"]}.\\d+.\\d+`,
      );
      const actualPipelineVersion = await samplesPage.getPipelineVersion();
      expect(actualPipelineVersion).toMatch(expectedPipelineRegex);
      // #endregion 6. Verify Consensus Genome Pipeline version

      // #region 7. Hover over "How good is the coverage?" histogram
      const expectedReferenceLength =
        expectedDataERCCOnlyChikungunyaVirus[sampleName]["ReferenceLength"];
      const actualReferenceLength = await samplesPage.getReferenceLength();
      expect(actualReferenceLength).toEqual(expectedReferenceLength);

      const expectedCoverageDept =
        expectedDataERCCOnlyChikungunyaVirus[sampleName]["CoverageDept"];
      const actualCoverageDept = await samplesPage.getCoverageDept();
      expect(actualCoverageDept).toEqual(expectedCoverageDept);

      const expectedCoverageBreadth =
        expectedDataERCCOnlyChikungunyaVirus[sampleName]["CoverageBreadth"];
      const actualCoverageBreadth = await samplesPage.getCoverageBreadth();
      expect(actualCoverageBreadth).toEqual(expectedCoverageBreadth);

      await samplesPage.hoverOverCoverageVizHistogram();

      // Base Pair Range - integer - integer
      const expectedHoverBasePairRange = /[0-9]+–[0-9]+/;
      const actualHoverBasePairRange =
        await samplesPage.getHoverBasePairRange();
      expect(actualHoverBasePairRange).toMatch(expectedHoverBasePairRange);

      // Coverage Depth - decimal (followed by ""x"")
      const expectedHoverCoverageDepth = /\d+\.\d+x/;
      const actualHoverCoverageDepth =
        await samplesPage.getHoverCoverageDepth();
      expect(actualHoverCoverageDepth).toMatch(expectedHoverCoverageDepth);

      // Coverage Breadth - percentage (0-100% range)
      const expectedHoverCoverageBreadth = /\d{1,3}\.\d{1}%/;
      const actualHoverCoverageBreadth =
        await samplesPage.getHoverCoverageBreadth();
      expect(actualHoverCoverageBreadth).toMatch(expectedHoverCoverageBreadth);
      // #endregion 7. Hover over "How good is the coverage?" histogram

      // #region 8. Click on Sample Details link and verify Metadata - Host is "Human"
      await samplesPage.clickSampleDetailsButton();
      const expectedMetadataHost = "ERCC only";
      const actualMetadataHost =
        await samplesPage.getSampleDetailsMetadataHost();
      expect(actualMetadataHost).toEqual(expectedMetadataHost);
      // #endregion 8. Click on Sample Details link and verify Metadata - Host is "Human"

      // #region 9. Go back to "x" CG sample list and cliick on "no_host_x" WGS sample
      await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
      // #endregion 9. Go back to "floo sp95b" CG sample list and cliick on "no_host_x" WGS sample

      // 10. Repeat steps 5-8
    }
  });
});
