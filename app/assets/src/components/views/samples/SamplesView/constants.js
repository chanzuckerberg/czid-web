import { WORKFLOWS } from "~utils/workflows";

export const TRIGGERS = {
  backgroundModel: "backgroundModel",
  heatmap: "heatmap",
  phylogeneticTree: "phylogeneticTree",
  download: "download",
  nextclade: "nextclade",
};

export const WORKFLOW_TRIGGERS = {
  [WORKFLOWS.CONSENSUS_GENOME.value]: [TRIGGERS.nextclade, TRIGGERS.download],
  [WORKFLOWS.SHORT_READ_MNGS.value]: [
    TRIGGERS.backgroundModel,
    TRIGGERS.heatmap,
    TRIGGERS.phylogeneticTree,
    TRIGGERS.download,
  ],
};
