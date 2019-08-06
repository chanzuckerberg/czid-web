import PropTypes from "prop-types";
import React from "react";
import cx from "classnames";

import CircleCheckmarkIcon from "~/components/ui/icons/CircleCheckmarkIcon";
import InfoCircleIcon from "~/components/ui/icons/InfoCircleIcon";
import LoadingIcon from "~/components/ui/icons/LoadingIcon";

import cs from "./pipeline_viz.scss";

const PipelineVizStatusIcon = ({ type, className }) => {
  switch (type) {
    case "inProgress":
      return <LoadingIcon className={cx(className, cs.inProgressIcon)} />;
    case "finished":
      return <CircleCheckmarkIcon className={cx(className, cs.finishedIcon)} />;
    case "errored":
      return <InfoCircleIcon className={cx(className, cs.erroredIcon)} />;
    default:
      return <span className={cx(className, cs.noIcon)} />;
  }
};

PipelineVizStatusIcon.propTypes = {
  type: PropTypes.string,
  className: PropTypes.string,
};

export default PipelineVizStatusIcon;
