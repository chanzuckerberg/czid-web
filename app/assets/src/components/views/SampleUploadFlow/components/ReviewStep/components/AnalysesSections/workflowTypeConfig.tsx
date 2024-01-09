import {
  UploadWorkflowConfigType,
  UploadWorkflows,
} from "~/components/views/SampleUploadFlow/constants";
export const AnalysisSectionsConfig: UploadWorkflowConfigType<{
  showIndexVersion: boolean;
}> = {
  [UploadWorkflows.AMR]: {
    showIndexVersion: false,
  },
  [UploadWorkflows.MNGS]: {
    showIndexVersion: true,
  },
  [UploadWorkflows.VIRAL_CONSENSUS_GENOME]: {
    showIndexVersion: false,
  },
  [UploadWorkflows.COVID_CONSENSUS_GENOME]: {
    showIndexVersion: false,
  },
};
