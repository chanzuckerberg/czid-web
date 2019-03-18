import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";

const LoadingIcon = props => {
  return <i className={cx("fa fa-spinner fa-pulse fa-fw", props.className)} />;
};

LoadingIcon.propTypes = {
  className: PropTypes.string
};

export default LoadingIcon;
