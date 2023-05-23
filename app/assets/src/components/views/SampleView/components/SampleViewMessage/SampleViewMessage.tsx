import React from "react";
import { ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import { IconAlert, IconLoading } from "~/components/ui/icons";
import { sampleErrorInfo } from "~/components/utils/sample";
import { SampleMessage } from "~/components/views/components/SampleMessage";
import csSampleMessage from "~/components/views/components/SampleMessage/sample_message.scss";
import { IconAlertType } from "~/interface/icon";
import ReportMetadata from "~/interface/reportMetaData";
import Sample from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import { PipelineRun } from "~/interface/shared";
import { ONT_PIPELINE_RUNNING_STATUS, TABS } from "../../constants";

interface SampleViewMessageProps {
  currentTab: CurrentTabSample;
  loadingReport: boolean;
  pipelineRun: PipelineRun;
  reportMetadata: ReportMetadata;
  sample: Sample;
  snapshotShareId: string;
}

export const SampleViewMessage = ({
  currentTab,
  loadingReport,
  pipelineRun,
  reportMetadata,
  sample,
  snapshotShareId,
}: SampleViewMessageProps) => {
  const { pipelineRunStatus, jobStatus } = reportMetadata;
  let status: string,
    message: string,
    subtitle: string,
    linkText: string,
    type: IconAlertType,
    link: string,
    icon: JSX.Element;
  // Error messages were previously sent from the server in the reportMetadata,
  // but after the switch to SFN are now sent as part of the sample's information.
  // Try to extract the error messages from the sample if possible, then try the
  // reportMetadata for older samples.
  const errorMessage =
    sample && sample.error_message
      ? sample.error_message
      : reportMetadata.errorMessage;
  const knownUserError =
    sample && sample.known_user_error
      ? sample.known_user_error
      : reportMetadata.knownUserError;

  if (loadingReport) {
    status = "Loading";
    message = "Loading report data.";
    icon = <IconLoading className={csSampleMessage.icon} />;
    type = "inProgress";
  } else if (
    pipelineRunStatus === "WAITING" &&
    sample &&
    !sample.upload_error
  ) {
    // Note that the pipeline status "WAITING" is obtained from the API at `app/services/pipeline_report_service.rb`
    status = "IN PROGRESS";
    message =
      currentTab === TABS.LONG_READ_MNGS
        ? ONT_PIPELINE_RUNNING_STATUS
        : jobStatus;
    icon = <IconLoading className={csSampleMessage.icon} />;
    type = "inProgress";
    if (pipelineRun && pipelineRun.pipeline_version) {
      linkText = "View Pipeline Visualization";
      link = `/samples/${sample.id}/pipeline_viz/${pipelineRun.pipeline_version}`;
    }
  } else {
    // Some kind of error or warning has occurred.
    if (sample) {
      // If an upload error occurred, the pipeline run might not exist so
      // only try to set these fields if the pipeline run started.
      if (pipelineRun) {
        pipelineRun.known_user_error = knownUserError;
        pipelineRun.error_message = errorMessage;
      }
      ({ status, message, subtitle, linkText, type, link } = sampleErrorInfo({
        sample,
        pipelineRun,
      }));
    }
    icon = <IconAlert className={csSampleMessage.icon} type={type} />;
  }
  // Hide sample message links on snapshot pages.
  if (snapshotShareId) {
    link = "";
    linkText = "";
  }

  return (
    <SampleMessage
      icon={icon}
      link={link}
      linkText={linkText}
      message={message}
      subtitle={subtitle}
      status={status}
      type={type}
      analyticsEventData={{ status }}
      analyticsEventName={
        ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_SAMPLE_MESSAGE_LINK_CLICKED
      }
    />
  );
};
