import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import cs from "./narrow_container.scss";

const NarrowContainer = ({ children, className }) => {
  return <div className={cx(cs.narrowContainer, className)}>{children}</div>;
};

NarrowContainer.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  className: PropTypes.string
};

export default NarrowContainer;
