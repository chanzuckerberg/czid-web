import { WorkflowConfigType, WorkflowType } from "~/components/utils/workflows";

type SampleViewSaveButtonConfigType = boolean;

export const SampleViewSaveButtonConfig: WorkflowConfigType<SampleViewSaveButtonConfigType> =
  {
    [WorkflowType.AMR]: false,
    [WorkflowType.CONSENSUS_GENOME]: false,
    [WorkflowType.SHORT_READ_MNGS]: true,
    [WorkflowType.LONG_READ_MNGS]: true,
    [WorkflowType.BENCHMARK]: false,
    [WorkflowType.AMR_DEPRECATED]: true,
    [WorkflowType.MERGED_NT_NR]: true,
  };
