import { WorkflowConfigType, WorkflowType } from "~/components/utils/workflows";

export const PipelineRunsButtonConfig: WorkflowConfigType<{
  hasPipelineRunsButton: boolean | null;
}> = {
  [WorkflowType.AMR]: {
    hasPipelineRunsButton: true,
  },
  [WorkflowType.CONSENSUS_GENOME]: {
    hasPipelineRunsButton: false,
  },
  [WorkflowType.SHORT_READ_MNGS]: {
    hasPipelineRunsButton: true,
  },
  [WorkflowType.LONG_READ_MNGS]: {
    hasPipelineRunsButton: true,
  },
  [WorkflowType.BENCHMARK]: {
    hasPipelineRunsButton: true,
  },
  [WorkflowType.MERGED_NT_NR]: {
    hasPipelineRunsButton: null,
  },
  [WorkflowType.AMR_DEPRECATED]: {
    hasPipelineRunsButton: null,
  },
};
