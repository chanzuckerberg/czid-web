import {
  AMR_PIPELINE_GITHUB_LINK,
  AMR_UPLOAD_LINK,
  MNGS_ILLUMINA_UPLOAD_LINK,
  MNGS_NANOPORE_UPLOAD_LINK,
  SARS_COV_2_UPLOAD_LINK,
  VIRAL_CONSENSUS_GENOME_UPLOAD_LINK,
  WORKFLOWS_CHANGELOG_LINK,
} from "~/components/utils/documentationLinks";
import { WorkflowType } from "~/components/utils/workflows";
import {
  UploadWorkflowLinkConfigType,
  UploadWorkflows,
} from "~/components/views/SampleUploadFlow/constants";
export const WorkflowLinksConfig: UploadWorkflowLinkConfigType<{
  pipelineVersionLink: string;
  warningLink: string;
}> = {
  [UploadWorkflows.AMR]: {
    pipelineVersionLink: AMR_UPLOAD_LINK,
    warningLink: AMR_PIPELINE_GITHUB_LINK,
  },
  [WorkflowType.SHORT_READ_MNGS]: {
    pipelineVersionLink: MNGS_ILLUMINA_UPLOAD_LINK,
    warningLink: WORKFLOWS_CHANGELOG_LINK,
  },
  [WorkflowType.LONG_READ_MNGS]: {
    pipelineVersionLink: MNGS_NANOPORE_UPLOAD_LINK,
    warningLink: WORKFLOWS_CHANGELOG_LINK,
  },
  [UploadWorkflows.VIRAL_CONSENSUS_GENOME]: {
    pipelineVersionLink: VIRAL_CONSENSUS_GENOME_UPLOAD_LINK,
    warningLink: WORKFLOWS_CHANGELOG_LINK,
  },
  [UploadWorkflows.COVID_CONSENSUS_GENOME]: {
    pipelineVersionLink: SARS_COV_2_UPLOAD_LINK,
    warningLink: WORKFLOWS_CHANGELOG_LINK,
  },
};
