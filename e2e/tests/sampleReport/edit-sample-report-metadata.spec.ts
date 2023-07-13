import { test } from "@playwright/test";
const sampleId = 25307;
const INVALID_DATES = ["date"];
const VALID_DATES = ["2023-12-31", "2023-12", "12/2023"];
const nucleotideType = ["RNA", "DNA"];
const libraryPrep = [
  "NEB Ultra II FS DNA",
  "NEB RNA Ultra II",
  "NEB Ultra II Directional RNA",
  "NEB Utra II DNA",
  "Nextera DNA",
  "Other",
];
const sequencer = ["MiSeq", "NextSeq", "HiSeq", "NovaSeq", "Other"];
const SAMPLE_INFO_HEADER = "sample-info-header";

const infectionClass = [
  "Definite",
  "No Infection",
  "Suspected",
  "Unknown",
  "Water Control",
];

const hostGenuses = [
  "Aedes sierrensis",
  "Culex erythrothorax",
  "Anopheles punctipennis",
  "Anopheles freeborni",
  "Culex tarsalis",
  "Culex pipiens",
  "Aedes albopictus",
  "Other",
];

const randomNumber = Math.floor(Math.random() * 100 + 1);
function pickListElement(list: Array<string>, currentValue: string) {
  let newValue = "";
  do {
    newValue = list[Math.floor(Math.random() * list.length)];
  } while (newValue === currentValue);
  return newValue;
}


test.describe("Sample report tests", () => {
  // This is a comprehensive test designed to confirm the user's capability to modify sample information, host information, infection details, and sequencing information for metadata.
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);

    // click details link
    await page.getByTestId("sample-details").click();

    // select the metadata tab
    await page.getByTestId("metadata").click();

    // accept cookies
    await page.getByText("Accept All Cookies").click();
  });

  test(`Should edit sample info section`, async ({ page }) => {
    // hover over the sample info section
    await page.getByTestId(SAMPLE_INFO_HEADER).hover();

    // Click the edit button which is visible after hovering
    await page.getByTestId("sample-info-edit").click();

    // edit Sample Name
    await page
      .getByTestId("sample-name-value")
      .locator('input[type="text"]')
      .fill(`Sample Name-${randomNumber}`);

    // edit Nucleotide Type; first get current value, then choose a new value different than current and then click select
    const currentNucleotideType = await page
      .getByTestId("nucleotide-type-value")
      .textContent();
    const newNucleotideType = pickListElement(
      nucleotideType,
      currentNucleotideType,
    );

    await page.getByTestId(newNucleotideType).click();
  });

  test.fixme(
    `Should validate collection date of sample info section`,
    async ({ page }) => {
      // hover over the sample info section
      await page.getByTestId(SAMPLE_INFO_HEADER).hover();
      // Click the edit button which is visible after hovering
      await page.getByTestId("sample-info-edit").click();

      // verify validate date formats
      for (let i = 0; i < VALID_DATES.length; i++) {
        await page.getByPlaceholder("YYYY-MM-DD").fill(VALID_DATES[i]);
        await page.getByTestId("metadata").click();
      }
      // verify invalid dates will throw error
      for (let i = 0; i < INVALID_DATES.length; i++) {
        await page.getByPlaceholder("YYYY-MM-DD").fill(INVALID_DATES[i]);
        await page.getByTestId("metadata").click();
      }
    },
  );

  test(`Should edit host info section`, async ({ page }) => {
    // collapse sample info section
    await page.getByTestId(SAMPLE_INFO_HEADER).click();

    // expand host info section and click edit
    await page.getByTestId("host-info-edit").click();

    // edit diseases & conditions
    await page
      .getByTestId("diseases-and-conditions-value")
      .locator('input[type="text"]')
      .fill(`New disease-${randomNumber}`);

    // edit host age
    await page.getByTestId("host-age-value").fill(`${randomNumber}`);

    // edit host genius; first get current value, then choose a new value different than current and then click select
    // get current host
    const currentHostGenus = await page
      .getByTestId("host-sex-value")
      .textContent();
    const newHostGenus = pickListElement(hostGenuses, currentHostGenus);

    await page.getByTestId("host-genus-species-value").click();

    await page.getByTestId(newHostGenus).click();

    const currentHostSex = await page
      .getByTestId("host-sex-value")
      .textContent();
    const newHostSex = pickListElement(["Male", "Female"], currentHostSex);
    await page.getByText(newHostSex, { exact: true }).click();
  });

  test(`Should edit infection info section`, async ({ page }) => {
    const ct_value = randomNumber;
    // collapse sample info section
    await page.getByTestId(SAMPLE_INFO_HEADER).click();

    // expand host info section and click edit
    await page.getByTestId("infection-info-header").click();
    await page.getByTestId("infection-info-edit").click();

    // edit Ct Value
    await page.getByTestId("ct-value-value").fill(String(ct_value));

    // edit Known Organism
    await page
      .getByTestId("known-organism-value")
      .fill(`Known Organism-${ct_value}`);

    // edit  Detection Method
    await page
      .getByTestId("detection-method-value")
      .fill(`Detection method-${ct_value}`);

    // edit Infection Class first get current value, then choose a new value different than current and then click select
    // get current Infection Class
    const currentInfectionClass = await page
      .getByTestId("infection-class-value")
      .textContent();
    const newInfectionClass = pickListElement(
      infectionClass,
      currentInfectionClass,
    );
    await page.getByTestId("infection-class-value").click();
    await page.getByTestId(newInfectionClass).click();
  });

  test(`Should edit sequencing info section`, async ({ page }) => {
    const rnaDnaInputng = randomNumber;
    // collapse sample info section
    await page.getByTestId(SAMPLE_INFO_HEADER).click();

    // expand sequencing info  section and click edit
    await page.getByTestId("sequencing-info-header").click();

    // edit RNA/DNA Input (ng)
    await page.getByTestId("rna-dna-input-ng-value").fill(`${rnaDnaInputng}`);

    // edit Library Prep first get current value, then choose a new value differnt than current and then click select
    // get current Library Prep
    const currentlibraryPrep = await page
      .getByTestId("library-prep-value")
      .textContent();
    const newLibraryPrep = pickListElement(libraryPrep, currentlibraryPrep);

    await page.getByTestId("library-prep-value").click();
    await page.getByTestId(newLibraryPrep).click();

    // edit Sequencer first get current value, then choose a new value differnt than current and then click select
    // get current Sequencer
    const currentSequencer = await page
      .getByTestId("sequencer-value")
      .textContent();
    const newSequencer = pickListElement(sequencer, currentSequencer);

    await page.getByTestId("sequencer-value").click();
    await page.getByTestId("dropdown-menu").getByTestId(newSequencer).click();
  });
});
