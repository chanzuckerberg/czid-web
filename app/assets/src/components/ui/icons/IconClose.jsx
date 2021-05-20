import PropTypes from "prop-types";
import React from "react";

const IconClose = ({ className, onClick }) => {
  return (
    <svg
      className={className}
      fill="#3867FA"
      fillRule="evenodd"
      height="32px"
      onClick={onClick}
      viewBox="0 0 32 32"
      width="32px"
    >
      <polygon points="17.7352 16 28 26.2648 26.2636 28 16 17.7352 5.7352 28 4 26.2648 14.2636 16 4 5.7352 5.7352 4 16 14.2648 26.2636 4 28 5.7352"></polygon>
    </svg>
  );
};

IconClose.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default IconClose;
