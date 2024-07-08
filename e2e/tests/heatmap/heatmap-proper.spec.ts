import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

const TEST_TIMEOUT = 60 * 1000 * 40;


test.describe("Heatmap Proper", () => {

  test("SNo 7: Filters", async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region Setup
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}_SNo_7`);

    // "H2002_HiSeq30X_Short
    // https://drive.google.com/drive/folders/13FsG7qEJgZfsvAL1CccIPxqTFvvqvNUh
    await setupSamples(
      page,
      project,
      ["T2T_H2002_HiSeq30X_short.fastq"],
      ["T2T_H2002_HiSeq30X_short"],
      WORKFLOWS.MNGS,
      {
        runPipeline: true,
        hostOrganism: "Human",
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        waitForPipeline: false,
      },
    );
    // RR004_water_2_S23A_R1.fastq
    // https://drive.google.com/file/d/1JRUbO6_jb_xytFUvFEqHWrTKrtP9NNOi/view?usp=drive_link"
    const RR004_water_2_S23A = "RR004_water_2_S23A";
    await setupSamples(
      page,
      project,
      ["RR004_water_2_S23A_R1.fastq"],
      [RR004_water_2_S23A],
      WORKFLOWS.MNGS,
      {
        runPipeline: true,
        hostOrganism: "Human",
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        waitForPipeline: false,
      },
    );
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion Setup

    // #region Load A Taxon heat map.
    await projectPage.selectCompletedSamples(2);
    await projectPage.clickHeatmapButton();

    const heatmapPage = await projectPage.clickTaxonHeatmap();
    await heatmapPage.dismissAppcuesContainerIfPresent();
    // #endregion Load A Taxon heat map.

    // #region For Each Filter Option Add A value of the filter.
    await heatmapPage.setCategoryOption("Bacteria");

    // Add a filter NT rPM >= 5000
    await heatmapPage.setThresholdsOptions({value: "5000"});

    // Known Patogens Only = on
    await heatmapPage.clickKnownPathogensOnlyCheckbox();
    // #endregion For Each Filter Option Add A value of the filter.

    // #region heatmap should be updated to display the changes
    // There should be only four squares on scrreen, of which only two should have data.
    const cellsCount = await heatmapPage.getCellsCount();
    expect(cellsCount).toEqual(2);

    let taxonData = [];
    for (let i = 0; i < cellsCount; i++) {
      await heatmapPage.hoverOverCell(i);
      taxonData.push(await heatmapPage.getTaxonInfo());
    }
    taxonData = taxonData.sort((a,b) => b.Taxon.localeCompare(a.Taxon));
    // INFO
    // Sample: RR004_water_2_S23A
    // Taxon: Escherichia coli
    // Category: Bacteria
    // VALUES
    // NT Z Score: -
    // NT rPM: 12477.7
    // NT r (total reads): 14
    // NR Z Score: -
    // NR rPM: 11586.5
    // NR r (total reads): 13"

    // INFO
    // Sample: RR004_water_2_S23A
    // Taxon: Klebsiella pneumoniae
    // Category: Bacteria
    // VALUES
    // NT Z Score: -
    // NT rPM: 197861
    // NT r (total reads): 222
    // NR Z Score: -
    // NR rPM: 179144
    // NR r (total reads): 201
    const expectedTaxonInfo = [
      {
        Sample: "RR004_water_2_S23A_5",
        Taxon: "Klebsiella pneumoniae",
        Category: "Bacteria",
        "NT Z Score": "-",
        "NT rPM": "244207",
        "NT r (total reads)": "137",
        "NR Z Score": "-",
        "NR rPM": "204991",
        "NR r (total reads)": "115",
      },
      {
        Sample: "RR004_water_2_S23A_5",
        Taxon: "Escherichia coli",
        Category: "Bacteria",
        "NT Z Score": "-",
        "NT rPM": "7130.12",
        "NT r (total reads)": "4",
        "NR Z Score": "-",
        "NR rPM": "26738",
        "NR r (total reads)": "15",
      },
    ];
    expect(taxonData.length).toEqual(expectedTaxonInfo.length);

    for (const i in expectedTaxonInfo) {
      const actualRow = taxonData[i];
      const expectedRow = expectedTaxonInfo[i];
      for (const key of Object.keys(expectedRow)) {
        if (key === "Sample") {
          expect(actualRow[key]).toMatch(new RegExp(`${RR004_water_2_S23A}[_0-9]*`));
        } else {
          expect(actualRow[key]).toEqual(expectedRow[key]);
        }
      }
    }
    // #endregion heatmap should be updated to display the changes
  });
});
