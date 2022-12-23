export default interface ReportMetadata {
  knownUserError?: string;
  errorMessage?: string;
  alignVizAvailable?: boolean;
  hasByteRanges?: boolean;
  hasErrors?: boolean;
  jobStatus?: string;
  pipelineRunStatus?: string;
  reportReady?: boolean;
  preSubsamplingCount?: number;
  postSubsamplingCount?: number;
  taxonWhitelisted?: boolean;
  backgroundId?: number;
}
