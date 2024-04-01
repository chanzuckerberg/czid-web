import {
  isPipelineFeatureAvailable,
  LONG_READ_MNGS_COV_VIS_WITH_ONE_READ,
} from "~/components/utils/pipeline_versions";
import { WorkflowConfigType, WorkflowType } from "~/components/utils/workflows";

const CONTIG_REQUIRED_MESSAGE =
  "Sorry, the coverage visualization is only available for taxa with at least one assembled contig in NT.";
const READ_REQUIRED_MESSAGE =
  "Sorry, the coverage visualization is only available for taxa with at least one assembled NT read.";

export interface CoverageVizBottomSidebarConfigType {
  getUnavailableMessage: ((version?: string | null) => string) | null;
  isReadLevelVizAvailable: boolean;
}

export const CoverageVizBottomSidebarConfig: WorkflowConfigType<CoverageVizBottomSidebarConfigType> =
  {
    [WorkflowType.AMR]: {
      getUnavailableMessage: null,
      isReadLevelVizAvailable: false,
    },
    [WorkflowType.AMR_DEPRECATED]: {
      getUnavailableMessage: null,
      isReadLevelVizAvailable: false,
    },
    [WorkflowType.BENCHMARK]: {
      getUnavailableMessage: null,
      isReadLevelVizAvailable: false,
    },
    [WorkflowType.CONSENSUS_GENOME]: {
      getUnavailableMessage: null,
      isReadLevelVizAvailable: false,
    },
    [WorkflowType.LONG_READ_MNGS]: {
      getUnavailableMessage: (version: string) =>
        isPipelineFeatureAvailable(
          LONG_READ_MNGS_COV_VIS_WITH_ONE_READ,
          version,
        )
          ? READ_REQUIRED_MESSAGE
          : CONTIG_REQUIRED_MESSAGE,
      isReadLevelVizAvailable: false,
    },
    [WorkflowType.SHORT_READ_MNGS]: {
      getUnavailableMessage: () => CONTIG_REQUIRED_MESSAGE,
      isReadLevelVizAvailable: true,
    },
  };
