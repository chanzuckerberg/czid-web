export enum PipelineRunStatus {
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  WAITING = "WAITING",
}
interface ReportMetadataSuccess {
  knownUserError?: string;
  errorMessage?: string;
  hasByteRanges?: boolean;
  hasErrors?: boolean;
  jobStatus: string;
  pipelineRunStatus?: PipelineRunStatus;
  reportReady: boolean;
  preSubsamplingCount?: number;
  postSubsamplingCount?: number;
  truncatedReadsCount?: number;
  taxonWhitelisted?: boolean;
  backgroundId: number | null;
}

export type ReportMetadata = ReportMetadataSuccess | Record<string, never>;
