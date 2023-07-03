import { expect, test } from "@playwright/test";
const sampleId = 25307;

const INVALID_DATES = ["date"];
const VALID_DATES = ["2023-12-31", "2023-12", "12/2023"];
const METADATA_DROP_DOWN = ".field-2_Ouc  .dropdownTrigger-1fB9V";
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

const LABEL_CONTAINER = ".labelContainer-3Rr0F";
const DROPDOWN_TRIGGER = ".triggerContainer-eaPXb > .dropdownTrigger-1fB9V";
const TOGGLE_ICON = ".toggleIcon-235ie";
const NUMBER_INPUT = "input[type='number']";

test.describe("Sample report tests", () => {
  // This is a comprehensive test designed to confirm the user's capability to modify sample information, host information, infection details, and sequencing information for metadata.
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);

    // click details link
    await page.getByText("Sample Details").click();

    // select the metadata tab
    await page.getByTestId("metadata").click();

    // accept cookies
    await page.getByText("Accept All Cookies").click();
  });

  test(`Should edit sample info section`, async ({ page }) => {
    await page.pause();
    // hover over the sample info section
    await page.locator(".title-3Oy38").nth(0).hover();

    // Click the edit button which is visible after hovering
    await page.getByText("Edit").nth(0).click();

    // edit Sample Name
    await page
      .locator(".sampleNameInput-3gnI9")
      .locator('input[type="text"]')
      .fill(`Sample Name-${randomNumber}`);

    // edit Nucleotide Type; first get current value, then choose a new value different than current and then click select
    const currentNucleotideType = await page
      .locator(METADATA_DROP_DOWN)
      .nth(0)
      .locator(LABEL_CONTAINER)
      .textContent();
    const newNucleotideType = pickListElement(
      nucleotideType,
      currentNucleotideType,
    );

    await page.locator(DROPDOWN_TRIGGER).first().click();

    await page
      .getByRole("option")
      .getByText(`${newNucleotideType}`)
      .nth(0)
      .click();
  });

  test.fixme(
    `Should validate collection date of sample info section`,
    async ({ page }) => {
      // hover over the sample info section
      await page.locator(".title-3Oy38").nth(0).hover();
      // Click the edit button which is visible after hovering
      await page.getByText("Edit").nth(0).click();

      // verify validate date formats
      for (let i = 0; i < VALID_DATES.length; i++) {
        await page.getByPlaceholder("YYYY-MM-DD").fill(VALID_DATES[i]);
        await page.getByTestId("metadata").click();
        await expect(page.locator(".error-3itiT")).not.toBeVisible();
      }
      // verify invalid dates will throw error
      for (let i = 0; i < INVALID_DATES.length; i++) {
        await page.getByPlaceholder("YYYY-MM-DD").fill(INVALID_DATES[i]);
        await page.getByTestId("metadata").click();
        await expect(page.locator(".error-3itiT")).toBeVisible();
      }
    },
  );

  test(`Should edit host info section`, async ({ page }) => {
    // collapse sample info section
    await page.locator(TOGGLE_ICON).first().click();

    // expand host info section and click edit
    await page.getByText("Host InfoEdit").click();
    await page.getByText("Edit").nth(1).click();

    // edit diseases & conditions
    await page
      .locator('input[type="text"]')
      .nth(3)
      .fill(`New disease-${randomNumber}`);

    // edit host age
    await page.locator(NUMBER_INPUT).fill(`${randomNumber}`);

    // edit host genius; first get current value, then choose a new value differnt than current and then click select
    // get current host
    const currentHostGenus = await page
      .locator(METADATA_DROP_DOWN)
      .nth(0)
      .locator(LABEL_CONTAINER)
      .textContent();
    const newHostGenus = pickListElement(hostGenuses, currentHostGenus);

    await page.locator(DROPDOWN_TRIGGER).first().click();

    await page.getByRole("option", { name: newHostGenus }).click();

    // edit host sex; first get current value, then choose a new value differnt than current and then click select
    await page.locator(METADATA_DROP_DOWN).nth(1).click();

    // get current host sex
    const currentHostSex = await page
      .locator(METADATA_DROP_DOWN)
      .nth(1)
      .locator(LABEL_CONTAINER)
      .textContent();
    const newHostSex = pickListElement(["Male", "Female"], currentHostSex);
    await page.getByText(newHostSex, { exact: true }).click();
  });

  test(`Should edit infection info section`, async ({ page }) => {
    const ct_value = randomNumber;
    // collapse sample info section
    await page.locator(TOGGLE_ICON).first().click();

    // expand host info section and click edit
    await page.getByText("Infection InfoEdit").click();
    await page.getByText("Edit").nth(2).click();

    // edit Ct Value
    await page.locator(NUMBER_INPUT).fill(`${ct_value}`);

    // edit Known Organism
    await page
      .locator('div[class*="metadataInput"] input')
      .nth(2)
      .fill(`Known Organism-${ct_value}`);

    // edit  Detection Method
    await page
      .locator('div[class*="metadataInput"] input')
      .nth(1)
      .fill(`Detection method-${ct_value}`);

    // edit Infection Class first get current value, then choose a new value differnt than current and then click select
    // get current Infection Class
    const currentInfectionClass = await page
      .locator(METADATA_DROP_DOWN)
      .nth(0)
      .locator(LABEL_CONTAINER)
      .textContent();
    const newInfectionClass = pickListElement(
      infectionClass,
      currentInfectionClass,
    );

    await page.locator(DROPDOWN_TRIGGER).first().click();
    await page.getByRole("option", { name: newInfectionClass }).click();
  });

  test(`Should edit sequencing info section`, async ({ page }) => {
    const rnaDnaInputng = randomNumber;
    // collapse sample info section
    await page.locator(TOGGLE_ICON).first().click();

    // expand sequencing info  section and click edit
    await page.getByText("Sequencing infoEdit").click();
    await page.getByText("Edit").nth(3).click();

    // edit RNA/DNA Input (ng)
    await page.locator(NUMBER_INPUT).fill(`${rnaDnaInputng}`);

    // edit Library Prep first get current value, then choose a new value differnt than current and then click select
    // get current Library Prep
    const currentlibraryPrep = await page
      .locator(METADATA_DROP_DOWN)
      .nth(0)
      .locator(LABEL_CONTAINER)
      .textContent();
    const newLibraryPrep = pickListElement(libraryPrep, currentlibraryPrep);

    await page.locator(DROPDOWN_TRIGGER).first().click();
    await page.getByRole("option", { name: newLibraryPrep }).click();

    // edit Sequencer first get current value, then choose a new value differnt than current and then click select
    // get current Sequencer
    const currentSequencer = await page
      .locator(METADATA_DROP_DOWN)
      .nth(1)
      .locator(LABEL_CONTAINER)
      .textContent();
    const newSequencer = pickListElement(sequencer, currentSequencer);

    await page.locator(DROPDOWN_TRIGGER).nth(1).click();
    await page
      .locator(".dropdownMenu-1gUyq:visible")
      .getByRole("option", { name: newSequencer })
      .click();
  });
});
