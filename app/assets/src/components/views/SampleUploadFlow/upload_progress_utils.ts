import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { WORKFLOWS } from "~/components/utils/workflows";
import {
  NO_TECHNOLOGY_SELECTED,
  SEQUENCING_TECHNOLOGY_OPTIONS,
  WORKFLOWS_BY_UPLOAD_SELECTIONS,
} from "~/components/views/SampleUploadFlow/constants";
import { SampleFromApi } from "~/interface/shared";

interface addFlagsToSamplesProps {
  adminOptions: Record<string, string>;
  clearlabs: boolean;
  medakaModel: string;
  samples: Partial<SampleFromApi>[];
  skipSampleProcessing: boolean;
  technology: string;
  workflows: Set<string>;
  wetlabProtocol: string;
  useStepFunctionPipeline: boolean;
  guppyBasecallerSetting?: string;
}

// Add flags selected by the user in the upload review Step
export const addFlagsToSamples = ({
  adminOptions,
  clearlabs,
  guppyBasecallerSetting,
  medakaModel,
  samples,
  useStepFunctionPipeline,
  skipSampleProcessing,
  technology,
  workflows,
  wetlabProtocol,
}: addFlagsToSamplesProps) => {
  const PIPELINE_EXECUTION_STRATEGIES = {
    directed_acyclic_graph: "directed_acyclic_graph",
    step_function: "step_function",
  };

  const pipelineExecutionStrategy = useStepFunctionPipeline
    ? PIPELINE_EXECUTION_STRATEGIES.step_function
    : PIPELINE_EXECUTION_STRATEGIES.directed_acyclic_graph;

  // Converts UPLOAD_WORKFLOWS values to WORKFLOWS values, based on the selected workflow and technology
  const selectedTechnology = technology || NO_TECHNOLOGY_SELECTED;
  const workflowsConverted = Array.from(workflows).map(
    workflow => WORKFLOWS_BY_UPLOAD_SELECTIONS[workflow][selectedTechnology],
  );

  const isLongReadMngs = workflowsConverted.includes(
    WORKFLOWS.LONG_READ_MNGS.value,
  );
  const isConsensusGenomeNanopore =
    workflowsConverted.includes(WORKFLOWS.CONSENSUS_GENOME.value) &&
    technology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;

  return samples.map(sample => ({
    ...sample,
    do_not_process: skipSampleProcessing,
    ...(isConsensusGenomeNanopore && {
      clearlabs,
      medaka_model: medakaModel,
    }),
    ...(isLongReadMngs && {
      guppy_basecaller_setting: guppyBasecallerSetting,
    }),
    pipeline_execution_strategy: pipelineExecutionStrategy,
    technology,
    wetlab_protocol: wetlabProtocol,
    workflows: workflowsConverted,
    ...adminOptions,
  }));
};

export const logUploadStepError = ({
  step,
  erroredSamples,
  uploadType,
  errors,
}: {
  step: $TSFixMeUnknown;
  erroredSamples: $TSFixMeUnknown;
  uploadType: $TSFixMeUnknown;
  errors: $TSFixMeUnknown;
}) => {
  trackEvent(
    ANALYTICS_EVENT_NAMES.LOCAL_UPLOAD_PROGRESS_MODAL_UPLOAD_STEP_ERROR,
    {
      erroredSamples,
      step,
      uploadType,
      errors,
    },
  );
};

export const redirectToProject = (projectId: number) => {
  location.href = `/home?project_id=${projectId}`;
};
