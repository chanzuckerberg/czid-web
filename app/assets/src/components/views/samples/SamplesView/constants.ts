import { WORKFLOWS } from "~utils/workflows";

export const TRIGGERS = {
  backgroundModel: "backgroundModel",
  genepi: "genepi",
  heatmap: "heatmap",
  phylogeneticTree: "phylogeneticTree",
  download: "download",
  nextclade: "nextclade",
  bulk_kickoff_amr: "bulk_kickoff_amr",
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
    TRIGGERS.phylogeneticTree,
    TRIGGERS.download,
    TRIGGERS.bulk_delete,
    TRIGGERS.bulk_kickoff_amr,
  ],
  [WORKFLOWS.AMR.value]: [TRIGGERS.download, TRIGGERS.bulk_delete],
  [WORKFLOWS.LONG_READ_MNGS.value]: [TRIGGERS.download, TRIGGERS.bulk_delete],
};

export const SARS_COV_2 = "Severe acute respiratory syndrome coronavirus 2";
export const WGS = "Viral CG Upload";

export enum PipelineRunStatuses {
  Failed = "failed",
  Complete = "complete",
  // TODO: Add other statuses
}

export const UPLOAD_FAILED = "upload_failed";
