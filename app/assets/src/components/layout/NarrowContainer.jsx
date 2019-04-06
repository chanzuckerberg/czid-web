import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import cs from "./narrow_container.scss";

const NarrowContainer = ({ children, className, size }) => {
  // NarrowContainer will enforce our policy for page width
  // As a general rule, should be applied to most page contents and headers
  return (
    <div className={cx(cs.narrowContainer, className, size && cs[size])}>
      {children}
    </div>
  );
};

NarrowContainer.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(["small"])
};

export default NarrowContainer;
