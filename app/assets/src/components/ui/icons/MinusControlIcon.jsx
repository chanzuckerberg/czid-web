import React from "react";
import PropTypes from "prop-types";

const MinusControlIcon = props => {
  return (
    <svg
      className={props.className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
    >
      <path d="m 7,9 c -0.554,0 -1,0.446 -1,1 0,0.554 0.446,1 1,1 l 6,0 c 0.554,0 1,-0.446 1,-1 0,-0.554 -0.446,-1 -1,-1 z" />
    </svg>
  );
};

MinusControlIcon.propTypes = {
  className: PropTypes.string,
};

export default MinusControlIcon;
