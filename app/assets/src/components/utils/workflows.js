// Pipeline workflow options
export const WORKFLOW_ENTITIES = {
  SAMPLES: "Samples",
  WORKFLOW_RUNS: "WorkflowRuns",
};

export const WORKFLOWS = {
  CONSENSUS_GENOME: {
    label: "Consensus Genome",
    value: "consensus-genome",
    entity: WORKFLOW_ENTITIES.WORKFLOW_RUNS,
  },
  SHORT_READ_MNGS: {
    label: "Metagenomic",
    value: "short-read-mngs",
    entity: WORKFLOW_ENTITIES.SAMPLES,
  },
  AMR: {
    label: "Antimicrobial Resistance",
    value: "amr",
    entity: WORKFLOW_ENTITIES.WORKFLOW_RUNS,
  },
};

export const WORKFLOW_ORDER = ["SHORT_READ_MNGS", "CONSENSUS_GENOME", "AMR"];
