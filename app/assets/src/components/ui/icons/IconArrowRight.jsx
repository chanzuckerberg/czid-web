import cx from "classnames";
import React from "react";
import PropTypes from "~utils/propTypes";

import cs from "./icon_arrow_right.scss";

const IconArrowRight = ({ className }) => {
  return <i className={cx("fa fa-chevron-right", cs.icon, className)} />;
};

IconArrowRight.propTypes = {
  className: PropTypes.string,
};

export default IconArrowRight;
