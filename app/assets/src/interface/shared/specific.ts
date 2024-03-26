import { AccessionsSummary } from "~/components/common/CoverageVizBottomSidebar/types";
import { WorkflowConfigType } from "~/components/utils/workflows";
import {
  NCBI_INDEX,
  SEQUENCING_TECHNOLOGY_OPTIONS,
} from "~/components/views/SampleUploadFlow/constants";
import { ThresholdFilterData } from "../dropdown";
import { WorkflowRun } from "../sample";
import { BooleanNums, DateString, NameId } from "./generic";
export interface AccessionData {
  best_accessions: AccessionsSummary[];
  num_accessions: number;
}

export enum BulkDownloadStatus {
  // In Progress
  RUNNING = "RUNNING",
  CREATED = "CREATED",
  STARTED = "STARTED",
  PENDING = "PENDING",
  // Succeeded
  SUCCEEDED = "SUCCEEDED",
  // Failed
  SUCCEEDED_WITH_ISSUE = "SUCCEEDED_WITH_ISSUE",
  FAILED = "FAILED",
  TIMED_OUT = "TIMED_OUT",
  ABORTED = "ABORTED",
}
export interface BulkDownloadDetails {
  totalSamples: number;
  url: string;
  fileSize: string;
  status: BulkDownloadStatus;
  downloadType: string;
  errorMessage: string;
  logUrl: string;
  id: string;
  onDownloadClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onDetailsClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  tooltipText: string | null;
  params: {
    [x: string]: { paramType: string; value: string; displayName?: string };
  };
}

export type BulkDownloadType = {
  category?: string;
  description?: string;
  displayName?: string;
  executionType?: string;
  fields?: BulkDownloadFieldType[];
  fileTypeDisplay?: string;
  type?: string;
  workflows?: string[];
  display_name?: string;
  hide_in_creation_modal?: boolean;
  file_type_display?: string;
  admin_only?: boolean;
  required_allowed_feature?: string;
};

export type BulkDownloadFieldType = {
  default_value?: {
    value?: string;
    display_name?: string;
  };
  display_name?: string;
  type?: string;
  options: BulkDownloadFieldOptionType[];
};

export type BulkDownloadFieldOptionType =
  | string
  | { value: string; display_name: string };

export interface ConsensusGenomeData {
  accessionData?: AccessionData;
  percentIdentity?: number;
  taxId?: number;
  taxName?: string;
  usedAccessions?: string[];
  previousRuns?: WorkflowRun[];
}

export interface ERCCComparisonShape {
  name: string | null | undefined;
  actual: number | null | undefined;
  expected: number | null | undefined;
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

export type Metadata = Record<
  string,
  string | LocationObject | null | undefined
>;

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

export type MetadataValue = string | number | LocationObject | null;

export interface PipelineRun {
  id: string | null | undefined;
  wdl_version: string | null | undefined;
  executed_at: DateString | null | undefined;
  sample_id: number | null | undefined;
  created_at: DateString | null | undefined;
  updated_at: DateString | null | undefined;
  job_status: "CHECKED" | string | null | undefined;
  finalized: number | null | undefined;
  total_reads: number | null | undefined;
  adjusted_remaining_reads: number | null | undefined;
  unmapped_reads: number | null | undefined;
  subsample: number | null | undefined;
  pipeline_branch: "master" | string | null | undefined;
  total_ercc_reads: number | null | undefined;
  fraction_subsampled: number | null | undefined;
  pipeline_version: string | null | undefined;
  pipeline_commit: string | null | undefined;
  run_finalized?: boolean | null | undefined;
  truncated: null;
  results_finalized: number | null | undefined;
  alignment_config_name?: string;
  alignment_config_id: number | null | undefined;
  alert_sent: number | null | undefined;
  dag_vars: string | null;
  assembled: number | null | undefined;
  max_input_fragments: number | null | undefined;
  error_message?: string;
  known_user_error?: string;
  pipeline_execution_strategy: "step_function" | string | null | undefined;
  sfn_execution_arn: string | null | undefined;
  use_taxon_whitelist: boolean | null | undefined;
  s3_output_prefix: string | null | undefined;
  technology:
    | SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA
    | SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE
    | string
    | null
    | undefined;
  time_to_finalized: number | null | undefined;
  time_to_results_finalized: number | null | undefined;
  total_bases: number;
  qc_percent: number | null | undefined;
  compression_ratio: number | null | undefined;
  deprecated: boolean | null | undefined;
  version:
    | {
        pipeline: string | null | undefined;
        alignment_db: string | null | undefined;
      }
    | null
    | undefined;
  host_subtracted: string | null | undefined;
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
  id: string;
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
  id: string;
  key: string;
  location_id: number | null;
  location_validated_value?: LocationObject | null;
  date_validated_value: string | null;
  metadata_field_id: number | null;
  number_validated_value: string | null;
  raw_value: string | null;
  sample_id: number | null;
  string_validated_value: string | null;
  updated_at: string | null;
}

export interface SampleFromApi {
  _selectId: string;
  id: number;
  private_until: DateString;
  name: string;
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
