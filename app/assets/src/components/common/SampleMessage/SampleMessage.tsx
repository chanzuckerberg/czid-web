import cx from "classnames";
import React from "react";
import ExternalLink from "~ui/controls/ExternalLink";
import { IconArrowRight } from "~ui/icons";
import ImgMicrobeSecondary from "~ui/illustrations/ImgMicrobeSecondary";
import cs from "./sample_message.scss";

interface SampleMessageProps {
  icon?: React.ReactElement;
  link?: string;
  linkText?: string;
  message?: string;
  status?: string;
  subtitle?: string;
  type: string;
  analyticsEventName?: string;
  analyticsEventData?: object;
}

export const SampleMessage = ({
  icon,
  link,
  linkText,
  message,
  status,
  subtitle,
  type,
  analyticsEventName,
  analyticsEventData,
}: SampleMessageProps) => {
  return (
    <div className={cs.sampleMessage} data-testid={"sample-message"}>
      <div className={cs.textContainer}>
        <div className={cx(cs.reportStatus, cs[type])}>
          {icon}
          <span className={cs.text}>{status}</span>
        </div>
        <div className={cs.message}>{message}</div>
        <div className={cs.subtitle}>{subtitle}</div>
        <ExternalLink
          className={cs.actionLink}
          href={link}
          analyticsEventName={analyticsEventName}
          analyticsEventData={analyticsEventData}
        >
          {linkText}
          {linkText && <IconArrowRight />}
        </ExternalLink>
      </div>
      <ImgMicrobeSecondary className={cs.imgMicrobe} />
    </div>
  );
};

export default SampleMessage;
