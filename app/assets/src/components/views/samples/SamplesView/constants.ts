import { WORKFLOWS } from "~utils/workflows";

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
  [WORKFLOWS.CONSENSUS_GENOME.value]: [
    TRIGGERS.nextclade,
    TRIGGERS.download,
    TRIGGERS.genepi,
    TRIGGERS.bulk_delete,
  ],
  [WORKFLOWS.SHORT_READ_MNGS.value]: [
    TRIGGERS.backgroundModel,
    TRIGGERS.heatmap,
    TRIGGERS.download,
    TRIGGERS.bulk_delete,
    TRIGGERS.more_actions,
  ],
  [WORKFLOWS.AMR.value]: [TRIGGERS.download, TRIGGERS.bulk_delete],
  [WORKFLOWS.LONG_READ_MNGS.value]: [TRIGGERS.download, TRIGGERS.bulk_delete],
};

export const SARS_COV_2 = "Severe acute respiratory syndrome coronavirus 2";

export enum PipelineRunStatuses {
  Failed = "failed",
  Complete = "complete",
  // TODO: Add other statuses
}

export const UPLOAD_FAILED = "upload_failed";
