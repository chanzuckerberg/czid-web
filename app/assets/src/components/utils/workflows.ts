export type WORKFLOW_VALUES = "amr" | "consensus-genome" | "short-read-mngs";

// Pipeline workflow options
export const WORKFLOW_ENTITIES = {
  SAMPLES: "Samples",
  WORKFLOW_RUNS: "WorkflowRuns",
};

export const WORKFLOWS = {
  AMR: {
    label: "Antimicrobial Resistance",
    value: "amr",
    entity: WORKFLOW_ENTITIES.WORKFLOW_RUNS,
  },
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
};

export const WORKFLOW_KEY_FOR_VALUE = {
  [WORKFLOWS.AMR.value]: "AMR",
  [WORKFLOWS.CONSENSUS_GENOME.value]: "CONSENSUS_GENOME",
  [WORKFLOWS.SHORT_READ_MNGS.value]: "SHORT_READ_MNGS",
};

export const workflowIsWorkflowRunEntity = (workflow: WORKFLOW_VALUES) => {
  const workflowKey = WORKFLOW_KEY_FOR_VALUE[workflow];
  return WORKFLOWS[workflowKey].entity === WORKFLOW_ENTITIES.WORKFLOW_RUNS;
};

export const getWorkflowLabelForWorkflow = (workflow: WORKFLOW_VALUES) => {
  const workflowKey = WORKFLOW_KEY_FOR_VALUE[workflow];
  return WORKFLOWS[workflowKey].label;
};

export const WORKFLOW_ORDER = ["SHORT_READ_MNGS", "CONSENSUS_GENOME", "AMR"];

/**
 *
 * Return key of matched element in WORKFLOWS object
 *
 * ie.
 * toCompare === "Antimicrobial Resistance"
 * keyToFind === "label"
 * Returns "AMR";
 *
 * @param {string} toCompare String to search for within WORKFLOWS values
 * @param {string} keyToSearch Key at which to search
 * @return {string} Key in WORKFLOWS where toCompare was found
 */
export const findInWorkflows = (
  toCompare: string,
  keyToSearch: string,
): string => {
  return Object.keys(WORKFLOWS).find(
    workflow => WORKFLOWS[workflow][keyToSearch] === toCompare,
  );
};
