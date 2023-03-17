import { test } from "@playwright/test";
import { getFixture } from "../../utils/common";
import { getTabSection, verifySectionDetails } from "../../utils/report";
import { getByTestID, getByText } from "../../utils/selectors";

const sampleId = 25307;
const fixtures = getFixture("report_data");
// These tests verifies ui functionalities on the pipeline section on the sample report page
test.describe("Sample report pipeline test", () => {
  test.beforeEach(async ({ page }) => {
    // go to sample page
    await page.goto(`${process.env.BASEURL}/samples/${sampleId}`);

    // click details link
    await page.locator(getByText("Sample Details")).click();

    // select Pipeline tab
    await page.locator(getByTestID("pipelines")).click();
  });

  test(`Should verify pipeline info section on pipeline tab`, async ({
    page,
  }) => {
    const attributes = ["name", "value"];
    // get test data
    const data = fixtures["PIPELINE_INFO_DATA"];

    // verify pipeline info tab; we are passing false because section is already expanded
    await verifySectionDetails(
      page,
      "pipelinesInfo",
      data,
      attributes,
      sampleId,
      false,
    );
  });

  test(`Should verify reads remaining section on pipeline tab`, async ({
    page,
  }) => {
    const attributes = ["step", "reads_remaining", "reads_remaining_percent"];
    // get test data
    const data = fixtures["READS_REMAINING_DATA"];

    // collapse pipeline info section
    await (await getTabSection(page, "pipelinesInfo")).click();

    // verify pipeline info tab
    await verifySectionDetails(page, "readsRemaining", data, attributes);
  });
  test(`Should verify ERCC spike-in counts section on pipeline tab`, async ({
    page,
  }) => {
    const attributes = [];
    // get test data
    const data = fixtures["ERCC_SPIKE_IN_COUNTS_DATA"];

    // collapse pipeline info section
    await (await getTabSection(page, "pipelinesInfo")).click();

    // verify ercc spike in count tab
    await verifySectionDetails(page, "erccSpikeInCounts", data, attributes);
  });
  test(`Should verify downloads section on pipeline tab`, async ({ page }) => {
    const attributes = ["text", "href"];
    // get test data
    const data = fixtures["DOWNLOADS"];

    // collapse pipeline info section
    await (await getTabSection(page, "pipelinesInfo")).click();

    // verify ercc spike in count tab
    await verifySectionDetails(page, "downloads", data, attributes, sampleId);
  });
});
