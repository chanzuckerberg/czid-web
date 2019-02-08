import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import cs from "./divider.scss";

const Divider = ({ style }) => {
  return <div className={cx(cs.divider, cs[style])} />;
};

Divider.defaultProps = {
  style: "thin"
};

Divider.propTypes = {
  style: PropTypes.oneOf(["thin", "medium"])
};

export default Divider;
