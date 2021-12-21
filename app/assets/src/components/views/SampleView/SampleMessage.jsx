import cx from "classnames";
import React from "react";

import PropTypes from "~/components/utils/propTypes";
import ExternalLink from "~ui/controls/ExternalLink";
import { IconArrowRight } from "~ui/icons";
import ImgMicrobeSecondary from "~ui/illustrations/ImgMicrobeSecondary";

import cs from "./sample_message.scss";

class SampleMessage extends React.Component {
  render() {
    const {
      icon,
      link,
      linkText,
      message,
      status,
      subtitle,
      type,
      onClick,
    } = this.props;
    return (
      <div className={cs.sampleMessage}>
        <div className={cs.textContainer}>
          <div className={cx(cs.reportStatus, cs[type])}>
            {icon}
            <span className={cs.text}>{status}</span>
          </div>
          <div className={cs.message}>{message}</div>
          <div className={cs.subtitle}>{subtitle}</div>
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

SampleMessage.propTypes = {
  icon: PropTypes.element,
  link: PropTypes.string,
  linkText: PropTypes.string,
  message: PropTypes.string,
  status: PropTypes.string,
  subtitle: PropTypes.string,
  type: PropTypes.string,
  onClick: PropTypes.func,
};

export default SampleMessage;
