import { WorkflowType } from "~utils/workflows";

export const TRIGGERS = {
  backgroundModel: "backgroundModel",
  genepi: "genepi",
  heatmap: "heatmap",
  download: "download",
  nextclade: "nextclade",
  more_actions: "more_actions",
  bulk_delete: "bulk_delete",
};

export const WORKFLOW_TRIGGERS = {
  [WorkflowType.CONSENSUS_GENOME]: [
    TRIGGERS.nextclade,
    TRIGGERS.download,
    TRIGGERS.genepi,
    TRIGGERS.bulk_delete,
  ],
  [WorkflowType.SHORT_READ_MNGS]: [
    TRIGGERS.backgroundModel,
    TRIGGERS.heatmap,
    TRIGGERS.download,
    TRIGGERS.bulk_delete,
    TRIGGERS.more_actions,
  ],
  [WorkflowType.AMR]: [TRIGGERS.download, TRIGGERS.bulk_delete],
  [WorkflowType.LONG_READ_MNGS]: [TRIGGERS.download, TRIGGERS.bulk_delete],
};

export const SARS_COV_2 = "Severe acute respiratory syndrome coronavirus 2";

export enum PipelineRunStatuses {
  Failed = "failed",
  Complete = "complete",
  // TODO: Add other statuses
}

export const UPLOAD_FAILED = "upload_failed";
