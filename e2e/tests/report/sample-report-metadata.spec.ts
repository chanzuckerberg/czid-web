import { test } from "@playwright/test";
import { getFixture } from "../../utils/common";
import { verifySectionDetails, getTabSection } from "../../utils/report";
import { getByTestID, getByText } from "../../utils/selectors";

const sampleId = 25307;
const fixtures = getFixture("report_data");
const attributes = ["name", "value"];
// These tests verifies ui functionalities on the metadata section on the sample report page
test.describe("Sample report metadata test", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);

    // click details link
    await page.locator(getByText("Sample Details")).click();
    // select metadata tab
    await page.locator(getByTestID("metadata")).click();
  });

  test(`Should verify sample info on metadata tab`, async ({ page }) => {
    // get test data
    const data = fixtures["SAMPLE_INFO_DATA"];

    // verify sample info tab
    await verifySectionDetails(
      page,
      "sampleInfo",
      data,
      attributes,
      undefined,
      false,
    );
  });
  test(`Should verify host info on metadata tab`, async ({ page }) => {
    // get test data
    const data = fixtures["HOST_INFO_DATA"];

    // collapse sample info section
    await (await getTabSection(page, "sampleInfo")).click();

    // verify host info section
    await verifySectionDetails(page, "hostInfo", data, attributes);
  });
  test(`Should verify infection info on metadata tab`, async ({ page }) => {
    // get test data
    const data = fixtures["INFECTION_INFO_DATA"];

    // collapse sample info section
    await (await getTabSection(page, "sampleInfo")).click();

    // verify infection info section
    await verifySectionDetails(page, "infectionInfo", data, attributes);
  });
  test(`Should verify sequencing info on metadata tab`, async ({ page }) => {
    // get test data
    const data = fixtures["SEQUENCING_INFO_DATA"];

    // collapse sample info section
    await (await getTabSection(page, "sampleInfo")).click();

    // verify infection info section
    await verifySectionDetails(page, "sequencingInfo", data, attributes);
  });
});
