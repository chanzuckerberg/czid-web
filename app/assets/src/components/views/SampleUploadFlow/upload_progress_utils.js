import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { CG_TECHNOLOGY_OPTIONS } from "~/components/views/SampleUploadFlow/constants";

// Add flags selected by the user in the upload review Step
export const addFlagsToSamples = ({
  adminOptions,
  clearlabs,
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

  return samples.map(sample => ({
    ...sample,
    do_not_process: skipSampleProcessing,
    ...(technology === CG_TECHNOLOGY_OPTIONS.NANOPORE && {
      clearlabs,
      medaka_model: medakaModel,
    }),
    pipeline_execution_strategy: pipelineExecutionStrategy,
    technology,
    wetlab_protocol: wetlabProtocol,
    workflows: Array.from(workflows),
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
