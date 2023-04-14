import { pullAll } from "lodash/fp";
import { WORKFLOWS } from "~utils/workflows";

enum Domain {
  MyData = "my_data",
  Public = "public",
  AllData = "all_data",
}

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

export const WORKFLOW_TRIGGERS_BY_DOMAIN = {
  [Domain.MyData]: Object.values(TRIGGERS),
  [Domain.Public]: pullAll(
    [TRIGGERS.bulk_kickoff_amr, TRIGGERS.bulk_delete],
    Object.values(TRIGGERS),
  ),
  [Domain.AllData]: Object.values(TRIGGERS),
};

export const SARS_COV_2 = "Severe acute respiratory syndrome coronavirus 2";

export enum PipelineRunStatuses {
  Failed = "failed",
  Complete = "complete",
  // TODO: Add other statuses
}

export const UPLOAD_FAILED = "upload_failed";
