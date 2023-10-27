import {
  SAMPLE_VIEW_HEADER_AMR_HELP_SIDEBAR,
  SAMPLE_VIEW_HEADER_CG_HELP_SIDEBAR,
  SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR,
} from "~/components/utils/appcues";
import { WorkflowConfigType, WorkflowType } from "~/components/utils/workflows";

type SampleViewHelpButtonConfigType = {
  isVisible: boolean;
  flowId?: string;
  analyticEventName?: string;
};

export const SampleViewHelpButtonConfig: WorkflowConfigType<SampleViewHelpButtonConfigType> =
  {
    [WorkflowType.AMR]: {
      isVisible: true,
      flowId: SAMPLE_VIEW_HEADER_AMR_HELP_SIDEBAR,
    },
    [WorkflowType.CONSENSUS_GENOME]: {
      isVisible: true,
      flowId: SAMPLE_VIEW_HEADER_CG_HELP_SIDEBAR,
    },
    [WorkflowType.SHORT_READ_MNGS]: {
      isVisible: true,
      flowId: SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR,
    },
    [WorkflowType.LONG_READ_MNGS]: {
      isVisible: false,
    },
    [WorkflowType.BENCHMARK]: {
      isVisible: false,
    },
    [WorkflowType.AMR_DEPRECATED]: {
      isVisible: false,
    },
  };
