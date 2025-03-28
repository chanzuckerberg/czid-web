// Pipeline workflow options
export const WORKFLOW_ENTITIES = {
  SAMPLES: "Samples" as const,
  WORKFLOW_RUNS: "WorkflowRuns" as const,
};

// String constants
const ANTIMICROBIAL_RESISTANCE = "Antimicrobial Resistance";
const AMR_DEPRECATED = "Antimicrobial Resistance (Deprecated)";

/**
 * WORKFLOW TYPES
 */
export enum WorkflowType {
  AMR = "amr",
  CONSENSUS_GENOME = "consensus-genome",
  SHORT_READ_MNGS = "short-read-mngs",
  LONG_READ_MNGS = "long-read-mngs",
  BENCHMARK = "benchmark",
  AMR_DEPRECATED = "amr-deprecated",
}

export type NonDeprecatedWorkflowType = Exclude<
  WorkflowType,
  WorkflowType.AMR_DEPRECATED
>;

export type WorkflowConfigType<T> = Record<Required<WorkflowType>, T>;

export type WorkflowCount = {
  [key in NonDeprecatedWorkflowType]?: number;
};

type WorkflowStrings = {
  label: WorkflowLabelType;
  pluralizedLabel: string;
  entity: string;
  pipelineName: string;
  shorthand: string;
};

export type WorkflowLabelType =
  | "Antimicrobial Resistance"
  | "Consensus Genome"
  | "Metagenomic"
  | "Nanopore"
  | "Benchmark"
  | "Antimicrobial Resistance (Deprecated)"
  | "Metagenomics - Simplified";

export const WORKFLOWS: WorkflowConfigType<WorkflowStrings> = {
  [WorkflowType.AMR]: {
    label: ANTIMICROBIAL_RESISTANCE,
    pluralizedLabel: ANTIMICROBIAL_RESISTANCE,
    entity: WORKFLOW_ENTITIES.WORKFLOW_RUNS,
    pipelineName: ANTIMICROBIAL_RESISTANCE,
    shorthand: "AMR",
  },
  [WorkflowType.CONSENSUS_GENOME]: {
    label: "Consensus Genome" as const,
    pluralizedLabel: "Consensus Genomes",
    entity: WORKFLOW_ENTITIES.WORKFLOW_RUNS,
    pipelineName: "Consensus Genome",
    shorthand: "CG",
  },
  [WorkflowType.SHORT_READ_MNGS]: {
    label: "Metagenomic" as const,
    pluralizedLabel: "Metagenomics",
    entity: WORKFLOW_ENTITIES.SAMPLES,
    pipelineName: "Illumina mNGS",
    shorthand: "mNGS",
  },
  [WorkflowType.LONG_READ_MNGS]: {
    label: "Nanopore" as const,
    pluralizedLabel: "Metagenomics - Nanopore",
    entity: WORKFLOW_ENTITIES.SAMPLES,
    pipelineName: "Nanopore mNGS",
    shorthand: "mNGS",
  },
  [WorkflowType.BENCHMARK]: {
    label: "Benchmark" as const,
    pluralizedLabel: "Benchmarks",
    entity: WORKFLOW_ENTITIES.WORKFLOW_RUNS,
    pipelineName: "Benchmark",
    shorthand: "BM",
  },
  [WorkflowType.AMR_DEPRECATED]: {
    label: AMR_DEPRECATED,
    pluralizedLabel: AMR_DEPRECATED,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    entity: null,
    pipelineName: AMR_DEPRECATED,
    shorthand: "AMR (Deprecated)",
  },
};

const TAB_SHORTHAND_CONFIG: WorkflowConfigType<[string, WorkflowLabelType]> = {
  [WorkflowType.SHORT_READ_MNGS]: [
    "SHORT_READ_MNGS",
    WORKFLOWS[WorkflowType.SHORT_READ_MNGS].label,
  ],
  [WorkflowType.LONG_READ_MNGS]: [
    "LONG_READ_MNGS",
    WORKFLOWS[WorkflowType.LONG_READ_MNGS].label,
  ],
  [WorkflowType.CONSENSUS_GENOME]: [
    "CONSENSUS_GENOME",
    WORKFLOWS[WorkflowType.CONSENSUS_GENOME].label,
  ],
  [WorkflowType.AMR]: ["AMR", WORKFLOWS[WorkflowType.AMR].label],
  [WorkflowType.BENCHMARK]: [
    "BENCHMARK",
    WORKFLOWS[WorkflowType.BENCHMARK].label,
  ],
  [WorkflowType.AMR_DEPRECATED]: [
    "AMR_DEPRECATED",
    WORKFLOWS[WorkflowType.AMR_DEPRECATED].label,
  ],
};

// WORKFLOW_TABS is used to quickly compare workflow labels.
// It is meant to be used with the syntax WORKFLOW_TABS.SHORT_READ_MNGS
// It is not meant to be used to look up labels, for that use WORKFLOWS
// i.e. use workflowLabel = WORKFLOWS[workflow]?.label
// Do not use workflowLabel = WORKFLOW_TABS[workflow] <-- this doesn't work
// because workflow is a WorkflowType like "short-read-mngs" and not a key like "SHORT_READ_MNGS"
export const WORKFLOW_TABS = Object.fromEntries(
  Object.values(TAB_SHORTHAND_CONFIG),
);

export const workflowIsWorkflowRunEntity = (workflowValue: WorkflowType) => {
  return WORKFLOWS[workflowValue].entity === WORKFLOW_ENTITIES.WORKFLOW_RUNS;
};

export const getShorthandFromWorkflow = (workflowValue: WorkflowType) => {
  return WORKFLOWS[workflowValue].shorthand;
};

export const mngsWorkflows = [
  WorkflowType.SHORT_READ_MNGS,
  WorkflowType.LONG_READ_MNGS,
] as string[];

export const isMngsWorkflow = (workflow: WorkflowType) =>
  mngsWorkflows.includes(workflow);

export const getWorkflowTypeFromLabel = (
  label: WorkflowLabelType,
): WorkflowType => {
  // TODO: we should remove these so we don't have to deal with this weirdness
  const otherMngsTabLabels = [
    "Antimicrobial Resistance (Deprecated)",
    "Metagenomics - Simplified",
  ] as string[];
  if (otherMngsTabLabels.includes(label)) {
    label = "Metagenomic";
  }
  return Object.keys(WORKFLOWS).find(
    key => WORKFLOWS[key].label === label,
  ) as WorkflowType;
};
