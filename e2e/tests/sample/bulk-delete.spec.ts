import { stubRequest } from "@e2e/utils/api";
import { expect, test } from "@playwright/test";

const samplesPage = `${process.env.BASEURL}/my_data?currentTab=samples`;

const triggerTestId = "bulk-delete-trigger";
const bulkDeleteApi = "samples/bulk_delete";

test.describe("Bulk sample delete tests", () => {
  // stub api response so we don't actually delete anything
  test.beforeEach(async ({ page }) => {
    const successResponse = {
      deletedIds: [123, 456],
    };
    await stubRequest(page, bulkDeleteApi, 200, successResponse);
  });
  test.beforeEach(async ({ page }) => {
    await page.goto(samplesPage, { waitUntil: "domcontentloaded" });
  });
  test.fixme(
    "Should completely delete all my data and runs",
    async ({ page }) => {
      // verify presence of trash icon
      let trashIcon = page.getByTestId(triggerTestId);
      // verify icon is disabled
      await expect(trashIcon.locator("button")).toBeDisabled();

      // check tooltip text
      await trashIcon.hover();
      let tooltip = page.getByTestId(`${triggerTestId}-tooltip`);
      await expect(tooltip).toContainText("Delete");
      await expect(tooltip).toContainText("Select at least 1 sample");

      // select some samples, all that are owned by me and complete
      const checkboxes = page.getByTestId("row-select-checkbox");
      await checkboxes.nth(0).click();

      // verify icon no longer disabled
      trashIcon = page.getByTestId(triggerTestId);
      await expect(trashIcon.locator("button")).toBeEnabled({ timeout: 0 });

      // check tooltip text again
      await trashIcon.hover();
      tooltip = page.getByTestId(`${triggerTestId}-tooltip`);
      await expect(tooltip).toContainText("Delete");
      await expect(tooltip).not.toContainText("Select at least 1 sample");

      // click icon
      trashIcon.click();

      // verify modal opens
      const modal = page.getByTestId("bulk-delete-modal");
      await expect(modal).toContainText(
        "You will not be able to undo this action once completed.",
      );

      // click delete button
      const deleteButton = page.locator("button").getByText("Delete");
      await deleteButton.click({ timeout: 0 });

      // verify modal closes
      expect(modal).not.toBeVisible({ timeout: 0 });

      // verify success notification appears
      const notif = page.getByTestId("sample-delete-success-notif");
      await expect(notif).toBeVisible({ timeout: 0 });
      await expect(notif).toContainText("successfully deleted");

      // TODO (mlila): add check that sample rows removed from table once BE endpoint updated to delete samples
    },
  );

  test.fixme(
    "Should not allow delete of my data and runs",
    async ({ page }) => {
      // stub request so we can fake a failure
      const failureResponse = {
        deletedIds: [],
        error: "Bulk delete failed: not all objects valid for deletion",
      };
      await stubRequest(page, bulkDeleteApi, 200, failureResponse);

      // select some samples
      const checkboxes = page.getByTestId("row-select-checkbox");
      await checkboxes.nth(0).click({ timeout: 0 });

      // click icon
      const trashIcon = page.getByTestId(triggerTestId);
      await trashIcon.click({ timeout: 0 });

      // click delete button
      const deleteButton = page.locator("button").getByText("Delete");
      await deleteButton.click({ timeout: 0 });

      // verify error notif appears
      const notif = page.getByTestId("sample-delete-error-notif");
      await expect(notif).toBeVisible({ timeout: 0 });
      await expect(notif).toContainText("Please try again.");
    },
  );
});
