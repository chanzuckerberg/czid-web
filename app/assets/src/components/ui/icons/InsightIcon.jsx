import BasicPopup from "../../BasicPopup";
import React from "react";

const InsightIcon = ({ tooltip }) => {
  let icon = (
    <span className="ui icon insight-icon">
      <span className="fa-stack fa-lg">
        <i className="fa fa-circle fa-stack-2x" />
        <i className="fa fa-lightbulb-o fa-stack-1x fa-inverse" />
      </span>
    </span>
  );
  return <BasicPopup trigger={icon} content={tooltip} />;
};

export default InsightIcon;
