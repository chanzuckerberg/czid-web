import { WORKFLOWS } from "@e2e/constants/common";
import { test } from "@playwright/test";
import { DownloadsPage } from "../../page-objects/downloads-page";
import { DOWNLOAD_TYPES } from "../../page-objects/project-page";

const uploadWorkflows = [WORKFLOWS.MNGS];

test.describe("Bulk Download: MNGS", () => {
  for (const workflow of uploadWorkflows) {
    for (const downloadType of DOWNLOAD_TYPES[workflow]) {
      /**
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-41
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-42
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-43
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-44
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-45
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-46
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-47
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-48
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-49
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-50
       * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-69
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
