import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { TaxonOption } from "~/components/common/filters/types";
import {
  NO_TECHNOLOGY_SELECTED,
  SEQUENCING_TECHNOLOGY_OPTIONS,
  UPLOAD_WORKFLOWS,
  WORKFLOWS_BY_UPLOAD_SELECTIONS,
} from "~/components/views/SampleUploadFlow/constants";
import { SampleFromApi } from "~/interface/shared";
import { RefSeqAccessionDataType } from "./components/UploadSampleStep/types";

interface addFlagsToSamplesProps {
  adminOptions: Record<string, string>;
  bedFileName?: string;
  clearlabs: boolean;
  medakaModel: string;
  refSeqAccession?: RefSeqAccessionDataType;
  refSeqFileName?: string;
  refSeqTaxon?: TaxonOption;
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
  bedFileName,
  clearlabs,
  guppyBasecallerSetting,
  medakaModel,
  refSeqAccession,
  refSeqFileName,
  refSeqTaxon,
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

  const isMetagenomics = workflows.has(UPLOAD_WORKFLOWS.MNGS.value);
  const isCovidConsensusGenome = workflows.has(
    UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value,
  );
  const isViralConensusGenome = workflows.has(
    UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value,
  );
  const isNanopore = technology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;
  return samples.map(sample => ({
    ...sample,
    ...adminOptions,
    technology,
    do_not_process: skipSampleProcessing,
    pipeline_execution_strategy: pipelineExecutionStrategy,
    workflows: workflowsConverted,
    // Add mNGS specific fields
    ...(isMetagenomics &&
      isNanopore && {
        guppy_basecaller_setting: guppyBasecallerSetting,
      }),
    // Add Viral CG specific fields
    ...(isViralConensusGenome && {
      ref_fasta: refSeqFileName,
      ...(refSeqAccession && {
        accession_id: refSeqAccession.id,
        accession_name: refSeqAccession.name,
      }),
      ...(refSeqTaxon && {
        taxon_id: refSeqTaxon.id,
        taxon_name: refSeqTaxon.name,
      }),
      ...(bedFileName && {
        primer_bed: bedFileName,
      }),
    }),
    // Add Covid CG specific fields
    ...(isCovidConsensusGenome && {
      wetlab_protocol: wetlabProtocol,
      ...(isNanopore && {
        clearlabs,
        medaka_model: medakaModel,
      }),
    }),
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
