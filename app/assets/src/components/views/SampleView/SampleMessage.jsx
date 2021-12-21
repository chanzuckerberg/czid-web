import cx from "classnames";
import React from "react";

import PropTypes from "~/components/utils/propTypes";
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
      openLinkInNewTab,
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
          <a
            className={cs.actionLink}
            href={link}
            onClick={onClick}
            rel="noopener noreferrer"
            target={openLinkInNewTab ? "_blank" : null}
          >
            {linkText}
            {linkText && <IconArrowRight />}
          </a>
        </div>
        <ImgMicrobeSecondary className={cs.imgMicrobe} />
      </div>
    );
  }
}

SampleMessage.defaultProps = {
  openLinkInNewTab: false,
};

SampleMessage.propTypes = {
  icon: PropTypes.element,
  link: PropTypes.string,
  linkText: PropTypes.string,
  message: PropTypes.string,
  openLinkInNewTab: PropTypes.bool,
  status: PropTypes.string,
  subtitle: PropTypes.string,
  type: PropTypes.string,
  onClick: PropTypes.func,
};

export default SampleMessage;
