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
  type?: string;
  onClick?: $TSFixMeFunction;
}

class SampleMessage extends React.Component<SampleMessageProps> {
  render() {
    const { icon, link, linkText, message, status, subtitle, type, onClick } =
      this.props;
    return (
      <div className={cs.sampleMessage}>
        <div className={cs.textContainer}>
          <div className={cx(cs.reportStatus, cs[type])}>
            {icon}
            <span className={cs.text}>{status}</span>
          </div>
          <div className={cs.message}>{message}</div>
          <div className={cs.subtitle}>{subtitle}</div>
          {/* @ts-expect-error Property 'onClick' does not exist on type */}
          <ExternalLink className={cs.actionLink} href={link} onClick={onClick}>
            {linkText}
            {linkText && <IconArrowRight />}
          </ExternalLink>
        </div>
        <ImgMicrobeSecondary className={cs.imgMicrobe} />
      </div>
    );
  }
}

export default SampleMessage;
