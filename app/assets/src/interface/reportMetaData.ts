export enum PipelineRunStatus {
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  WAITING = "WAITING",
}
export default interface ReportMetadata {
  knownUserError?: string;
  errorMessage?: string;
  alignVizAvailable?: boolean;
  hasByteRanges?: boolean;
  hasErrors?: boolean;
  jobStatus?: string;
  pipelineRunStatus?: PipelineRunStatus;
  reportReady?: boolean;
  preSubsamplingCount?: number;
  postSubsamplingCount?: number;
  truncatedReadsCount?: number;
  taxonWhitelisted?: boolean;
  backgroundId?: number;
}
