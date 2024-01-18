import { AccessionsSummary } from "~/components/common/CoverageVizBottomSidebar/types";
import { WorkflowConfigType } from "~/components/utils/workflows";
import {
  NCBI_INDEX,
  SEQUENCING_TECHNOLOGY_OPTIONS,
} from "~/components/views/SampleUploadFlow/constants";
import { ThresholdFilterData } from "../dropdown";
import { BooleanNums, DateString, NameId, NumberId } from "./generic";
export interface AccessionData {
  best_accessions: AccessionsSummary[];
  num_accessions: number;
}
export interface BulkDownloadDetails extends NumberId {
  num_samples: number;
  params: { [key: string]: DownloadTypeParam };
  presigned_output_url: string;
  download_name: string;
  file_size: string;
  status: "success" | "waiting" | "running" | "error";
  download_type: string;
  pipeline_runs: { id: number; sample_name: string }[];
  workflow_runs: Array<$TSFixMe>;
  description: string;
  error_message: string;
  execution_type: string;
  log_url: string;
}

export type BulkDownloadType = {
  category?: string;
  description?: string;
  displayName?: string;
  executionType?: string;
  fields?: BulkDownloadTypeField[];
  fileTypeDisplay?: string;
  type?: string;
  workflows?: string[];
  display_name?: string;
  hide_in_creation_modal?: boolean;
  file_type_display?: string;
  admin_only?: boolean;
  required_allowed_feature?: string;
};

export type BulkDownloadTypeField = {
  default_value?: {
    value?: string;
    display_name?: string;
  };
  display_name?: string;
  type?: string;
  options: {
    value: string;
    display_name: string;
  }[];
};

export interface ConsensusGenomeData {
  accessionData?: AccessionData;
  percentIdentity?: number;
  taxId?: number;
  taxName?: string;
  usedAccessions?: string[];
  previousRuns?: object[];
}

export interface DownloadType {
  display_name: string;
  admin_only: boolean;
  description: string;
  category: string;
  fields: {
    type: string;
    display_name: string;
  }[];
  uploader_only: boolean;
  required_allowed_feature: string;
  file_type_display: string;
}

export interface DownloadTypeParam {
  displayName: string;
  value: unknown;
}

export interface ERCCComparisonShape {
  name: string;
  actual: number;
  expected: number;
}

export type FileList = {
  fileName: string;
  url?: string | null;
}[];

export type GenomeVizShape = $TSFixMe;

export type HistogramShape = $TSFixMe;

export interface HostGenome extends NameId {
  samples_count: number;
  ercc_only: boolean;
  showAsOption: boolean;
}

export interface InputFile {
  fromStepName?: string;
  files: FileList;
}

export interface LocationObject {
  subdivision_name?: string;
  city_name?: string;
  refetch_adjusted_location?: boolean;
  name: string;
  state_name?: string;
  country_name?: string;
  geo_level?: string;
}

export type Metadata = Record<string, string | LocationObject>;

export interface MetadataBasic {
  headers?: string[];
  rows?: Record<string, any>[];
}

export interface MetadataType {
  dataType: string;
  default_for_new_host_genome?: 0;
  description?: string | null;
  examples?: { [key: number]: string[] } | null;
  group?: string | null;
  host_genome_ids?: number[];
  isBoolean?: boolean;
  is_required?: BooleanNums;
  key: string;
  name: string;
  options?: string[] | null;
}

export type MetadataTypes = {
  [key: string]: MetadataType;
};

export type MetadataValue = string | number | LocationObject;

export interface PipelineRun {
  id: number;
  wdl_version: string;
  executed_at: DateString;
  sample_id: number;
  created_at: DateString;
  updated_at: DateString;
  job_status: "CHECKED" | string;
  finalized: number;
  total_reads: number;
  adjusted_remaining_reads: number;
  unmapped_reads: number | null;
  subsample: number;
  pipeline_branch: "master" | string;
  total_ercc_reads: number;
  fraction_subsampled: number;
  pipeline_version: string;
  pipeline_commit: string;
  run_finalized: boolean;
  truncated: null;
  results_finalized: number;
  alignment_config_name: string;
  alignment_config_id: number;
  alert_sent: number;
  dag_vars: string | null;
  assembled: number;
  max_input_fragments: number;
  error_message?: string;
  known_user_error?: string;
  pipeline_execution_strategy: "step_function" | string;
  sfn_execution_arn: string;
  use_taxon_whitelist: boolean;
  s3_output_prefix: string;
  technology:
    | SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA
    | SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;
  time_to_finalized: number;
  time_to_results_finalized: number;
  total_bases: number;
  qc_percent: number;
  compression_ratio: number;
  deprecated: boolean;
  version: {
    pipeline: string;
    alignment_db: string;
  };
  host_subtracted: string;
  guppy_basecaller_setting: string | null;
}

export type PipelineVersions = WorkflowConfigType<string | undefined> &
  Record<Required<typeof NCBI_INDEX>, string | undefined>;

export interface PipelineVersionResponse {
  projectPipelineVersions: PipelineVersions;
  latestMajorPipelineVersions: PipelineVersions;
}

export interface Project {
  created_at?: DateString;
  creator?: string;
  creator_id?: number;
  description?: string;
  editable: boolean;
  hosts?: string[];
  id: number;
  locations?: string[];
  number_of_samples?: number;
  name: string;
  owner?: string;
  public_access?: 1 | 0;
  sample_counts?: { [key: string]: number };
  tissues?: string[];
  users?: { email: string; name: string }[];
}

export interface RawMetadata {
  base_type: "date" | "location";
  created_at: string;
  id: number;
  key: string;
  location_id: number | null;
  location_validated_value?: LocationObject;
  date_validated_value: null;
  metadata_field_id: number;
  number_validated_value: null;
  raw_value: string;
  sample_id: number;
  string_validated_value: null;
  updated_at: string;
}

export interface SampleFromApi {
  _selectId: string;
  id: number;
  private_until: DateString;
  name?: string;
  host_genome_id: number;
  host_genome_name: string;
  ercc_only: boolean;
  project_id?: number | string;
  created_at: DateString;
  status?: string;
  client: string;
  files?: Record<string, File>;
  input_files_attributes?: {
    concatenated: string[];
    parts: string;
    source: string;
    source_type?: string;
    name?: string;
    upload_client?: string;
    file_type: string;
  }[];
  finishedValidating?: boolean;
  isValid?: boolean;
  error?: string;
  format?: string;
  // Basespace samples only.
  file_size?: number;
  file_type?: string;
  basespace_project_name?: string;
  basespace_project_id?: string;
  basespace_dataset_id?: number;
}

export type SampleId = number | string;

export interface SampleType {
  created_at: string;
  group: string;
  human_only: false;
  id: number;
  insect_only: false;
  name: string;
  updated_at: string;
}

export interface SelectedOptions {
  species?: number;
  categories?: string[];
  subcategories?: Subcategories;
  metric?: string;
  background?: number | null;
  thresholdFilters?: ThresholdFilterData[];
  readSpecificity?: number;
  sampleSortType?: string;
  taxaSortType?: string;
  dataScaleIdx?: number;
  taxonsPerSample?: number;
  presets?: string[];
  taxonTags?: string[];
}

export interface Subcategories {
  Viruses?: string[];
}

export type AnnotationType = "not_a_hit" | "hit" | "inconclusive" | "none";

export type TaxonLevelType = "genus" | "species";

export interface Taxon {
  agg_score?: $TSFixMeUnknown;
  annotation?: AnnotationType;
  category: string;
  common_name: string;
  genus_tax_id: string;
  is_phage: boolean;
  displayName: string;
  max_z_score?: number;
  name: string;
  nr: NR;
  filteredSpecies?: Taxon[];
  highlightedChildren?: boolean;
  highlighted?: boolean;
  passedFilters?: boolean;
  pathogens?: Record<string, any> | null;
  species?: Taxon[];
  genus?: Taxon;
  species_annotations?: {
    hit: number;
    inconclusive: number;
    not_a_hit: number;
  };
  species_tax_ids?: number[];
  taxId: number;
  taxLevel?: TaxonLevelType;
  pathogenFlag: string;
  pathogenFlags: string[];
  lineageRank?: string;
}

export interface NR {
  alignment_length: number;
  bg_mean: number;
  bg_mean_mass_normalized?: $TSFixMeUnknown;
  bg_stdev: number;
  bg_stdev_mass_normalized?: $TSFixMeUnknown;
  count: number;
  e_value: number;
  percent_identity: number;
  rpm: number;
  source_count_type?: $TSFixMeUnknown;
  z_score: number;
}

export interface Background {
  created_at: DateString;
  description: string;
  id: number;
  mass_normalized: boolean;
  name: string;
  public_access?: boolean;
  ready: 0 | 1;
  updated_at: DateString;
  user_id: boolean;
  alignment_config_names: string[];
}

export interface SampleTypeProps {
  name: string;
  group: string;
  insect_only: boolean;
  human_only: boolean;
}

export type SampleUploadType = "basespace" | "local" | "remote";

export type SnapshotShareId = string;

export interface SummaryStats {
  adjusted_remaining_reads: number;
  compression_ratio: number;
  qc_percent: number;
  percent_remaining: number;
  unmapped_reads: number | null;
  insert_size_mean: number;
  insert_size_standard_deviation: number;
  last_processed_at: DateString;
  reads_after_star: number;
  reads_after_trimmomatic: number;
  reads_after_priceseq: number;
  reads_after_czid_dedup: number;
}

export interface TooltipLocation {
  left: number;
  top: number;
}
