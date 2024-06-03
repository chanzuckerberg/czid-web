import React from "react";
import { SampleMessage } from "~/components/common/SampleMessage";
import csSampleMessage from "~/components/common/SampleMessage/sample_message.scss";
import { IconAlert, IconLoading } from "~/components/ui/icons";
import { sampleErrorInfo, UPLOAD_URL } from "~/components/utils/sample";
import { WORKFLOW_TABS } from "~/components/utils/workflows";
import { ONT_PIPELINE_RUNNING_STATUS_MESSAGE } from "~/components/views/SampleView/utils";
import { IconAlertType } from "~/interface/icon";
import { PipelineRunStatus, ReportMetadata } from "~/interface/reportMetaData";
import Sample, { SampleStatus } from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import { PipelineRun } from "~/interface/shared";

interface SampleViewMessageProps {
  currentTab: CurrentTabSample;
  loadingReport: boolean;
  hasZeroTaxons: boolean;
  pipelineRun: PipelineRun;
  reportMetadata: ReportMetadata;
  sample: Sample | null;
  snapshotShareId?: string;
}

export const SampleViewMessage = ({
  currentTab,
  hasZeroTaxons,
  loadingReport,
  pipelineRun,
  reportMetadata,
  sample,
  snapshotShareId,
}: SampleViewMessageProps) => {
  const { pipelineRunStatus, jobStatus } = reportMetadata;
  let status: SampleStatus,
    message: string | undefined,
    subtitle: string | undefined,
    linkText: string | undefined,
    type: IconAlertType,
    link: string | undefined,
    icon: JSX.Element;
  // Error messages were previously sent from the server in the reportMetadata,
  // but after the switch to SFN are now sent as part of the sample's information.
  // Try to extract the error messages from the sample if possible, then try the
  // reportMetadata for older samples.
  const errorMessage = sample?.error_message || reportMetadata?.errorMessage;
  const knownUserError =
    sample?.known_user_error || reportMetadata?.knownUserError;

  // If the data is still loading from the backend, show a loading message.
  if (loadingReport) {
    status = SampleStatus.LOADING;
    message = "Loading report data.";
    icon = <IconLoading className={csSampleMessage.icon} />;
    type = "inProgress";
  } else if (hasZeroTaxons) {
    // If the data has loaded from the backend, but there are no taxons to display
    status = SampleStatus.COMPLETE_ISSUE;
    message =
      "No data to display because the sample reads did not match the database.";
    type = "warning";
    link = UPLOAD_URL;
    linkText = "Upload new sample";
  } else if (
    // Else if the data has loaded from the backend, but the pipeline is still running,
    // let the user know that the pipeline is in progress.
    pipelineRunStatus === PipelineRunStatus.WAITING &&
    sample &&
    !sample.upload_error
  ) {
    // Note that the pipeline status "WAITING" is obtained from the API at `app/services/pipeline_report_service.rb`
    status = SampleStatus.IN_PROGRESS;
    message =
      currentTab === WORKFLOW_TABS.LONG_READ_MNGS
        ? ONT_PIPELINE_RUNNING_STATUS_MESSAGE
        : jobStatus;
    icon = <IconLoading className={csSampleMessage.icon} />;
    type = "inProgress";
    if (pipelineRun?.pipeline_version) {
      linkText = "View Pipeline Visualization";
      link = `/samples/${sample.id}/pipeline_viz/${pipelineRun.pipeline_version}`;
    }
  } else {
    // Else the data loaded, but there is some kind of error or warning to display.
    if (sample) {
      // If an upload error occurred, the pipeline run might not exist so
      // only try to set these fields if the pipeline run started.
      if (pipelineRun) {
        pipelineRun.known_user_error = knownUserError;
        pipelineRun.error_message = errorMessage;
      }
      ({ status, message, subtitle, linkText, type, link } = sampleErrorInfo({
        sampleId: sample.id,
        sampleUploadError: sample.upload_error,
        pipelineRun,
      }));
    }
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2454
    icon = <IconAlert className={csSampleMessage.icon} type={type} />;
  }
  // Hide sample message links on snapshot pages.
  if (snapshotShareId) {
    link = "";
    linkText = "";
  }

  return (
    <SampleMessage
      icon={icon!}
      link={link}
      linkText={linkText}
      message={message}
      subtitle={subtitle}
      status={status!}
      type={type!}
      analyticsEventData={{ status: status! }}
    />
  );
};
