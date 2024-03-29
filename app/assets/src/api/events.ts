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
  /** The user clicked "Continue" in the BLAST Contigs Modal */
  this.BLAST_CONTIGS_MODAL_CONTINUE_BUTTON_CLICKED =
    "BLAST_CONTIGS_MODAL_CONTINUE_BUTTON_CLICKED";

  /** The user clicked "Continue" in the BLAST Redirection Modal */
  this.BLAST_REDIRECTION_MODAL_CONTINUE_BUTTON_CLICKED =
    "BLAST_REDIRECTION_MODAL_CONTINUE_BUTTON_CLICKED";

  this.HIT_GROUP_VIZ_CONTIG_DOWNLOAD_BUTTON_CLICKED =
    "HIT_GROUP_VIZ_CONTIG_DOWNLOAD_BUTTON_CLICKED";

  /** The bulk download creation was successful */
  this.BULK_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESSFUL =
    "BULK_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESSFUL";

  /** The user clicked Confirm on the confirmation modal to send their samples to Nextclade. */
  this.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED =
    "NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED";

  /** Copy of NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED without expanded tables bc it has a compliant type for the payload */
  this.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED_ALLISON_TESTING =
    "NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED_ALLISON_TESTING";

  /** The user clicked Create Consensus Genome in the Consensus Genome Creation modal. */
  this.CONSENSUS_GENOME_CREATION_MODAL_CREATE_BUTTON_CLICKED =
    "CONSENSUS_GENOME_CREATION_MODAL_CREATE_BUTTON_CLICKED";

  /** The user clicked the hover action to create a Consensus Genome from the mngs report page taxon row. */
  this.REPORT_TABLE_CONSENSUS_GENOME_HOVER_ACTION_CLICKED =
    "REPORT_TABLE_CONSENSUS_GENOME_HOVER_ACTION_CLICKED";

  /** The user clicked the "here" link under the Consensus Genome Illumina technology option in the Sample Upload Flow. */
  this.UPLOAD_SAMPLE_CG_ILLUMINA_PIPELINE_GITHUB_LINK_CLICKED =
    "UPLOAD_SAMPLE_CG_ILLUMINA_PIPELINE_GITHUB_LINK_CLICKED";

  /** The user clicked the "here" link under the Consensus Genome Nanopore technology option in the Sample Upload Flow. */
  this.UPLOAD_SAMPLE_STEP_CG_ARTIC_PIPELINE_LINK_CLICKED =
    "UPLOAD_SAMPLE_STEP_CG_ARTIC_PIPELINE_LINK_CLICKED";

  /** The user clicked the "here" link under the mNGS Illumina technology option. */
  this.UPLOAD_SAMPLE_STEP_MNGS_ILLUMINA_PIPELINE_LINK_CLICKED =
    "UPLOAD_SAMPLE_STEP_MNGS_ILLUMINA_PIPELINE_LINK_CLICKED";

  /** The user clicked the sortable column headers on the mngs report page. */
  this.REPORT_TABLE_COLUMN_SORT_ARROW_CLICKED =
    "REPORT_TABLE_COLUMN_SORT_ARROW_CLICKED";

  /** The user navigated to the samples heatmap view and backend heatmap data is fetched. */
  this.SAMPLES_HEATMAP_VIEW_HEATMAP_DATA_FETCHED =
    "SAMPLES_HEATMAP_VIEW_HEATMAP_DATA_FETCHED";

  /** Copy of SAMPLES_HEATMAP_VIEW_HEATMAP_DATA_FETCHED without expanded tables bc it has a compliant type for the payload */
  this.SAMPLES_HEATMAP_VIEW_HEATMAP_DATA_FETCHED_ALLISON_TESTING =
    "SAMPLES_HEATMAP_VIEW_HEATMAP_DATA_FETCHED_ALLISON_TESTING";

  /** The user ran into an error while loading heatmap data. */
  this.SAMPLES_HEATMAP_VIEW_LOADING_ERROR =
    "SAMPLES_HEATMAP_VIEW_LOADING_ERROR";

  /** Copy of SAMPLES_HEATMAP_VIEW_LOADING_ERROR without expanded tables bc it has a compliant type for the payload */
  this.SAMPLES_HEATMAP_VIEW_LOADING_ERROR_ALLISON_TESTING =
    "SAMPLES_HEATMAP_VIEW_LOADING_ERROR_ALLISON_TESTING";

  /** The user clicked the "+ Create new tree" button from the phylo tree list view in the PhyloTreeCreationModal to begin the tree creation flow */
  this.PHYLO_TREE_CREATION_MODAL_CREATE_NEW_TREE_BUTTON_CLICKED =
    "PHYLO_TREE_CREATION_MODAL_CREATE_NEW_TREE_BUTTON_CLICKED";

  /** The user clicked the "Create Tree" button on the last step of the PhyloTreeCreationModal process to actually kickoff the phylo tree pipeline */
  this.PHYLO_TREE_CREATION_MODAL_CREATE_TREE_BUTTON_CLICKED =
    "PHYLO_TREE_CREATION_MODAL_CREATE_TREE_BUTTON_CLICKED";

  /** The user clicked on an existing old phylo tree in the PhyloTreeCreationModal list */
  this.PHYLO_TREE_CREATION_MODAL_VIEW_PHYLO_TREE_LINK_CLICKED =
    "PHYLO_TREE_CREATION_MODAL_VIEW_PHYLO_TREE_LINK_CLICKED";

  /** The user clicked on an existing phylo tree NG in the PhyloTreeCreationModal list */
  this.PHYLO_TREE_CREATION_MODAL_VIEW_PHYLO_TREE_NG_LINK_CLICKED =
    "PHYLO_TREE_CREATION_MODAL_VIEW_PHYLO_TREE_NG_LINK_CLICKED";

  /** The user opened the AnnotationMenu within a species or genus row. */
  this.REPORT_TABLE_ANNOTATION_MENU_OPENED =
    "REPORT_TABLE_ANNOTATION_MENU_OPENED";

  /** Copy of REPORT_TABLE_ANNOTATION_MENU_OPENED without expanded tables bc it has a compliant type for the payload */
  this.REPORT_TABLE_ANNOTATION_MENU_OPENED_ALLISON_TESTING =
    "REPORT_TABLE_ANNOTATION_MENU_OPENED_ALLISON_TESTING";

  /** Heartbeat, which is sent every minute and indicates that the browser is actively uploading samples, has been deactivated. */
  this.LOCAL_UPLOAD_PROGRESS_MODAL_UPLOADS_BATCH_HEARTBEAT_COMPLETED =
    "LOCAL_UPLOAD_PROGRESS_MODAL_UPLOADS_BATCH_HEARTBEAT_COMPLETED";

  /** Copy of LOCAL_UPLOAD_PROGRESS_MODAL_UPLOADS_BATCH_HEARTBEAT_COMPLETED without expanded tables bc it has a compliant type for the payload */
  this.LOCAL_UPLOAD_PROGRESS_MODAL_UPLOADS_BATCH_HEARTBEAT_COMPLETED_ALLISON_TESTING =
    "LOCAL_UPLOAD_PROGRESS_MODAL_UPLOADS_BATCH_HEARTBEAT_COMPLETED_ALLISON_TESTING";

  this.SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESS =
    "SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESS";

  /** Copy of SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESS without expanded tables bc it has a compliant type for the payload */
  this.SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESS_ALLISON_TESTING =
    "SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESS_ALLISON_TESTING";

  /**  The user selected a file for upload that failed one or more pre-upload QC checks */
  this.PRE_UPLOAD_QC_CHECK_WARNING_TYPE = "PRE_UPLOAD_QC_CHECK_WARNING_TYPE";

  /** Track the cumulative size of files that did not pass the pre-upload validation checks */
  this.PRE_UPLOAD_QC_CHECK_CUMULATIVE_FILE_SIZE_FAILED =
    "PRE_UPLOAD_QC_CHECK_CUMULATIVE_FILE_SIZE_FAILED";

  /** The user has clicked the "Complete Setup" button on the UserProfileForm */
  this.USER_PROFILE_FORM_COMPLETE_SETUP_CLICKED =
    "USER_PROFILE_FORM_COMPLETE_SETUP_CLICKED";

  /** The welcome modal was shown to a first time user on the DiscoveryView */
  this.MODAL_FIRST_TIME_USER_SHOWN = "MODAL_FIRST_TIME_USER_SHOWN";

  this.ADVANCED_DOWNLOAD_TAB_COPY_CLOUD_COMMAND_LINK_CLICKED =
    "ADVANCED_DOWNLOAD_TAB_COPY_CLOUD_COMMAND_LINK_CLICKED";

  this.PIPELINE_SAMPLE_REPORT_PHYLOTREE_LINK_CLICKED =
    "PIPELINE_SAMPLE_REPORT_PHYLOTREE_LINK_CLICKED";

  this.SAMPLES_VIEW_RUNS_BULK_DELETED = "SAMPLES_VIEW_RUNS_BULK_DELETED";

  this.SAMPLES_VIEW_ROW_CLICKED = "SAMPLES_VIEW_ROW_CLICKED";

  this.PIPELINE_SAMPLE_REPORT_SAMPLE_VIEWED =
    "PIPELINE_SAMPLE_REPORT_SAMPLE_VIEWED";

  this.SAMPLE_VIEW_SINGLE_RUN_DELETED = "SAMPLE_VIEW_SINGLE_RUN_DELETED";

  this.SAMPLE_VIEW_FILTER_CHANGED = "SAMPLE_VIEW_FILTER_CHANGED";

  this.SAMPLE_VIEW_FILTER_CHANGED_ALLISON_TESTING =
    "SAMPLE_VIEW_FILTER_CHANGED_ALLISON_TESTING";

  /** The user clicked a MenuItem within the AnnotationMenu. */
  this.ANNOTATION_MENU_MENU_ITEM_CLICKED = "ANNOTATION_MENU_MENU_ITEM_CLICKED";

  /** The user has clicked the Bulk Kickoff AMR Trigger on the SamplesView */
  this.SAMPLES_VIEW_BULK_KICKOFF_AMR_WORKFLOW_TRIGGER_CLICKED =
    "SAMPLES_VIEW_BULK_KICKOFF_AMR_WORKFLOW_TRIGGER_CLICKED";

  /** Copy of SAMPLES_VIEW_BULK_KICKOFF_AMR_WORKFLOW_TRIGGER_CLICKED without expanded tables bc it has a compliant type for the payload */
  this.SAMPLES_VIEW_BULK_KICKOFF_AMR_WORKFLOW_TRIGGER_CLICKED_ALLISON_TESTING =
    "SAMPLES_VIEW_BULK_KICKOFF_AMR_WORKFLOW_TRIGGER_CLICKED_ALLISON_TESTING";

  this.PIPELINE_SAMPLE_REPORT_CONTIG_DOWNLOAD_LINK_CLICKED =
    "PIPELINE_SAMPLE_REPORT_CONTIG_DOWNLOAD_LINK_CLICKED";

  this.PIPELINE_SAMPLE_REPORT_COVERAGE_VIZ_LINK_CLICKED =
    "PIPELINE_SAMPLE_REPORT_COVERAGE_VIZ_LINK_CLICKED";

  /** The user clicked the BLAST button on the HoverActions within a species or genus row. */
  this.REPORT_TABLE_BLAST_BUTTON_HOVER_ACTION_CLICKED =
    "REPORT_TABLE_BLAST_BUTTON_HOVER_ACTION_CLICKED";

  /** The user clicked a MenuItem within the AnnotationMenu. */
  this.ANNOTATION_MENU_MENU_ITEM_CLICKED = "ANNOTATION_MENU_MENU_ITEM_CLICKED";

  this.PIPELINE_SAMPLE_REPORT_TAXON_SIDEBAR_LINK_CLICKED =
    "PIPELINE_SAMPLE_REPORT_TAXON_SIDEBAR_LINK_CLICKED";

  /** The user has clicked the "Register Now" button on the LandingPage */
  this.LANDING_PAGE_REGISTER_NOW_BUTTON_CLICKED =
    "LANDING_PAGE_REGISTER_NOW_BUTTON_CLICKED";
}

const eventNames = new EventDictionary();

export default eventNames;
