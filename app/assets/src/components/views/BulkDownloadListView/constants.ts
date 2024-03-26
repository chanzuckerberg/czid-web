import {
  AMR_BULK_DOWNLOAD_LINK,
  BULK_DOWNLOAD_LINK,
  CG_QUALITY_CONTROL_LINK,
} from "~/components/utils/documentationLinks";
import { WorkflowConfigType, WorkflowType } from "~/components/utils/workflows";
import { BulkDownloadDetails, BulkDownloadStatus } from "~/interface/shared";
import { BULK_DOWNLOAD_TYPE_INFO } from "./downloadTypeInfo";

// Stores information about conditional fields for bulk downloads.
export const CONDITIONAL_FIELDS = [
  // Note: This first field is referenced directly in BulkDownloadDataField, as
  // it needs to display a placeholder component. Be careful when modifying.
  {
    field: "file_format",
    // The download type this conditional field applies to.
    downloadType: "reads_non_host",
    // The field this conditional field depends on.
    dependentFields: ["taxa_with_reads"],
    // The values of the dependent field that trigger the conditional field.
    triggerValues: ["all", undefined],
  },
  {
    field: "background",
    downloadType: "combined_sample_taxon_results",
    dependentFields: ["metric"],
    triggerValues: ["NR.zscore", "NT.zscore"],
  },
  {
    field: "background",
    downloadType: "biom_format",
    dependentFields: ["metric", "filter_by"],
    triggerValues: ["NR.zscore", "NT.zscore"],
  },
];

export const OPTIONAL_FIELDS = [
  {
    field: "filter_by",
    downloadType: "biom_format",
  },
];

export const DEFAULT_BACKGROUND_MODEL = 26;

export const BULK_DOWNLOAD_TYPES = {
  SAMPLE_METADATA: "sample_metadata",
  CONSENSUS_GENOME_INTERMEDIATE_OUTPUT_FILES:
    "consensus_genome_intermediate_output_files",
  BIOM_FORMAT_DOWNLOAD_TYPE: "biom_format",
  AMR_RESULTS_BULK_DOWNLOAD: "amr_results_bulk_download",
  ORIGINAL_INPUT_FILES: "original_input_file",
  // "host_gene_counts" is historical: it now serves various host count info.
  // Transcript counts for short-read-mngs v8+, gene counts for v7 and before
  HOST_GENE_COUNTS: "host_gene_counts",
};

export const InProgressStatus = [
  BulkDownloadStatus.RUNNING,
  BulkDownloadStatus.CREATED,
  BulkDownloadStatus.PENDING,
  BulkDownloadStatus.STARTED,
];

export const FailedStatus = [
  BulkDownloadStatus.SUCCEEDED_WITH_ISSUE,
  BulkDownloadStatus.FAILED,
  BulkDownloadStatus.TIMED_OUT,
  BulkDownloadStatus.ABORTED,
];

export const getStatusType = (bulkDownload?: BulkDownloadDetails) => {
  if (!bulkDownload) {
    return "default";
  }
  if (
    (bulkDownload.status === BulkDownloadStatus.SUCCEEDED &&
      bulkDownload.errorMessage) ||
    BulkDownloadStatus.SUCCEEDED_WITH_ISSUE === bulkDownload.status
  ) {
    // It is possible for a bulk download to "complete with issues".
    // For example, a few of the source files could not be found, but the rest were compressed successfully.
    // In this case, the bulk download task will have status = success and also have an error message.
    return "warning";
  }
  if (InProgressStatus.includes(bulkDownload.status)) {
    return "default";
  }
  if (FailedStatus.includes(bulkDownload.status)) {
    return "error";
  }
  if (BulkDownloadStatus.SUCCEEDED === bulkDownload.status) {
    return "success";
  }
  return "default";
};

export const getStatusDisplay = (
  status?: BulkDownloadStatus,
  errorMessage?: string,
) => {
  if (!status) {
    return "";
  }
  if (
    (status === BulkDownloadStatus.SUCCEEDED && errorMessage) ||
    BulkDownloadStatus.SUCCEEDED_WITH_ISSUE === status
  ) {
    // It is possible for a bulk download to "complete with issues".
    // For example, a few of the source files could not be found, but the rest were compressed successfully.
    // In this case, the bulk download task will have status = success and also have an error message.
    return "complete with issue";
  }
  if (InProgressStatus.includes(status)) {
    return "in progess";
  }
  if (FailedStatus.includes(status)) {
    return "failed";
  }
  if (BulkDownloadStatus.SUCCEEDED === status) {
    return "complete";
  }
  console.error("No Display Status Found");
  return "";
};

export const getTooltipText = (bulkDownload: BulkDownloadDetails) => {
  if (
    bulkDownload.status === BulkDownloadStatus.SUCCEEDED &&
    bulkDownload.errorMessage
  ) {
    return bulkDownload.errorMessage;
  }

  return null;
};

export const BULK_DOWNLOAD_DOCUMENTATION_LINKS = {
  [BULK_DOWNLOAD_TYPES.CONSENSUS_GENOME_INTERMEDIATE_OUTPUT_FILES]:
    CG_QUALITY_CONTROL_LINK,
  [BULK_DOWNLOAD_TYPES.BIOM_FORMAT_DOWNLOAD_TYPE]: BULK_DOWNLOAD_LINK,
  [BULK_DOWNLOAD_TYPES.AMR_RESULTS_BULK_DOWNLOAD]: AMR_BULK_DOWNLOAD_LINK,
};

export const WORKFLOW_OBJECT_LABELS: WorkflowConfigType<string | null> = {
  [WorkflowType.SHORT_READ_MNGS]: "sample",
  [WorkflowType.AMR]: "sample",
  [WorkflowType.CONSENSUS_GENOME]: "consensus genome",
  [WorkflowType.LONG_READ_MNGS]: "sample",
  [WorkflowType.AMR_DEPRECATED]: null,
  [WorkflowType.BENCHMARK]: null,
};

export const HOST_GENOME_NAMES = {
  HUMAN: "Human",
};

// The number of times we automatically update the bulk downloads on the page before prompting the user.
export const AUTO_UPDATE_MAX_COUNT = 3;

// Slightly larger than PROGRESS_UPDATE_DELAY on the back-end.
export const AUTO_UPDATE_DELAY = 20000;

export const getDownloadDisplayName = (downloadType: string) => {
  return BULK_DOWNLOAD_TYPE_INFO[downloadType]?.displayName;
};
