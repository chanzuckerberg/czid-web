export default interface ReportMetadata {
  knownUserError: string;
  errorMessage: string;
  adjustedRemainingReadsCount: number;
  alignVizAvailable: boolean;
  hasByteRanges: boolean;
  hasErrors: boolean;
  jobStatus: string;
  pipelineRunStatus: string;
  reportReady: boolean;
  subsampledReadsCount: number;
  taxonWhitelisted: boolean;
}
