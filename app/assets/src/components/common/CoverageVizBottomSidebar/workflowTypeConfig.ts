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
  getUnavailableMessage?: (version?: string) => string;
}

export const CoverageVizBottomSidebarConfig: WorkflowConfigType<CoverageVizBottomSidebarConfigType> =
  {
    [WorkflowType.AMR]: {},
    [WorkflowType.AMR_DEPRECATED]: {},
    [WorkflowType.BENCHMARK]: {},
    [WorkflowType.CONSENSUS_GENOME]: {},
    [WorkflowType.LONG_READ_MNGS]: {
      getUnavailableMessage: (version: string) =>
        isPipelineFeatureAvailable(
          LONG_READ_MNGS_COV_VIS_WITH_ONE_READ,
          version,
        )
          ? READ_REQUIRED_MESSAGE
          : CONTIG_REQUIRED_MESSAGE,
    },
    [WorkflowType.SHORT_READ_MNGS]: {
      getUnavailableMessage: () => CONTIG_REQUIRED_MESSAGE,
    },
  };
