import React from "react";
import PropTypes from "prop-types";

const CloseIcon = props => {
  return (
    <svg
      className={props.className}
      onClick={props.onClick}
      viewBox="0 0 14 14"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      fill="#cccccc"
    >
      <g
        id="Page-1"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="1.0-Heatmap-Copy-2"
          transform="translate(-898.000000, -951.000000)"
          fill="#CCCCCC"
        >
          <g id="Group" transform="translate(559.000000, 940.000000)">
            <path
              d="M348.8,18 C348.8,18.3864 348.4864,18.7 348.1,18.7 L346.7,18.7 L346.7,20.1 C346.7,20.4864 346.3864,20.8 346,20.8 C345.6136,20.8 345.3,20.4864 345.3,20.1 L345.3,18.7 L343.9,18.7 C343.5136,18.7 343.2,18.3864 343.2,18 C343.2,17.6136 343.5136,17.3 343.9,17.3 L345.3,17.3 L345.3,15.9 C345.3,15.5136 345.6136,15.2 346,15.2 C346.3864,15.2 346.7,15.5136 346.7,15.9 L346.7,17.3 L348.1,17.3 C348.4864,17.3 348.8,17.6136 348.8,18 M346,23.6 C342.9123,23.6 340.4,21.0877 340.4,18 C340.4,14.9123 342.9123,12.4 346,12.4 C349.0877,12.4 351.6,14.9123 351.6,18 C351.6,21.0877 349.0877,23.6 346,23.6 M346,11 C342.1339,11 339,14.1339 339,18 C339,21.8661 342.1339,25 346,25 C349.8661,25 353,21.8661 353,18 C353,14.1339 349.8661,11 346,11"
              id="plus_circle-[#1427]"
              transform="translate(346.000000, 18.000000) rotate(45.000000) translate(-346.000000, -18.000000) "
            />
          </g>
        </g>
      </g>
    </svg>
  );
};

CloseIcon.propTypes = {
  className: PropTypes.string,
};

export default CloseIcon;
