import React from "react";
import PropTypes from "prop-types";

const LockIcon = props => {
  return (
    <svg
      className={props.className}
      viewBox="0 0 16 20"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      stroke="none"
      strokeWidth="1"
      fill="#999999"
      fillRule="nonzero"
    >
      <g>
        <path
          d="M8,11.454834 C7.17647059,11.454834 6.5,12.0632996 6.5,12.8040403 C6.5,13.3066858 6.79411765,13.7299663 7.26470588,13.9680615 L7.26470588,15.7934583 C7.26470588,16.1638287 7.58823529,16.454834 8,16.454834 C8.41176471,16.454834 8.73529412,16.1638287 8.73529412,15.7934583 L8.73529412,13.9680615 C9.17647059,13.7299663 9.5,13.3066858 9.5,12.8040403 C9.5,12.0632996 8.82352941,11.454834 8,11.454834 Z"
          id="Shape"
        />
        <path
          d="M14,8 L14,6 C14,2.7 11.3,0 8,0 C4.7,0 2,2.7 2,6 L2,8 C0.9,8 0,8.9 0,10 L0,18 C0,19.1 0.9,20 2,20 L14,20 C15.1,20 16,19.1 16,18 L16,10 C16,8.9 15.1,8 14,8 Z M4,6 C4,3.8 5.8,2 8,2 C10.2,2 12,3.8 12,6 L12,8 L4,8 L4,6 Z M2,18 L2,10 L14,10 L14,18 L2,18 Z"
          id="Shape"
        />
      </g>
    </svg>
  );
};

LockIcon.propTypes = {
  className: PropTypes.string
};

export default LockIcon;
