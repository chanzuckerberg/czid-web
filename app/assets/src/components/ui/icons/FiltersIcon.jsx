import React from "react";
import PropTypes from "prop-types";

const FiltersIcon = props => {
  return (
    <svg
      className={props.className}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 38 38"
      fill="#3867fa"
      fillRule="evenodd"
    >
      <g>
        <path d="M21,10.06H7A.95.95,0,1,0,7,12H21a3.39,3.39,0,0,0,3.27,2.44A3.35,3.35,0,0,0,27.54,12H31a1,1,0,1,0,0-1.9H27.54a3.38,3.38,0,0,0-6.5,0Zm4.71.95a1.48,1.48,0,1,1-1.48-1.49A1.51,1.51,0,0,1,25.75,11Z" />
        <path d="M9.62,17.67H7a.95.95,0,0,0,0,1.9H9.62A3.4,3.4,0,0,0,12.89,22a3.37,3.37,0,0,0,3.24-2.44H31a.95.95,0,0,0,0-1.9H16.13a3.39,3.39,0,0,0-6.51,0Zm4.72.95a1.49,1.49,0,1,1-1.49-1.48A1.49,1.49,0,0,1,14.34,18.62Z" />
        <path d="M16.47,26H7a.95.95,0,1,0,0,1.9h9.48a3.4,3.4,0,0,0,3.27,2.44A3.37,3.37,0,0,0,23,27.94h8A.95.95,0,0,0,31,26H23a3.39,3.39,0,0,0-6.51,0Zm4.72.95a1.49,1.49,0,1,1-3,0,1.49,1.49,0,0,1,3,0Z" />
      </g>
    </svg>
  );
};

FiltersIcon.propTypes = {
  className: PropTypes.string
};

export default FiltersIcon;
