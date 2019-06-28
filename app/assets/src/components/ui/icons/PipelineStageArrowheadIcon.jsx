import React from "react";
import PropTypes from "prop-types";

const PipelineStageArrowheadIcon = props => {
  return (
    <svg
      className={props.className}
      viewBox="0 0 97 60"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <g id="Styleguide-and-Components" stroke="none" strokeWidth="1">
        <g
          id="1.1-Styleguide-Copy"
          transform="translate(-865.000000, -1980.000000)"
        >
          <polygon
            id="Path-5-Copy"
            points="865 1980 874.880859 2009.53369 865 2039.06738 961.522461 2009.53369"
          />
        </g>
      </g>
    </svg>
  );
};

PipelineStageArrowheadIcon.propTypes = {
  className: PropTypes.string,
};

export default PipelineStageArrowheadIcon;
