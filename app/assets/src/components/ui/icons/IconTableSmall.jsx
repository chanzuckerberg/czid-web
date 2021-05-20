import PropTypes from "prop-types";
import React from "react";

const IconTableSmall = ({ className }) => {
  return (
    <svg className={className} width="14px" height="14px" viewBox="0 0 14 14">
      <path d="M12.6875,1 L1.3125,1 C0.587617187,1 0,1.58761719 0,2.3125 L0,11.9375 C0,12.6623828 0.587617187,13.25 1.3125,13.25 L12.6875,13.25 C13.4123828,13.25 14,12.6623828 14,11.9375 L14,2.3125 C14,1.58761719 13.4123828,1 12.6875,1 Z M6.5,11.675 L1.25,11.675 L1.25,8.75 L6.5,8.75 L6.5,11.675 Z M6.5,7.125 L1.25,7.125 L1.25,4.15 L6.5,4.15 L6.5,7.125 Z M12.75,11.675 L7.5,11.675 L7.5,8.75 L12.75,8.75 L12.75,11.675 Z M12.75,7.125 L7.5,7.125 L7.5,4.15 L12.75,4.15 L12.75,7.125 Z" />
    </svg>
  );
};

IconTableSmall.propTypes = {
  className: PropTypes.string,
};

export default IconTableSmall;
