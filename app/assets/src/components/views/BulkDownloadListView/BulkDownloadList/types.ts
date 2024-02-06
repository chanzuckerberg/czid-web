// This type defines an output of a bulk download action.
// The BulkDownloadType defines a bulk download that can be created.
export type BulkDownloadOutputType = {
  analysisCount: number;
  analysisType: string;
  createdAt: string;
  deletedAt: string | null;
  description: string | null;
  downloadName: string;
  downloadType: string;
  ecsTaskArn: string | null;
  errorMessage: string | null;
  executionType: string;
  fileSize: string;
  id: number;
  logUrl: string | null;
  numSamples: number;
  outputFileSize: number;
  params: {
    sampleIds: {
      value: number[];
    };
    workflow: {
      value: string;
    };
  };
  paramsJson: string;
  progress: string | null;
  status: string;
  statusDisplay: string;
  statusType: string;
  tooltipText: string | null;
  updatedAt: string | null;
  userId: number;
  userName: string;
};
