import React from "react";
import { IconLoading } from "~/components/ui/icons";
import { SampleMessage } from "~/components/views/components/SampleMessage";
import {
  CREATED_STATE,
  RUNNING_STATE,
  SUCCEEDED_STATE,
} from "~/components/views/SampleView/utils/";
import Sample, { WorkflowRun } from "~/interface/sample";
import { FailedMessage } from "./components/FailedMessage";
import cs from "./sample_report_content.scss";

export interface SampleReportContentProps {
  loadingResults: boolean;
  children: React.ReactNode;
  workflowRun?: WorkflowRun | null;
  sample: Sample;
  loadingInfo: {
    message: string;
    linkText?: string;
    helpLink?: string;
  };
  eventNames?: {
    loading: string;
    error: string;
  };
}

export const SampleReportContent = ({
  loadingResults,
  children,
  workflowRun,
  sample,
  loadingInfo,
  eventNames,
}: SampleReportContentProps) => {
  const isInProgress =
    !sample.upload_error &&
    (!workflowRun ||
      !workflowRun.status ||
      workflowRun.status === RUNNING_STATE);
  const isWaitingToStart =
    !sample.upload_error && workflowRun?.status === CREATED_STATE;
  return (
    <>
      {loadingResults ? (
        <SampleMessage
          icon={<IconLoading className={cs.icon} />}
          message={"Loading report data."}
          status={"Loading"}
          type={"inProgress"}
        />
      ) : workflowRun?.status === SUCCEEDED_STATE ? (
        children
      ) : isInProgress ? (
        <SampleMessage
          icon={<IconLoading className={cs.icon} />}
          link={loadingInfo?.helpLink}
          linkText={loadingInfo?.linkText}
          message={loadingInfo?.message}
          status={"IN PROGRESS"}
          type={"inProgress"}
          analyticsEventName={eventNames?.loading}
        />
      ) : isWaitingToStart ? (
        <SampleMessage
          icon={<IconLoading className={cs.icon} />}
          message={"Waiting to Start or Receive Files"}
          status={"IN PROGRESS"}
          type={"inProgress"}
        />
      ) : (
        <FailedMessage
          sample={sample}
          workflowRun={workflowRun}
          analyticsEventName={eventNames?.error}
        />
      )}
    </>
  );
};
