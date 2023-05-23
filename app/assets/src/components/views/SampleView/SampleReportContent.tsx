import React from "react";
import { IconAlert, IconLoading } from "~/components/ui/icons";
import { sampleErrorInfo } from "~/components/utils/sample";
import { SampleMessage } from "~/components/views/components/SampleMessage";
import csSampleMessage from "~/components/views/components/SampleMessage/sample_message.scss";
import Sample, { WorkflowRun } from "~/interface/sample";
import cs from "./consensus_genome_view.scss";
import { CREATED_STATE, RUNNING_STATE, SUCCEEDED_STATE } from "./constants";

export interface SampleReportContentProps {
  loadingResults: boolean;
  renderResults: () => React.ReactNode;
  workflowRun: WorkflowRun;
  sample: Sample;
  loadingInfo: {
    message: string;
    linkText: string;
    helpLink: string;
  };
  eventNames: {
    loading: string;
    error: string;
  };
}

const SampleReportContent = ({
  loadingResults,
  renderResults,
  workflowRun,
  sample,
  loadingInfo,
  eventNames,
}: SampleReportContentProps) => {
  const renderLoadingMessage = () => {
    return (
      <SampleMessage
        icon={<IconLoading className={csSampleMessage.icon} />}
        message={"Loading report data."}
        status={"Loading"}
        type={"inProgress"}
      />
    );
  };
  const renderContent = () => {
    if (workflowRun?.status === SUCCEEDED_STATE) {
      return renderResults();
    } else if (
      !sample.upload_error &&
      (!workflowRun ||
        !workflowRun.status ||
        workflowRun.status === RUNNING_STATE)
    ) {
      return (
        <SampleMessage
          icon={<IconLoading className={csSampleMessage.icon} />}
          link={loadingInfo.helpLink}
          linkText={loadingInfo.linkText}
          message={loadingInfo.message}
          status={"IN PROGRESS"}
          type={"inProgress"}
          analyticsEventName={eventNames?.loading}
        />
      );
    } else if (!sample.upload_error && workflowRun.status === CREATED_STATE) {
      return (
        <SampleMessage
          icon={<IconLoading className={csSampleMessage.icon} />}
          message={"Waiting to Start or Receive Files"}
          status={"IN PROGRESS"}
          type={"inProgress"}
        />
      );
    } else {
      // FAILED
      const { link, linkText, subtitle, message, status, type } =
        sampleErrorInfo({
          sample,
          // @ts-expect-error Type 'string' is not assignable to type 'Record<string, never> | { label?: string; message: string; }'
          error: workflowRun.input_error || {},
        });
      return (
        <SampleMessage
          icon={<IconAlert className={cs.iconAlert} type={type} />}
          link={link}
          linkText={linkText}
          subtitle={subtitle}
          message={message}
          status={status}
          type={type}
          analyticsEventName={eventNames?.error}
        />
      );
    }
  };
  return <>{loadingResults ? renderLoadingMessage() : renderContent()}</>;
};

export default SampleReportContent;
