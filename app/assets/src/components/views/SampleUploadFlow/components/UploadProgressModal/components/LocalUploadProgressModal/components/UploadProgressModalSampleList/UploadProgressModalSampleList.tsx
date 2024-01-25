import { map, sum } from "lodash/fp";
import React from "react";
import LoadingBar from "~/components/ui/controls/LoadingBar";
import IconAlert from "~/components/ui/icons/IconAlert";
import IconCheckSmall from "~/components/ui/icons/IconCheckSmall";
import { formatFileSize } from "~/components/utils/format";
import { SampleFromApi } from "~/interface/shared";
import cs from "./upload_progress_modal_sample_list.scss";

const ERROR_STATUS = "error";

enum SampleUploadStatus {
  Error = "error",
  InProgress = "in progress",
  Success = "success",
}

type SampleUploadStatusMap = { [key: string]: SampleUploadStatus };
type SampleUploadPercentageMap = { [key: string]: number };

interface UploadProgressModalSampleListProps {
  samples: SampleFromApi[] | null;
  sampleUploadPercentages: SampleUploadPercentageMap;
  sampleUploadStatuses: SampleUploadStatusMap;
  onRetryUpload: (uploadsToRetry: SampleFromApi[]) => void;
}

export const UploadProgressModalSampleList = ({
  samples,
  sampleUploadPercentages,
  sampleUploadStatuses,
  onRetryUpload,
}: UploadProgressModalSampleListProps) => {
  const getUploadPercentageForSample = (sample: SampleFromApi) => {
    return sampleUploadPercentages[sample.name];
  };

  const getUploadedPercentageText = (sample: SampleFromApi) => {
    const uploadPercentage = getUploadPercentageForSample(sample);
    if (uploadPercentage === undefined) {
      return "Waiting to upload...";
    }

    const totalUploadSize = sum(map((file: File) => file.size, sample.files));
    return `Uploaded ${formatFileSize(
      totalUploadSize * uploadPercentage,
    )} of ${formatFileSize(totalUploadSize)}`;
  };

  return (
    <div className={cs.uploadProgressModalSampleList}>
      {samples &&
        samples.map(sample => {
          const status = sampleUploadStatuses[sample.name];

          return (
            <div key={sample.name} className={cs.sample}>
              <div className={cs.sampleHeader}>
                <div className={cs.sampleName}>{sample.name}</div>
                <div className={cs.sampleStatus}>
                  {status === SampleUploadStatus.Error && (
                    <>
                      <IconAlert className={cs.alertIcon} type="error" />
                      Upload failed
                      <div className={cs.verticalDivider}> | </div>
                      <div
                        onClick={() => onRetryUpload([sample])}
                        className={cs.sampleRetry}
                      >
                        Retry
                      </div>
                    </>
                  )}
                  {status === SampleUploadStatus.Success && (
                    <div className={cs.success}>
                      <IconCheckSmall className={cs.checkmarkIcon} />
                      Sent to pipeline
                    </div>
                  )}
                  {(status === SampleUploadStatus.InProgress ||
                    status === undefined) && (
                    <>{getUploadedPercentageText(sample)}</>
                  )}
                </div>
              </div>
              <LoadingBar
                percentage={getUploadPercentageForSample(sample)}
                error={status === ERROR_STATUS}
              />
            </div>
          );
        })}
    </div>
  );
};
