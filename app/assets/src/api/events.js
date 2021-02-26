/**
 * @module Events
 */

/**
 * @class A dictionary of all JavaScript user analytics events:<br>
 *
 * - We are consolidating all analytics event names here to prevent typos, facilitate code completion, and make a reference for product analysts.<br>
 * - Provide a plain-English description of what each event means.<br>
 * - Make sure the key matches its SQL-compatible converted form (e.g. NextcladeModal changes to NEXTCLADE_MODAL, dash changes to underscore).<br>
 * - You MUST use the ** comment style if you want the comment to appear in JSDoc docs.<br>
 * - This is in a JS function mostly so that JSDoc can parse it.
 */
function EventDictionary() {
  /** The user closed the confirmation modal before sending their samples to Nextclade. */
  this.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CANCEL_BUTTON_CLICKED =
    "NextcladeModal_confirmation-modal-cancel-button_clicked";

  /** The user clicked Confirm on the confirmation modal to send their samples to Nextclade. */
  this.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED =
    "NextcladeModal_confirmation-modal-confirm-button_clicked";

  /** The user clicked Retry after sending the samples to Nextclade failed. */
  this.NEXTCLADE_MODAL_CONFIRMATION_MODAL_RETRY_BUTTON_CLICKED =
    "NextcladeModal_confirmation-modal-retry-button_clicked";

  /** The operation to send samples to Nextclade failed. */
  this.NEXTCLADE_MODAL_UPLOAD_FAILED = "NextcladeModal_upload_failed";

  /** There was a failure upon retrying the operation to send samples to Nextclade. */
  this.NEXTCLADE_MODAL_RETRY_UPLOAD_FAILED =
    "NextcladeModal_retry-upload_failed";
}

const eventNames = new EventDictionary();

export default eventNames;
