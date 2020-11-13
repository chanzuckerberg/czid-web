import React from "react";
import PropTypes from "prop-types";

const IconMinusSmall = props => {
  return (
    <svg
      className={props.className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
    >
      <rect id="Rectangle" x="1" y="6.13" width="12" height="1.75" />
    </svg>
  );
};

IconMinusSmall.propTypes = {
  className: PropTypes.string,
};

export default IconMinusSmall;
