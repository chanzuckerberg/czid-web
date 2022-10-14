import cx from "classnames";
import React from "react";

import { IconLoading, IconSuccessSmall, IconInfoSmall } from "~ui/icons";

import cs from "./pipeline_viz.scss";

interface PipelineVizStatusIconProps {
  type?: string;
  className?: string;
}

const PipelineVizStatusIcon = ({
  type,
  className,
}: PipelineVizStatusIconProps) => {
  switch (type) {
    case "inProgress":
      return <IconLoading className={cx(className, cs.inProgressIcon)} />;
    case "finished":
      return <IconSuccessSmall className={cx(className, cs.finishedIcon)} />;
    case "pipelineErrored":
      return (
        <IconInfoSmall className={cx(className, cs.pipelineErroredIcon)} />
      );
    case "userErrored":
      return <IconInfoSmall className={cx(className, cs.userErroredIcon)} />;
    default:
      return null;
  }
};

export default PipelineVizStatusIcon;
