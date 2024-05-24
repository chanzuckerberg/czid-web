import { WorkflowConfigType, WorkflowType } from "~/components/utils/workflows";

type BulkDownloadModalOptionsConfigType = {
  shouldShowCategories: boolean;
};

export const BulkDownloadModalOptionsConfig: WorkflowConfigType<BulkDownloadModalOptionsConfigType> =
  {
    [WorkflowType.AMR]: {
      shouldShowCategories: true,
    },
    [WorkflowType.CONSENSUS_GENOME]: {
      shouldShowCategories: false,
    },
    [WorkflowType.SHORT_READ_MNGS]: {
      shouldShowCategories: true,
    },
    [WorkflowType.LONG_READ_MNGS]: {
      shouldShowCategories: true,
    },
    [WorkflowType.AMR_DEPRECATED]: {
      shouldShowCategories: true,
    },
    [WorkflowType.BENCHMARK]: {
      shouldShowCategories: true,
    },
  };
