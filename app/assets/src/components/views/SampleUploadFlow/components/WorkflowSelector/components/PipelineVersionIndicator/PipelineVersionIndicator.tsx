import { Icon, Tooltip } from "@czi-sds/components";
import cx from "classnames";
import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import commonStyles from "../../workflow_selector.scss";
import cs from "./pipeline_version_indicator.scss";

interface PipelineVersionIndicatorProps {
  // If a version is pinned, this implementation requires a help link.
  // Otherwise we would have 2 variables when 1 would suffice.
  pinnedVersionHelpLink?: string;
  pipelineHelpLink: string;
  version?: string;
}

export const PipelineVersionIndicator = ({
  pinnedVersionHelpLink,
  pipelineHelpLink,
  version,
}: PipelineVersionIndicatorProps) => {
  const pipelineVersionTooltipText = (
    <div>
      The version of the pipeline that will be used for this sample analysis.{" "}
      <ExternalLink href={pipelineHelpLink}>Learn more.</ExternalLink>
    </div>
  );

  let versionSubtext: string | JSX.Element = "";
  if (pinnedVersionHelpLink) {
    versionSubtext = (
      <span>
        <span>
          This is the version available for the samples in your project.{" "}
        </span>
        <ExternalLink href={pinnedVersionHelpLink}>Learn more.</ExternalLink>
      </span>
    );
  } else if (version) {
    versionSubtext =
      "This is the latest version, it might differ from other samples in your project.";
  } else {
    versionSubtext = "Choose a project to view.";
  }

  return (
    <div className={cx(cs.wrapper, commonStyles.item)}>
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
      <p className={cs.subText}>{versionSubtext}</p>
    </div>
  );
};
