import { Icon, Tooltip } from "czifui";
import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import cs from "./pipeline_version_indicator.scss";

interface PipelineVersionIndicatorProps {
  pipelineHelpLink: string;
  version?: string;
}

const versionSubtext =
  "This is the latest version consistent with the samples in your project.";
const noVersionSubtext = "Choose a project to view.";

export const PipelineVersionIndicator = ({
  pipelineHelpLink,
  version,
}: PipelineVersionIndicatorProps) => {
  const pipelineVersionTooltipText = (
    <div>
      The version of the pipeline that will be used for this sample analysis.{" "}
      <ExternalLink href={pipelineHelpLink}>Learn more.</ExternalLink>
    </div>
  );

  return (
    <div className={cs.wrapper}>
      <div className={cs.headerRow}>
        <h5 className={cs.header}>Pipeline Version:</h5>
        <Tooltip
          className={cs.tooltip}
          arrow
          leaveDelay={1000}
          title={pipelineVersionTooltipText}
          placement="top"
          data-test-id="pipeline-version-tooltip"
        >
          <div>
            <Icon sdsIcon="infoCircle" sdsSize="s" sdsType="interactive" />
          </div>
        </Tooltip>
      </div>
      {version && <p className={cs.version}>{version}</p>}
      <p className={cs.subText}>
        {version ? versionSubtext : noVersionSubtext}
      </p>
    </div>
  );
};
