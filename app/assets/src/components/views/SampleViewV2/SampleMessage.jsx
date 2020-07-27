import cx from "classnames";
import React from "react";

import PropTypes from "~/components/utils/propTypes";
import BacteriaIcon from "~ui/icons/BacteriaIcon";

import cs from "./sample_message.scss";

class SampleMessage extends React.Component {
  render() {
    const { icon, link, linkText, message, status, type, onClick } = this.props;
    return (
      <div className={cs.sampleMessage}>
        <div className={cs.textContainer}>
          <div className={cx(cs.reportStatus, cs[type])}>
            {icon}
            <span className={cs.text}>{status}</span>
          </div>
          <div className={cs.message}>{message}</div>
          <a className={cs.actionLink} href={link} onClick={onClick}>
            {linkText}
            {linkText && (
              <i className={cx("fa fa-chevron-right", cs.rightArrow)} />
            )}
          </a>
        </div>
        <BacteriaIcon className={cs.bacteriaIcon} />
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
  type: PropTypes.string,
  onClick: PropTypes.function,
};

export default SampleMessage;
