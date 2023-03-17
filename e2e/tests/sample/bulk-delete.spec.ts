import { expect, test } from "@playwright/test";
import { BasePage } from "../../pages/basePage";
import { stubRequest } from "../../utils/api";
import { login } from "../../utils/login";

const samplesPage = `${process.env.BASEURL}/my_data?currentTab=samples`;
const publicPage = `${process.env.BASEURL}/public?currentTab=samples`;

const triggerTestId = "bulk-delete-trigger";
const bulkDeleteApi = "samples/bulk_delete";

test.describe("Bulk delete samples", () => {
  // stub api response so we don't actually delete anything
  test.beforeEach(async ({ page }) => {
    const successResponse = {
      deletedIds: [123, 456],
    };
    await stubRequest(page, bulkDeleteApi, 200, successResponse);
  });

  test("happy path with my data and all runs complete", async ({ page }) => {
    // navigate to my_data
    const basePage = new BasePage(page);
    await basePage.gotoUrl(samplesPage);

    // verify presence of trash icon
    let trashIcon = await basePage.findByTestId(triggerTestId);

    // verify icon is disabled
    await trashIcon.isDisabled();

    // check tooltip text
    await trashIcon.hover();
    let tooltip = await basePage.findByTestId(`${triggerTestId}-tooltip`);
    await expect(tooltip).toContainText("Delete");
    await expect(tooltip).toContainText("Select at least 1 sample");

    // select some samples, all that are owned by me and complete
    const checkboxes = await basePage.findByTestId("row-select-checkbox");
    await checkboxes.nth(0).click();

    // verify icon no longer disabled
    trashIcon = await basePage.findByTestId(triggerTestId);
    await trashIcon.isEnabled();

    // check tooltip text again
    await trashIcon.hover();
    tooltip = await basePage.findByTestId(`${triggerTestId}-tooltip`);
    await expect(tooltip).toContainText("Delete");
    await expect(tooltip).not.toContainText("Select at least 1 sample");

    // click icon
    trashIcon.click();

    // verify modal opens
    const modal = await basePage.findByTestId("bulk-delete-modal");
    await expect(modal).toContainText(
      "You will not be able to undo this action once completed.",
    );

    // click delete button
    const deleteButton = await basePage.findByTestId("delete-samples-button");
    await deleteButton.click();

    // verify modal closes
    expect(modal).not.toBeVisible();

    // verify success notif appears
    const notif = await basePage.findByTestId("sample-delete-success-notif");
    await expect(notif).toBeVisible();
    await expect(notif).toContainText("successfully deleted");

    // TODO (mlila): add check that sample rows removed from table once BE endpoint updated to delete samples
  });

  test("failure path", async ({ page }) => {
    // navigate to my_data
    const basePage = new BasePage(page);
    await basePage.gotoUrl(samplesPage);

    // stub request so we can fake a failure
    const failureResponse = {
      deletedIds: [],
      error: "Bulk delete failed: not all objects valid for deletion",
    };
    await stubRequest(page, bulkDeleteApi, 200, failureResponse);

    // select some samples
    const checkboxes = await basePage.findByTestId("row-select-checkbox");
    await checkboxes.nth(0).click();

    // click icon
    const trashIcon = await basePage.findByTestId(triggerTestId);
    await trashIcon.click();

    // click delete button
    const deleteButton = await basePage.findByTestId("delete-samples-button");
    await deleteButton.click();

    // verify error notif appears
    const notif = await basePage.findByTestId("sample-delete-error-notif");
    await expect(notif).toBeVisible();
    await expect(notif).toContainText("Please try again.");
  });

  test("cannot delete from the public view", async ({ page }) => {
    // navigate to /public
    const basePage = new BasePage(page);
    await basePage.gotoUrl(publicPage);

    // wait for actions to load
    await basePage.findByTestId("sample-view-actions");

    // verify icon does not appear
    const trashIcon = await basePage.findByTestId("bulk-delete-trigger");
    const numIcons = await trashIcon.count();
    await expect(numIcons).toBe(0);
  });
});
