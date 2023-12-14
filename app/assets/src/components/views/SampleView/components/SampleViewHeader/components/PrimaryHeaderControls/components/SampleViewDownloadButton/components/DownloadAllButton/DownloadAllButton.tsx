import React from "react";
import { fetchQuery, graphql, useRelayEnvironment } from "react-relay";
import { useTrackEvent } from "~/api/analytics";
import { DownloadButton } from "~/components/ui/controls/buttons";
import { openUrl } from "~/components/utils/links";
import { logError } from "~/components/utils/logUtil";
import { WorkflowType } from "~/components/utils/workflows";
import Sample, { WorkflowRun } from "~/interface/sample";
import { DownloadAllButtonQuery as DownloadAllButtonQueryType } from "./__generated__/DownloadAllButtonQuery.graphql";

const DownloadAllButtonQuery = graphql`
  query DownloadAllButtonQuery($workflowRunId: String) {
    ZipLink(workflowRunId: $workflowRunId) {
      error
      url
    }
  }
`;

export interface DownloadAllButtonProps {
  sample: Sample;
  workflowRun: WorkflowRun;
  workflowType: WorkflowType;
  readyToDownload?: boolean;
  className?: string;
}

export const DownloadAllButton = ({
  sample,
  workflowRun,
  workflowType,
  readyToDownload,
  className,
}: DownloadAllButtonProps) => {
  const trackEvent = useTrackEvent();
  const environment = useRelayEnvironment();

  if (!readyToDownload) {
    return null;
  }

  const downloadZipFile = () => {
    fetchQuery<DownloadAllButtonQueryType>(
      environment,
      DownloadAllButtonQuery,
      {
        workflowRunId: workflowRun.id.toString(),
      },
    ).subscribe({
      next: data => {
        if (data.ZipLink?.error) {
          logError({
            message: `Zip file retrieval failed with error: ${data.ZipLink.error}`,
          });
          return;
        }
        if (data.ZipLink?.url) {
          openUrl(data.ZipLink.url);
        }
      },
    });
    trackEvent(`SampleViewHeader_${workflowType}-download-all-button_clicked`, {
      sampleId: sample.id,
    });
  };

  return (
    <DownloadButton
      className={className}
      text="Download All"
      onClick={downloadZipFile}
    />
  );
};
