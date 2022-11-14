import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { WORKFLOWS } from "~/components/utils/workflows";
import {
  CG_TECHNOLOGY_OPTIONS,
  NANOPORE,
} from "~/components/views/SampleUploadFlow/constants";

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
}) => {
  const PIPELINE_EXECUTION_STRATEGIES = {
    directed_acyclic_graph: "directed_acyclic_graph",
    step_function: "step_function",
  };

  const pipelineExecutionStrategy = useStepFunctionPipeline
    ? PIPELINE_EXECUTION_STRATEGIES.step_function
    : PIPELINE_EXECUTION_STRATEGIES.directed_acyclic_graph;

  const isLongReadMngs =
    workflows.has(WORKFLOWS.SHORT_READ_MNGS.value) && technology === NANOPORE;
  const isNanoporeConsensusGenome =
    workflows.has(WORKFLOWS.CONSENSUS_GENOME.value) &&
    technology === CG_TECHNOLOGY_OPTIONS.NANOPORE;

  return samples.map(sample => ({
    ...sample,
    do_not_process: skipSampleProcessing,
    ...(isNanoporeConsensusGenome && {
      clearlabs,
      medaka_model: medakaModel,
    }),
    ...(isLongReadMngs && {
      guppy_basecaller_setting: guppyBasecallerSetting,
    }),
    pipeline_execution_strategy: pipelineExecutionStrategy,
    technology,
    wetlab_protocol: wetlabProtocol,
    // TODO: Because long-read-mngs is hidden behind the ont_v1 feature flag, we still by default assume that mngs workflows
    // are short-read-mngs. For now, if beta users select long-reads-mngs, we will overwrite the workflows variable below.
    // After ont_v1 is released, we should remove the logic for defaulting to short-read-mngs and overhaul this approach.
    workflows: isLongReadMngs
      ? [WORKFLOWS.LONG_READ_MNGS.value]
      : Array.from(workflows),
    ...adminOptions,
  }));
};

export const logUploadStepError = ({
  step,
  erroredSamples,
  uploadType,
  errors,
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

export const redirectToProject = projectId => {
  location.href = `/home?project_id=${projectId}`;
};
