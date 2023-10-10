import React from "react";
import { IconAlert } from "~/components/ui/icons";
import { sampleErrorInfo } from "~/components/utils/sample";
import { SampleMessage } from "~/components/views/components/SampleMessage";
import Sample, { WorkflowRun } from "~/interface/sample";
import cs from "../../sample_report_content.scss";

interface FailedMessageProps {
  sample: Sample;
  workflowRun?: WorkflowRun | null;
  analyticsEventName?: string;
}

export const FailedMessage = ({
  sample,
  workflowRun,
  analyticsEventName,
}: FailedMessageProps) => {
  const { link, linkText, subtitle, message, status, type } = sampleErrorInfo({
    sample,
    error: workflowRun?.input_error || {},
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
      analyticsEventName={analyticsEventName}
    />
  );
};
