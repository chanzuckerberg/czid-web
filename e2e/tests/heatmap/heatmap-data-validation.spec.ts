import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

const KLEBSIELLA_PNEUMONIAE = "Klebsiella pneumoniae";
const SEVERE_ACUTE_RESPIRATORY_SYNDROME_RELATED_CORONAVIRUS =
  "Severe acute respiratory syndrome-related coronavirus";

const TEST_TIMEOUT = 60 * 1000 * 40;

let project = null;
let samples = [];
let sampleNames = [];

test.describe("Data report validation (Heatmap)", () => {
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(TEST_TIMEOUT);
    // If testing is on other enviorement and data is not avaliable.
    // 1. Login to CZ ID staging
    // 2. Click on add data
    // 3. Add new project
    // 4. append the files located on the data folder under heatmap
    // 5. Wait till upload is comleted.
    // 6. Select RR004_water_2_S23A, sample2, sample1, SRR7002140_TA.252.DNA_blaC_vanP, & SRR7002116_TA.257.DNA
    // 7. Click on Create heatmap."

    const page = await browser.newPage();
    const projectPage = new ProjectPage(page);
    project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}_SNo_34`,
    );
    // "RR004_water_2_S23A
    // sample2
    // sample1
    // SRR7002140_TA.252.DNA_blaC_vanP
    // SRR7002116_TA.257.DNA

    // Can be located on:
    // https://drive.google.com/drive/folders/1qT3rAlcr-VRDUBwehGvos_EYpDTWRQmZ"
    // RR004_water_2_S23A,
    const RR004_water_2_S23A = (
      await setupSamples(
        page,
        project,
        ["RR004_water_2_S23A_R1.fastq", "RR004_water_2_S23A_R2.fastq"],
        ["RR004_water_2_S23A"],
        WORKFLOWS.MNGS,
        {
          runPipeline: false,
          hostOrganism: "Human",
          sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
          waitForPipeline: false,
        },
      )
    )[0];
    // sample2,
    const sample2 = (
      await setupSamples(
        page,
        project,
        ["sample2_R2_001.fastq"],
        ["sample2"],
        WORKFLOWS.MNGS,
        {
          runPipeline: false,
          hostOrganism: "Human",
          sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
          waitForPipeline: false,
        },
      )
    )[0];
    // sample1,
    const sample1 = (
      await setupSamples(
        page,
        project,
        ["sample1_R1_001.fastq"],
        ["sample1"],
        WORKFLOWS.MNGS,
        {
          runPipeline: false,
          hostOrganism: "Human",
          sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
          waitForPipeline: false,
        },
      )
    )[0];
    // SRR7002140_TA.252.DNA_blaC_vanP
    const SRR7002140_TA = (
      await setupSamples(
        page,
        project,
        [
          "SRR7002140_TA.252.DNA_blaC_vanP_R1.fastq.gz",
          "SRR7002140_TA.252.DNA_blaC_vanP_R2.fastq.gz",
        ],
        ["SRR7002140_TA.252.DNA_blaC_vanP"],
        WORKFLOWS.MNGS,
        {
          runPipeline: false,
          hostOrganism: "Human",
          sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
          waitForPipeline: false,
        },
      )
    )[0];
    // SRR7002116_TA.257.DNA
    const SRR7002116_TA = (
      await setupSamples(
        page,
        project,
        [
          "SRR7002116_TA.257.DNA_R1.fastq.gz",
          "SRR7002116_TA.257.DNA_R2.fastq.gz",
        ],
        ["SRR7002116_TA.257.DNA"],
        WORKFLOWS.MNGS,
        {
          runPipeline: false,
          hostOrganism: "Human",
          sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
          waitForPipeline: true,
        },
      )
    )[0];
    sampleNames = [
      RR004_water_2_S23A.name,
      sample2.name,
      sample1.name,
      SRR7002140_TA.name,
      SRR7002116_TA.name,
    ];
    samples = [
      RR004_water_2_S23A,
      sample2,
      sample1,
      SRR7002140_TA,
      SRR7002116_TA,
    ];
    await projectPage.waitForSamplesComplete(
      project.id,
      WORKFLOWS.MNGS,
      sampleNames,
    );

    await page.close();
  });

  test("SNo 34-A: Data report validation (Heatmap)", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    // "If testing on Staging:
    const projectPage = new ProjectPage(page);
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select """"Heatmap Stress Testing"""" project
    project = await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 2. At Project tab, select """"Heatmap Stress Testing"""" project

    // #region 3. Select
    for (const sampleName of sampleNames) {
      await projectPage.clickSampleCheckbox(sampleName);
    }
    // #endregion 3. Select

    // #region 4. Click on Create heatmap.
    await projectPage.clickHeatmapButton();

    const heatmapPage = await projectPage.clickTaxonHeatmap();
    await heatmapPage.dismissAppcuesContainerIfPresent();
    // #endregion 4. Click on Create heatmap.

    // #region 5. Heatmap values displayed:

    // Five Columns Should be displayed
    // RR004_water_2_S23A, sample2, sample1, SRR7002140_TA.252.DNA_blaC_vanP, & SRR7002116_TA.257.DNA
    // [Text on top should always include the first and last characters, other characters can be trimmed for space]
    const heatmapSamples = await heatmapPage.getSamplesFromUrl();
    const heatmapSampleNames = heatmapSamples.map(s => s.name);
    expect(heatmapSampleNames).toEqual(sampleNames);

    // Hovering over squares should display information.

    // On Collection location Value Should be Texas an purple if on staging, on any other enviorment the information should match that provided on upload.
    for (let i = 0; i < samples.length; i++) {
      await heatmapPage.hoverOverCollectionLocation(i);
      const collectionLocation = await heatmapPage.getTooltipText();

      expect(collectionLocation).toEqual(
        samples[i].details.metadata.collection_location_v2,
      );
    }
    // #endregion 5. Heatmap values displayed:

    // #region 6. Get taxon info for all Klebsiella pneumoniae cells
    const klebsiellaPneumoniaeRowYAxisValue =
      await heatmapPage.getYAxisValueForTaxonName(KLEBSIELLA_PNEUMONIAE);
    const klebsiellaAxis = `[y='${klebsiellaPneumoniaeRowYAxisValue}']`;

    // Make sure there are 3 cells in Klebsiella pneumoniae row
    const NUM_EXPECTED_KLEBSIELLA_CELLS = 3;
    await heatmapPage.assertExpectedNumberOfCells(
      klebsiellaAxis,
      NUM_EXPECTED_KLEBSIELLA_CELLS,
    );

    const taxonInfoForKlebsiella =
      await heatmapPage.getTaxonInfoForAllCellsInRow(
        NUM_EXPECTED_KLEBSIELLA_CELLS,
        klebsiellaAxis,
      );

    // #endregion 6. Get taxon info for all Klebsiella pneumoniae cells

    // On hover over Row Klebsiella pneumoniae and  SRR7002140_TA.252.DNA_blaC_vanP pop up data is consistent with below values and data types:
    // NT Z Score: 98.9382 Float
    // NT rPM: 582.487 Float
    // NT r (total reads): 18 Float
    // NR Z Score: 45.5214 Float
    // NR rPM: 1779.82 Float
    // NR r (total reads): 55 Integer
    const EXPECTED_SRR7002140_TA_252_DNA_BLAC_VANP_KLEBSIELLA_PNEUMONIAE = {
      Sample: "SRR7002140_TA.252.DNA_blaC_vanP",
      Taxon: KLEBSIELLA_PNEUMONIAE,
      Category: "Bacteria",
      "NT Z Score": "-",
      "NT rPM": "517.766",
      "NT r (total reads)": "16",
      "NR Z Score": "-",
      "NR rPM": "2427.03",
      "NR r (total reads)": "75",
    };

    const SRR7002140_TA_KLEBSIELLA_PNEUMONIAE_INFO =
      taxonInfoForKlebsiella.find(
        taxonInfo =>
          taxonInfo.Sample ===
          EXPECTED_SRR7002140_TA_252_DNA_BLAC_VANP_KLEBSIELLA_PNEUMONIAE.Sample,
      );
    expect(SRR7002140_TA_KLEBSIELLA_PNEUMONIAE_INFO).toEqual(
      EXPECTED_SRR7002140_TA_252_DNA_BLAC_VANP_KLEBSIELLA_PNEUMONIAE,
    );

    // On hover over Row Klebsiella pneumoniae and SRR7002116_TA.257.DNA pop up data is consistent with below values and data types:

    // NT Z Score: 99 Float
    // NT rPM: 9174.31 Float
    // NT r (total reads): 10 Float
    // NR Z Score: 99 Float
    // NR rPM: 127523 Float
    // NR r (total reads): 139 Integer"
    const EXPECTED_SRR7002116_TA_257_DNA_KLEBSIELLA_PNEUMONIAE = {
      Sample: "SRR7002116_TA.257.DNA",
      Taxon: KLEBSIELLA_PNEUMONIAE,
      Category: "Bacteria",
      "NT Z Score": "-",
      "NT rPM": "11009.2",
      "NT r (total reads)": "12",
      "NR Z Score": "-",
      "NR rPM": "118349",
      "NR r (total reads)": "129",
    };

    const SRR7002116_TA_KLEBSIELLA_PNEUMONIAE_INFO =
      taxonInfoForKlebsiella.find(
        taxonInfo =>
          taxonInfo.Sample ===
          EXPECTED_SRR7002116_TA_257_DNA_KLEBSIELLA_PNEUMONIAE.Sample,
      );
    expect(SRR7002116_TA_KLEBSIELLA_PNEUMONIAE_INFO).toEqual(
      EXPECTED_SRR7002116_TA_257_DNA_KLEBSIELLA_PNEUMONIAE,
    );
    // #endregion Heatmap values displayed:
  });

  test("SNo 34-B: Data report validation (Heatmap)", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    // "If testing on Staging:
    const projectPage = new ProjectPage(page);
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select """"Heatmap Stress Testing"""" project
    project = await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 2. At Project tab, select """"Heatmap Stress Testing"""" project

    // #region 3. Select RR004_water_2_S23A, sample2, sample1, SRR7002140_TA.252.DNA_blaC_vanP, & SRR7002116_TA.257.DNA
    for (const sampleName of sampleNames) {
      await projectPage.clickSampleCheckbox(sampleName);
    }
    // #endregion 3. Select RR004_water_2_S23A, sample2, sample1, SRR7002140_TA.252.DNA_blaC_vanP, & SRR7002116_TA.257.DNA

    // #region 4. Click on Create heatmap.
    await projectPage.clickHeatmapButton();

    const heatmapPage = await projectPage.clickTaxonHeatmap();
    await heatmapPage.dismissAppcuesContainerIfPresent();
    // #endregion 4. Click on Create heatmap.

    // #region Heatmap values displayed:

    // Five Columns Should be displayed
    // RR004_water_2_S23A, sample2, sample1, SRR7002140_TA.252.DNA_blaC_vanP, & SRR7002116_TA.257.DNA
    // [Text on top should always include the first and last characters, other characters can be trimmed for space]
    const heatmapSamples = await heatmapPage.getSamplesFromUrl();
    const heatmapSampleNames = heatmapSamples.map(s => s.name);
    expect(heatmapSampleNames).toEqual(sampleNames);

    // Hovering over squares should display information.

    // On Collection location Value Should be Texas an purple if on staging, on any other enviorment the information should match that provided on upload.
    for (let i = 0; i < samples.length; i++) {
      await heatmapPage.hoverOverCollectionLocation(i);
      const collectionLocation = await heatmapPage.getTooltipText();

      expect(collectionLocation).toEqual(
        samples[i].details.metadata.collection_location_v2,
      );
    }

    // Get heatmap row info for Klebsiella pneumoniae
    const klebsiellaPneumoniaeRowYAxisValue =
      await heatmapPage.getYAxisValueForTaxonName(KLEBSIELLA_PNEUMONIAE);
    const klebsiellaAxis = `[y='${klebsiellaPneumoniaeRowYAxisValue}']`;

    // Make sure there are 3 cells in Klebsiella pneumoniae row
    const NUM_EXPECTED_KLEBSIELLA_CELLS = 3;
    await heatmapPage.assertExpectedNumberOfCells(
      klebsiellaAxis,
      NUM_EXPECTED_KLEBSIELLA_CELLS,
    );

    const taxonInfoForKlebsiella =
      await heatmapPage.getTaxonInfoForAllCellsInRow(
        NUM_EXPECTED_KLEBSIELLA_CELLS,
        klebsiellaAxis,
      );

    // On hover over Row Klebsiella pneumoniae and  RR004_water_2_S23A pop up data is consistent with below values and data types:

    // NT Z Score: 99 Float
    // NT rPM: 197861Float
    // NT r (total reads): 222 Float
    // NR Z Score: 99 Float
    // NR rPM: 179144 Float
    // NR r (total reads): 201 Integer
    const EXPECTED_RR004_water_2_S23A_KLEBSIELLA_PNEUMONIAE = {
      Sample: "RR004_water_2_S23A",
      Taxon: KLEBSIELLA_PNEUMONIAE,
      Category: "Bacteria",
      "NT Z Score": "-",
      "NT rPM": "195187",
      "NT r (total reads)": "219",
      "NR Z Score": "-",
      "NR rPM": "168449",
      "NR r (total reads)": "189",
    };
    const RR004_water_2_S23A_KLEBSIELLA_PNEUMONIAE_INFO =
      taxonInfoForKlebsiella.find(
        taxonInfo =>
          taxonInfo.Sample ===
          EXPECTED_RR004_water_2_S23A_KLEBSIELLA_PNEUMONIAE.Sample,
      );
    expect(RR004_water_2_S23A_KLEBSIELLA_PNEUMONIAE_INFO).toEqual(
      EXPECTED_RR004_water_2_S23A_KLEBSIELLA_PNEUMONIAE,
    );

    // #region 7. Get taxon info for all SARS-Cov cells
    const sarsCovRowYAxisValue = await heatmapPage.getYAxisValueForTaxonName(
      SEVERE_ACUTE_RESPIRATORY_SYNDROME_RELATED_CORONAVIRUS,
    );
    const sarsCovAxis = `[y='${sarsCovRowYAxisValue}']`;

    // Make sure there are 2 cells in SARS-Cov row
    const NUM_EXPECTED_SARS_COV_CELLS = 2;
    await heatmapPage.assertExpectedNumberOfCells(
      sarsCovAxis,
      NUM_EXPECTED_SARS_COV_CELLS,
    );

    const taxonInfoForSarsCov = await heatmapPage.getTaxonInfoForAllCellsInRow(
      NUM_EXPECTED_SARS_COV_CELLS,
      sarsCovAxis,
    );
    // endregion 7. Get taxon info for all SARS-Cov cells

    // On hover over Row Severe acute respiratory syndrome-related coronavirus and sample1, sample2 pop up data is consistent with below values and data types:

    // NT Z Score: 100 Float
    // NT rPM: 999904 Float
    // NT r (total reads): 93713 Float
    // NR Z Score: 100 Float
    // NR rPM: 999563 Float
    // NR r (total reads): 93681 Integer"
    const EXPECTED_SAMPLE2_ACUTE_RESPIRATORY_SYNDROME = {
      Sample: "sample2",
      Taxon: SEVERE_ACUTE_RESPIRATORY_SYNDROME_RELATED_CORONAVIRUS,
      Category: "Viruses",
      "NT Z Score": "-",
      "NT rPM": "999904",
      "NT r (total reads)": "93713",
      "NR Z Score": "-",
      "NR rPM": "999541",
      "NR r (total reads)": "93679",
    };
    const SAMPLE2_ACUTE_RESPIRATORY_SYNDROME_INFO = taxonInfoForSarsCov.find(
      taxonInfo =>
        taxonInfo.Sample === EXPECTED_SAMPLE2_ACUTE_RESPIRATORY_SYNDROME.Sample,
    );
    expect(SAMPLE2_ACUTE_RESPIRATORY_SYNDROME_INFO).toEqual(
      EXPECTED_SAMPLE2_ACUTE_RESPIRATORY_SYNDROME,
    );

    const EXPECTED_SAMPLE1_ACUTE_RESPIRATORY_SYNDROME = {
      Sample: "sample1",
      Taxon: SEVERE_ACUTE_RESPIRATORY_SYNDROME_RELATED_CORONAVIRUS,
      Category: "Viruses",
      "NT Z Score": "-",
      "NT rPM": "999904",
      "NT r (total reads)": "93713",
      "NR Z Score": "-",
      "NR rPM": "999146",
      "NR r (total reads)": "93642",
    };
    const SAMPLE1_ACUTE_RESPIRATORY_SYNDROME_INFO = taxonInfoForSarsCov.find(
      taxonInfo =>
        taxonInfo.Sample === EXPECTED_SAMPLE1_ACUTE_RESPIRATORY_SYNDROME.Sample,
    );
    expect(SAMPLE1_ACUTE_RESPIRATORY_SYNDROME_INFO).toEqual(
      EXPECTED_SAMPLE1_ACUTE_RESPIRATORY_SYNDROME,
    );
    // #endregion Heatmap values displayed:
  });

  test("SNo 34-C: Data report validation (Heatmap)", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    // "If testing on Staging:
    const projectPage = new ProjectPage(page);
    // #endregion 1. Login to CZ ID staging

    // #region 2. At Project tab, select """"Heatmap Stress Testing"""" project
    project = await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 2. At Project tab, select """"Heatmap Stress Testing"""" project

    // #region 3. Select RR004_water_2_S23A, sample2, sample1, SRR7002140_TA.252.DNA_blaC_vanP, & SRR7002116_TA.257.DNA
    for (const sampleName of sampleNames) {
      await projectPage.clickSampleCheckbox(sampleName);
    }
    // #endregion 3. Select RR004_water_2_S23A, sample2, sample1, SRR7002140_TA.252.DNA_blaC_vanP, & SRR7002116_TA.257.DNA

    // #region 4. Click on Create heatmap.
    await projectPage.clickHeatmapButton();

    const heatmapPage = await projectPage.clickTaxonHeatmap();
    await heatmapPage.dismissAppcuesContainerIfPresent();
    // #endregion 4. Click on Create heatmap.

    // #region 5. Heatmap values displayed:

    // Five Columns Should be displayed
    // RR004_water_2_S23A, sample2, sample1, SRR7002140_TA.252.DNA_blaC_vanP, & SRR7002116_TA.257.DNA
    // [Text on top should always include the first and last characters, other characters can be trimmed for space]
    const heatmapSamples = await heatmapPage.getSamplesFromUrl();
    const heatmapSampleNames = heatmapSamples.map(s => s.name);
    expect(heatmapSampleNames).toEqual(sampleNames);

    // Hovering over squares should display information.

    // On Collection location Value Should be Texas an purple if on staging, on any other enviorment the information should match that provided on upload.
    for (let i = 0; i < samples.length; i++) {
      await heatmapPage.hoverOverCollectionLocation(i);
      const collectionLocation = await heatmapPage.getTooltipText();

      expect(collectionLocation).toEqual(
        samples[i].details.metadata.collection_location_v2,
      );
    }
    // #endregion 5. Heatmap values displayed:

    // #region 6. Get taxon info for all SARS-Cov cells
    const sarsCovRowYAxisValue = await heatmapPage.getYAxisValueForTaxonName(
      SEVERE_ACUTE_RESPIRATORY_SYNDROME_RELATED_CORONAVIRUS,
    );
    const sarsCovAxis = `[y='${sarsCovRowYAxisValue}']`;

    // Make sure there are 2 cells in SARS-Cov row
    const NUM_EXPECTED_SARS_COV_CELLS = 2;
    await heatmapPage.assertExpectedNumberOfCells(
      sarsCovAxis,
      NUM_EXPECTED_SARS_COV_CELLS,
    );

    const taxonInfoForSarsCov = await heatmapPage.getTaxonInfoForAllCellsInRow(
      NUM_EXPECTED_SARS_COV_CELLS,
      sarsCovAxis,
    );
    // endregion 6. Get taxon info for all SARS-Cov cells

    // On hover over Row Severe acute respiratory syndrome-related coronavirus and Sample2 pop up data is consistent with below values and data types:

    // NT Z Score: 100 Float
    // NT rPM: 999904 Float
    // NT r (total reads): 93713 Float
    // NR Z Score: 100 Float
    // NR rPM: 999637 Float
    // NR r (total reads): 93688 Integer"
    const EXPECTED_SAMPLE2_ACUTE_RESPIRATORY_SYNDROME = {
      Sample: "sample2",
      Taxon: SEVERE_ACUTE_RESPIRATORY_SYNDROME_RELATED_CORONAVIRUS,
      Category: "Viruses",
      "NT Z Score": "-",
      "NT rPM": "999904",
      "NT r (total reads)": "93713",
      "NR Z Score": "-",
      "NR rPM": "999541",
      "NR r (total reads)": "93679",
    };
    const SAMPLE2_ACUTE_RESPIRATORY_SYNDROME = taxonInfoForSarsCov.find(
      taxonInfo =>
        taxonInfo.Sample === EXPECTED_SAMPLE2_ACUTE_RESPIRATORY_SYNDROME.Sample,
    );
    expect(SAMPLE2_ACUTE_RESPIRATORY_SYNDROME).toEqual(
      EXPECTED_SAMPLE2_ACUTE_RESPIRATORY_SYNDROME,
    );

    const EXPECTED_SAMPLE1_ACUTE_RESPIRATORY_SYNDROME = {
      Sample: "sample1",
      Taxon: SEVERE_ACUTE_RESPIRATORY_SYNDROME_RELATED_CORONAVIRUS,
      Category: "Viruses",
      "NT Z Score": "-",
      "NT rPM": "999904",
      "NT r (total reads)": "93713",
      "NR Z Score": "-",
      "NR rPM": "999146",
      "NR r (total reads)": "93642",
    };
    const SAMPLE1_ACUTE_RESPIRATORY_SYNDROME = taxonInfoForSarsCov.find(
      taxonInfo =>
        taxonInfo.Sample === EXPECTED_SAMPLE1_ACUTE_RESPIRATORY_SYNDROME.Sample,
    );
    expect(SAMPLE1_ACUTE_RESPIRATORY_SYNDROME).toEqual(
      EXPECTED_SAMPLE1_ACUTE_RESPIRATORY_SYNDROME,
    );
    // #endregion Heatmap values displayed:
  });
});
