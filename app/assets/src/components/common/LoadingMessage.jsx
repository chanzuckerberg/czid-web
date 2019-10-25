import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import LoadingIcon from "~ui/icons/LoadingIcon";

import cs from "./loading_message.scss";

class LoadingMessage extends React.Component {
  render() {
    const { className, message } = this.props;
    return (
      <div className={cx(cs.loadingMessage, className)}>
        <LoadingIcon className={cs.loadingIcon} />
        <div className={cs.text}>{message}</div>
      </div>
    );
  }
}

LoadingMessage.propTypes = {
  message: PropTypes.string,
  className: PropTypes.string,
};

export default LoadingMessage;
