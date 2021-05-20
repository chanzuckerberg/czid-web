import { forbidExtraProps } from "airbnb-prop-types";
import PropTypes from "prop-types";
import React from "react";

const IconNextcladeLarge = ({ className }) => {
  return (
    <svg className={className} width="32px" height="32px" viewBox="0 0 32 32">
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="Group-3" transform="translate(1.000000, 3.000000)">
          <line
            x1="8.875"
            y1="14.9722222"
            x2="2.52490234"
            y2="14.9722222"
            id="Line-2-Copy-3"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></line>
          <polyline
            id="Path-3-Copy-3"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="26.5 2.75 15 2.75 15 12.3796296 26.5 12.3796296"
          ></polyline>
          <polyline
            id="Path-4-Copy-3"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="14.9939716 7.93518519 9 7.93518519 9 22.75 26.5 22.75"
          ></polyline>
          <circle
            id="Oval"
            fill="currentColor"
            cx="27.5888672"
            cy="2.75"
            r="2"
          ></circle>
          <circle
            id="Oval-Copy-2"
            fill="currentColor"
            cx="27.5888672"
            cy="12.3796296"
            r="2"
          ></circle>
          <circle
            id="Oval-Copy-4"
            fill="currentColor"
            cx="2.52490234"
            cy="14.9722222"
            r="2"
          ></circle>
          <circle
            id="Oval-Copy-3"
            fill="currentColor"
            cx="27.5888672"
            cy="22.75"
            r="2"
          ></circle>
        </g>
      </g>
    </svg>
  );
};

IconNextcladeLarge.propTypes = forbidExtraProps({
  className: PropTypes.string,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  onFocus: PropTypes.func,
});

export default IconNextcladeLarge;
