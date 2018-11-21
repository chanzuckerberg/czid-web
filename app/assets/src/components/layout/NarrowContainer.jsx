import React from "react";
import PropTypes from "prop-types";
import cs from "./narrow_container.scss";

const NarrowContainer = ({ children }) => {
  return <div className={cs.narrowContainer}>{children}</div>;
};

NarrowContainer.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};

export default NarrowContainer;
