import React from "react";
import PropTypes from "prop-types";

// DEPRECATED! As of 2020-01-21, use InfoIconSmall, which is more consistent in style
// to the other notification icons.
const InfoCircleIcon = props => {
  return (
    <svg
      className={props.className}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 45 45"
      fillRule="evenodd"
    >
      <g>
        <path d="M24,44c-5.3,0-10.4-2.1-14.1-5.9c-7.8-7.8-7.8-20.5,0-28.3C13.6,6.1,18.7,4,24,4s10.4,2.1,14.1,5.9c7.8,7.8,7.8,20.5,0,28.3  C34.4,41.9,29.3,44,24,44z M24,6c-4.8,0-9.3,1.9-12.7,5.3c-7,7-7,18.4,0,25.5C14.7,40.1,19.2,42,24,42s9.3-1.9,12.7-5.3l0,0  c7-7,7-18.4,0-25.5C33.3,7.9,28.8,6,24,6z M25.5,16.5c-0.4,0.4-0.8,0.5-1.3,0.5s-1-0.2-1.3-0.5c-0.4-0.4-0.5-0.8-0.5-1.3  s0.2-1,0.5-1.3c0.4-0.4,0.8-0.5,1.3-0.5c0.5,0,0.9,0.2,1.3,0.5c0.4,0.4,0.5,0.8,0.5,1.3S25.9,16.2,25.5,16.5z M22.8,33.6V20.1  c0-0.2,0.2-0.4,0.4-0.4h2c0.2,0,0.4,0.2,0.4,0.4v13.6c0,0.2-0.2,0.4-0.4,0.4h-2C23,34,22.8,33.8,22.8,33.6z" />
      </g>
    </svg>
  );
};

InfoCircleIcon.propTypes = {
  className: PropTypes.string,
};

export default InfoCircleIcon;
