import { isEmpty } from "lodash/fp";
import {
  WorkflowConfigType,
  WorkflowType,
  WORKFLOW_TABS,
} from "~/components/utils/workflows";
import { SampleId } from "~/interface/shared";

type SampleViewOverflowMenuConfigType = ({
  currentRun,
  currentTab,
  reportMetadata,
  sample,
}) => {
  isVisible: boolean;
  deleteId?: SampleId;
  readyToDelete?: boolean;
  isShortReadMngs?: boolean;
};

export const SampleViewOverflowMenuConfig: WorkflowConfigType<SampleViewOverflowMenuConfigType> =
  {
    [WorkflowType.AMR]: ({ currentRun, sample }) => ({
      deleteId: currentRun?.id,
      isVisible: true,
      readyToDelete: !!currentRun || !!sample?.upload_error,
    }),
    [WorkflowType.CONSENSUS_GENOME]: ({ currentRun, sample }) => ({
      deleteId: currentRun?.id,
      isVisible: true,
      readyToDelete: !!currentRun || !!sample?.upload_error,
    }),
    [WorkflowType.SHORT_READ_MNGS]: ({
      reportMetadata,
      currentTab,
      sample,
    }) => ({
      deleteId: sample?.id,
      isVisible: currentTab !== WORKFLOW_TABS.AMR_DEPRECATED,
      readyToDelete: !isEmpty(reportMetadata),
      isShortReadMngs: true,
    }),
    [WorkflowType.LONG_READ_MNGS]: ({ reportMetadata, sample }) => ({
      deleteId: sample?.id,
      isVisible: true,
      readyToDelete: !isEmpty(reportMetadata),
    }),
    [WorkflowType.BENCHMARK]: ({ currentRun, sample }) => ({
      deleteId: currentRun?.id,
      isVisible: true,
      readyToDelete: !!currentRun || !!sample?.upload_error,
    }),
    [WorkflowType.AMR_DEPRECATED]: () => ({
      isVisible: false,
    }),
  };
