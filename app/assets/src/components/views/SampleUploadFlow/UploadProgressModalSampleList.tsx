import { map, sum } from "lodash/fp";
import React from "react";

import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";
import LoadingBar from "~/components/ui/controls/LoadingBar";
import IconAlert from "~/components/ui/icons/IconAlert";
import IconCheckSmall from "~/components/ui/icons/IconCheckSmall";
import { formatFileSize } from "~/components/utils/format";
import { UploadFlowSample } from "~/interface/upload";
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
  samples: UploadFlowSample[];
  sampleUploadPercentages: SampleUploadPercentageMap;
  sampleUploadStatuses: SampleUploadStatusMap;
  onRetryUpload: (uploadsToRetry: UploadFlowSample[]) => void;
}

const UploadProgressModalSampleList = ({
  samples,
  sampleUploadPercentages,
  sampleUploadStatuses,
  onRetryUpload,
}: UploadProgressModalSampleListProps) => {
  const getUploadPercentageForSample = (sample: UploadFlowSample) => {
    return sampleUploadPercentages[sample.name];
  };

  const getUploadedPercentageText = (sample: UploadFlowSample) => {
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
      {samples.map(sample => {
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
                      onClick={withAnalytics(
                        () => onRetryUpload([sample]),
                        ANALYTICS_EVENT_NAMES.LOCAL_UPLOAD_PROGRESS_MODAL_RETRY_CLICKED,
                        {
                          sampleName: sample.name,
                        },
                      )}
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

export default UploadProgressModalSampleList;
