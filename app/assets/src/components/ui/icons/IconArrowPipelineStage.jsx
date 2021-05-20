import PropTypes from "prop-types";
import React from "react";

const IconArrowPipelineStage = props => {
  return (
    <svg className={props.className} viewBox="0 0 97 60">
      <g transform="translate(-865.000000, -1980.000000)">
        <polygon points="865 1980 874.880859 2009.53369 865 2039.06738 961.522461 2009.53369" />
      </g>
    </svg>
  );
};

IconArrowPipelineStage.propTypes = {
  className: PropTypes.string,
};

export default IconArrowPipelineStage;
