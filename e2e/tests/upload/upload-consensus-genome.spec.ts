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

const sampleType = WORKFLOWS.WGS.toLowerCase();
const ENV = (process.env.NODE_ENV as string) || "";
const projectName = TEST_PROJECTS[ENV.toUpperCase()];

test.describe("Upload WGS sample tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/samples/upload`);
    await cookieBanner(page);
  });
  test.only("Should upload WGS sample with manual metadata", async ({
    page,
  }) => {
    const verifyDeleteFile = false;
    const metadataFile = "manual";
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

  test.only("Should not be able to upload invalid or incomplete sample", async ({
    page,
  }) => {
    const truncatedSampleFiles = ["truncated_R1_001.fastq"];
    await uploadInvalidSampleFiles(
      page,
      projectName,
      sampleType,
      truncatedSampleFiles,
    );
  });
  test.only("Should upload WGS sample with metadata csv file", async ({
    page,
  }) => {
    const verifyDeleteFile = false;
    const metadataFile = "metagenomics.csv";
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
