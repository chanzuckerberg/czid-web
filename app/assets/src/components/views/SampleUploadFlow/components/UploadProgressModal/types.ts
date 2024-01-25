export interface PathToFile {
  id: number;
  name: string;
  s3_bucket: string;
  s3_file_path: string;
}
export interface BulkUploadWithMetadata {
  samples: SampleForUpload[];
  sampleIds: number[];
  errors: $TSFixMeUnknown[];
  errored_sample_names: string[];
}

export interface SampleForUpload {
  filesToUpload: Array<File>;
  id: number;
  name: string;
  input_files?: PathToFile[];
}
