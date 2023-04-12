import { Icon, Tooltip } from "czifui";
import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { PIPELINE_HELP_LINK } from "~/components/utils/documentationLinks";
import cs from "./pipeline_version_indicator.scss";

interface PipelineVersionIndicatorProps {
  version?: string;
}

const versionSubtext =
  "This is the latest version consistent with the samples in your project.";
const noVersionSubtext = "Choose a project to view.";

const PIPELINE_VERSION_TOOLTIP_TEXT = (
  <div>
    The version of the pipeline that will be used for this sample analysis.{" "}
    <ExternalLink href={PIPELINE_HELP_LINK}>Learn more.</ExternalLink>
  </div>
);

export const PipelineVersionIndicator = ({
  version,
}: PipelineVersionIndicatorProps) => {
  return (
    <div className={cs.wrapper}>
      <div className={cs.headerRow}>
        <h5 className={cs.header}>Pipeline Version:</h5>
        <Tooltip
          className={cs.tooltip}
          arrow
          leaveDelay={1000}
          title={PIPELINE_VERSION_TOOLTIP_TEXT}
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
