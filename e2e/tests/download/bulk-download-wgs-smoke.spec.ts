import { WORKFLOWS } from "@e2e/constants/common";
import { test } from "@playwright/test";
import { DownloadsPage } from "../../page-objects/downloads-page";
import { DOWNLOAD_TYPES } from "../../page-objects/project-page";

const uploadWorkflows = [WORKFLOWS.WGS];

test.describe("Bulk Download: WGS", () => {
  for (const workflow of uploadWorkflows) {
    for (const downloadType of DOWNLOAD_TYPES[workflow]) {
      /**
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-64
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-65
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-66
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-67
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-68
       */
      test(`Smoke Test: Bulk Download ${workflow} ${downloadType}`, async ({
        page,
      }) => {
        const timeout = 60 * 1000 * 5;
        test.setTimeout(timeout);
        await new DownloadsPage(page).downloadSmokeTest(
          workflow,
          downloadType,
          timeout,
        );
      });
    }
  }
});
