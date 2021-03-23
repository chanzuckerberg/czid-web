/**
 * @module Events
 */

/**
 * @class A dictionary of all JavaScript user analytics events:<br>
 *
 * - We are consolidating all analytics event names here to prevent typos, facilitate code completion, and make a reference for product analysts.<br>
 * - Provide a plain-English description of what each event means.<br>
 * - Make sure the key matches its SQL-compatible converted form (e.g. NextcladeModal changes to NEXTCLADE_MODAL, dash changes to underscore).<br>
 * - If you migrate a legacy-style event name, please flag it in the analytics channel in case there are dashboards relying directly on the EVENTS.TRACKS.NAME field.<br>
 * - You MUST use the ** comment style if you want the comment to appear in JSDoc docs.<br>
 * - This is in a JS function mostly so that JSDoc can parse it.<br>
 */
function EventDictionary() {
  /** The user closed the confirmation modal before sending their samples to Nextclade. */
  this.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CANCEL_BUTTON_CLICKED =
    "NEXTCLADE_MODAL_CONFIRMATION_MODAL_CANCEL_BUTTON_CLICKED";

  /** The user clicked Confirm on the confirmation modal to send their samples to Nextclade. */
  this.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED =
    "NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED";

  /** The user clicked Retry after sending the samples to Nextclade failed. */
  this.NEXTCLADE_MODAL_CONFIRMATION_MODAL_RETRY_BUTTON_CLICKED =
    "NEXTCLADE_MODAL_CONFIRMATION_MODAL_RETRY_BUTTON_CLICKED";

  /** The operation to send samples to Nextclade failed. */
  this.NEXTCLADE_MODAL_UPLOAD_FAILED = "NEXTCLADE_MODAL_UPLOAD_FAILED";

  /** There was a failure upon retrying the operation to send samples to Nextclade. */
  this.NEXTCLADE_MODAL_RETRY_UPLOAD_FAILED =
    "NEXTCLADE_MODAL_RETRY_UPLOAD_FAILED";

  /** The user changed their selected accession in the Consensus Genome Creation modal. */
  this.CONSENSUS_GENOME_CREATION_MODAL_SELECTED_ACCESSION_CHANGED =
    "CONSENSUS_GENOME_CREATION_MODAL_SELECTED_ACCESSION_CHANGED";

  /** The user clicked Create Consensus Genome in the Consensus Genome Creation modal. */
  this.CONSENSUS_GENOME_CREATION_MODAL_CREATE_BUTTON_CLICKED =
    "CONSENSUS_GENOME_CREATION_MODAL_CREATE_BUTTON_CLICKED";

  /** The user closed the Consensus Genome Creation modal. */
  this.CONSENSUS_GENOME_CREATION_MODAL_CLOSED =
    "CONSENSUS_GENOME_CREATION_MODAL_CLOSED";

  /** The user clicked the Learn More link in the Consensus Genome Creation modal. */
  this.CONSENSUS_GENOME_CREATION_MODAL_HELP_LINK_CLICKED =
    "CONSENSUS_GENOME_CREATION_MODAL_HELP_LINK_CLICKED";

  /** The user clicked the hover action to create a Consensus Genome from the mngs report page taxon row. */
  this.REPORT_TABLE_CONSENSUS_GENOME_HOVER_ACTION_CLICKED =
    "REPORT_TABLE_CONSENSUS_GENOME_HOVER_ACTION_CLICKED";

  /** The user clicked a Consensus Genome technology in the Sample Upload Flow. */
  this.UPLOAD_SAMPLE_STEP_CONSENSUS_GENOME_TECHNOLOGY_CLICKED =
    "UPLOAD_SAMPLE_STEP_CONSENSUS_GENOME_TECHNOLOGY_CLICKED";

  /** The user clicked the "here" link under the Consensus Genome Illumina technology option in the Sample Upload Flow. */
  this.UPLOAD_SAMPLE_CG_ILLUMINA_PIPELINE_GITHUB_LINK_CLICKED =
    "UPLOAD_SAMPLE_CG_ILLUMINA_PIPELINE_GITHUB_LINK_CLICKED";

  /** The user clicked the "here" link under the Consensus Genome Nanopore technology option in the Sample Upload Flow. */
  this.UPLOAD_SAMPLE_STEP_CG_ARTIC_PIPELINE_LINK_CLICKED =
    "UPLOAD_SAMPLE_STEP_CG_ARTIC_PIPELINE_LINK_CLICKED";

  /** The user closed the modal listing previously generated Consensus Genomes for the taxon. */
  this.CONSENSUS_GENOME_PREVIOUS_MODAL_CLOSED =
    "CONSENSUS_GENOME_PREVIOUS_MODAL_CLOSED";

  /** The user clicked the hover action to open up previous Consensus Genome runs from the mngs report page taxon row. */
  this.REPORT_TABLE_PREVIOUS_CONSENSUS_GENOME_HOVER_ACTION_CLICKED =
    "REPORT_TABLE_PREVIOUS_CONSENSUS_GENOME_HOVER_ACTION_CLICKED";
}

const eventNames = new EventDictionary();

export default eventNames;
