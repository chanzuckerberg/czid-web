// Temporary Annotation flag icon
import PropTypes from "prop-types";
import React from "react";

const IconTempSmall = ({ className }) => {
  return (
    <svg
      className={className}
      color="#3867FA"
      fill="currentColor"
      fillRule="evenodd"
      height="10px"
      viewBox="0 0 14 10"
      width="14px"
    >
      <rect id="Rectangle" x="1" y="6.13" width="12" height="1.75" />
    </svg>
  );
};

IconTempSmall.propTypes = {
  className: PropTypes.string,
};

export default IconTempSmall;
