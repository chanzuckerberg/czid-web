import { WORKFLOWS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_R1,
  SAMPLE_FILE_R2,
  TEST_PROJECTS,
} from "@e2e/constants/sample";
import {
  cookieBanner,
  testUploadSample,
  uploadInvalidSampleFiles,
} from "@e2e/utils/upload";
import { test } from "@playwright/test";

const sampleType = WORKFLOWS.AMR.toLowerCase();
const ENV = (process.env.NODE_ENV as string) || "";
const projectName = TEST_PROJECTS[ENV.toUpperCase()];

// These tests verify uploading amr samples with manual and CSV metadata.
test.describe("AMR sample upload tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/samples/upload`);
    await cookieBanner(page);
  });
  test.only("Should upload AMR sample with manual metadata", async ({
    page,
  }) => {
    const verifyDeleteFile = false;
    const invalidSample = false;
    await testUploadSample(
      page,
      projectName,
      sampleType,
      [SAMPLE_FILE_R1, SAMPLE_FILE_R2],
      invalidSample,
      verifyDeleteFile,
    );
  });

  test.only("Should upload invalid AMR sample", async ({ page }) => {
    const truncatedSampleFiles = ["truncated_R1_001.fastq"];
    await uploadInvalidSampleFiles(
      page,
      projectName,
      sampleType,
      truncatedSampleFiles,
    );
  });

  test.only("Should upload AMR sample with metadata csv file", async ({
    page,
  }) => {
    const verifyDeleteFile = false;
    const metadataFile = "amr.csv";
    const invalidSample = false;
    await testUploadSample(
      page,
      projectName,
      sampleType,
      [SAMPLE_FILE_R1, SAMPLE_FILE_R2],
      invalidSample,
      verifyDeleteFile,
      metadataFile,
    );
  });
});
