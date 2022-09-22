import { BooleanNums, DateString, NameId, NumberId } from "./generic";

export type HistogramShape = $TSFixMe;
export type GenomeVizShape = $TSFixMe;

export interface OnBLASTClickProps {
  context: { blastedFrom: string };
  pipelineVersion: string;
  sampleId: number;
  shouldBlastContigs: boolean;
  taxName: string;
  taxLevel?: string;
  taxId: number;
  taxonStatsByCountType: {
    ntContigs: number;
    ntReads: number;
    nrContigs: number;
    nrReads: number;
  };
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
}

export interface DownloadTypeParam {
  displayName: string;
  value: unknown;
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

export interface ERCCComparisonShape {
  name: string;
  actual: number;
  expected: number;
}

export type FileList = {
  fileName: string;
  url?: string | null;
}[];

export interface HostGenome extends NameId {
  samples_count: number;
  ercc_only: boolean;
  showAsOption: boolean;
}

export interface InputFile {
  fromStepName?: string;
  files: FileList;
}

export interface PipelineRun {
  id: number;
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
  truncated: null;
  results_finalized: number;
  alignment_config_id: number;
  alert_sent: number;
  dag_vars: string | null;
  assembled: number;
  max_input_fragments: number;
  error_message: string | null;
  known_user_error: null;
  pipeline_execution_strategy: "step_function" | string;
  sfn_execution_arn: string;
  use_taxon_whitelist: boolean;
  wdl_version: string;
  s3_output_prefix: string;
  executed_at: DateString;
  time_to_finalized: number;
  time_to_results_finalized: number;
  qc_percent: number;
  compression_ratio: number;
  deprecated: boolean;
  version: {
    pipeline: string;
    alignment_db: string;
  };
  host_subtracted: string;
}

export interface Project extends NumberId {
  name: string;
  public_access: "Public Project" | "Private Project";
}

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

export interface LocationObject {
  subdivision_name?: string;
  city_name?: string;
  refetch_adjusted_location?: boolean;
  name: string;
  state_name?: string;
  country_name?: string;
  geo_level?: string;
}

export type MetadataValue = string | number | LocationObject;

export interface Sample {
  _selectId: string;
  name: string;
  host_genome_id: string;
  project_id: number;
  status: "created";
  client: string;
  files: {
    [key: string]: {
      arrayBuffer: $TSFixMeFunction;
    };
  };
  input_files_attributes: {
    concatenated: string[];
    parts: string;
    source: string;
    source_type: string;
    upload_client: string;
  }[];
}

export interface SampleType {
  created_at: string;
  group: string;
  human_only: false;
  id: number;
  insect_only: false;
  name: string;
  updated_at: string;
}

export type SampleId = number;

export interface SampleTypeProps {
  name: string;
  group: string;
  insect_only: boolean;
  human_only: boolean;
}

export type SnapshotShareId = string;

export interface TooltipLocation {
  left: number;
  top: number;
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

interface LocationObject {
  city_id: null;
  city_name: string;
  country_code: string;
  country_id: number;
  country_name: string;
  created_at: string;
  geo_level: "subdivision";
  id: number;
  lat: string;
  lng: string;
  locationiq_id: number;
  name: string;
  osm_id: number;
  osm_type: "relation";
  state_id: number;
  state_name: string;
  subdivision_id: number;
  subdivision_name: string;
  updated_at: string;
}

export type Metadata = Record<string, string | LocationObject>;
