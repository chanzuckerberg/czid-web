import PropTypes from "prop-types";
import React from "react";

const IconCoverage = props => {
  return (
    <svg
      className={props.className}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 11.79 11.79"
    >
      <rect x="1.82" y="4.07" width="1.51" height="7.17" rx="0.65" ry="0.65" />
      <rect x="4.03" y="2.12" width="1.51" height="9.13" rx="0.65" ry="0.65" />
      <rect x="6.25" y="0.55" width="1.51" height="10.69" rx="0.65" ry="0.65" />
      <rect x="8.46" y="4.23" width="1.51" height="7.01" rx="0.65" ry="0.65" />
    </svg>
  );
};

IconCoverage.propTypes = {
  className: PropTypes.string,
};

export default IconCoverage;
