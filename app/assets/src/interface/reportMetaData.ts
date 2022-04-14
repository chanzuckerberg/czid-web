export default interface ReportMetadata {
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
