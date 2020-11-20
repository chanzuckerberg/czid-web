import React from "react";
import PropTypes from "prop-types";

const IconMinusSmall = props => {
  return (
    <svg
      className={props.className}
      viewBox="0 0 14 14"
      width="14px"
      height="14px"
    >
      <rect id="Rectangle" x="1" y="6.13" width="12" height="1.75" />
    </svg>
  );
};

IconMinusSmall.propTypes = {
  className: PropTypes.string,
};

export default IconMinusSmall;
