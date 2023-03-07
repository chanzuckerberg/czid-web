// Pipeline workflow options
export const WORKFLOW_ENTITIES = {
  SAMPLES: "Samples" as const,
  WORKFLOW_RUNS: "WorkflowRuns" as const,
};

export const WORKFLOWS = {
  AMR: {
    label: "Antimicrobial Resistance" as const,
    pluralizedLabel: "Antimicrobial Resistance",
    value: "amr" as const,
    entity: WORKFLOW_ENTITIES.WORKFLOW_RUNS,
    pipelineName: "Antimicrobial Resistance",
    shorthand: "AMR",
  },
  CONSENSUS_GENOME: {
    label: "Consensus Genome" as const,
    pluralizedLabel: "Consensus Genomes",
    value: "consensus-genome" as const,
    entity: WORKFLOW_ENTITIES.WORKFLOW_RUNS,
    pipelineName: "Consensus Genome",
    shorthand: "CG",
  },
  SHORT_READ_MNGS: {
    label: "Metagenomic" as const,
    pluralizedLabel: "Metagenomics",
    value: "short-read-mngs" as const,
    entity: WORKFLOW_ENTITIES.SAMPLES,
    pipelineName: "Illumina mNGS",
    shorthand: "mNGS",
  },
  LONG_READ_MNGS: {
    label: "Nanopore" as const,
    pluralizedLabel: "Metagenomics - Nanopore",
    value: "long-read-mngs" as const,
    entity: WORKFLOW_ENTITIES.SAMPLES,
    pipelineName: "Nanopore mNGS",
    shorthand: "mNGS",
  },
};

export const WORKFLOW_KEY_FOR_VALUE = {
  [WORKFLOWS.AMR.value]: "AMR" as const,
  [WORKFLOWS.CONSENSUS_GENOME.value]: "CONSENSUS_GENOME" as const,
  [WORKFLOWS.SHORT_READ_MNGS.value]: "SHORT_READ_MNGS" as const,
  [WORKFLOWS.LONG_READ_MNGS.value]: "LONG_READ_MNGS" as const,
};

export const workflowIsWorkflowRunEntity = (workflow: WORKFLOW_VALUES) => {
  const workflowKey = WORKFLOW_KEY_FOR_VALUE[workflow];
  return WORKFLOWS[workflowKey].entity === WORKFLOW_ENTITIES.WORKFLOW_RUNS;
};

export const WORKFLOW_ORDER = [
  "SHORT_READ_MNGS" as const,
  "LONG_READ_MNGS" as const,
  "CONSENSUS_GENOME" as const,
  "AMR" as const,
];

export const workflowIsBeta = (workflow: keyof typeof WORKFLOWS) => {
  return ["AMR", "LONG_READ_MNGS"].includes(workflow);
};

export const getShorthandFromWorkflow = (workflow: WORKFLOW_VALUES) => {
  const workflowKey = WORKFLOW_KEY_FOR_VALUE[workflow];
  return WORKFLOWS[workflowKey].shorthand;
};

export const getLabelFromWorkflow = (workflow: WORKFLOW_VALUES) => {
  const workflowKey = WORKFLOW_KEY_FOR_VALUE[workflow];
  return WORKFLOWS[workflowKey].label;
};

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
  keyToSearch: WorkflowAttrs,
): Workflows[WorkflowKeys][typeof keyToSearch] => {
  return Object.keys(WORKFLOWS).find(
    workflow => WORKFLOWS[workflow][keyToSearch] === toCompare,
  );
};

export const labelToVal = (label: string) =>
  WORKFLOWS[findInWorkflows(label, "label")].value;

/**
 * WORKFLOW TYPES
 */

export type MetagenomicTabsSample =
  | "Metagenomic"
  | "Antimicrobial Resistance (Deprecated)"
  | "Metagenomics - Simplified";

export type WorkflowTabsSample =
  | "Consensus Genome"
  | "Antimicrobial Resistance";

export type LongReadTabsSample = "Nanopore";

export type WorkflowCount = {
  [key in WORKFLOW_VALUES]?: number;
};

type Workflows = typeof WORKFLOWS;
type WorkflowKeys = keyof Workflows;
export type WORKFLOW_VALUES = Workflows[WorkflowKeys]["value"];
export type WORKFLOW_LABELS = Workflows[WorkflowKeys]["label"];
type WorkflowAttrs = keyof Workflows[WorkflowKeys];
