import { TaxonOption } from "~/components/common/filters/types";
import {
  NO_TECHNOLOGY_SELECTED,
  SEQUENCING_TECHNOLOGY_OPTIONS,
  UPLOAD_WORKFLOWS,
  WORKFLOWS_BY_UPLOAD_SELECTIONS,
} from "~/components/views/SampleUploadFlow/constants";
import { SampleFromApi } from "~/interface/shared";
import { RefSeqAccessionDataType } from "./components/UploadSampleStep/types";
import { INPUT_FILE_TYPES } from "./constants";

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

interface addAdditionalInputFilesToSamplesProps {
  bedFile?: File;
  refSeqFile?: File;
  samples: Partial<SampleFromApi>[];
}

// Create InputFiles for the bedFile and refSeqFile for **each** sample
// i.e. sample.input_files will return actual input fastqs + bedFile + refSeqFile
export const addAdditionalInputFilesToSamples = ({
  samples,
  bedFile,
  refSeqFile,
}: addAdditionalInputFilesToSamplesProps) => {
  if (bedFile) {
    samples.forEach(sample => {
      if (sample.input_files_attributes === undefined) {
        sample.input_files_attributes = [];
      }
      sample.input_files_attributes.push({
        concatenated: [],
        source_type: "local",
        source: bedFile.name,
        parts: bedFile.name,
        upload_client: "web",
        file_type: INPUT_FILE_TYPES.PRIMER_BED,
      });
      if (sample.files === undefined) {
        sample.files = {};
      }
      sample.files[bedFile.name] = bedFile;
    });
  }
  if (refSeqFile) {
    samples.forEach(sample => {
      if (sample.input_files_attributes === undefined) {
        sample.input_files_attributes = [];
      }
      sample.input_files_attributes.push({
        concatenated: [],
        source_type: "local",
        source: refSeqFile.name,
        parts: refSeqFile.name,
        upload_client: "web",
        file_type: INPUT_FILE_TYPES.REFERENCE_SEQUENCE,
      });
      if (sample.files === undefined) {
        sample.files = {};
      }
      sample.files[refSeqFile.name] = refSeqFile;
    });
  }
  return samples;
};

export const redirectToProject = (projectId: number) => {
  location.href = `/home?project_id=${projectId}`;
};
