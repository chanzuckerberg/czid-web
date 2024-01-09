import { Icon, Tooltip } from "@czi-sds/components";
import cx from "classnames";
import React from "react";
import { useAllowedFeatures } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { NCBI_COMPRESSED_INDEX } from "~/components/utils/features";
import commonStyles from "../../workflow_selector.scss";
import cs from "./pipeline_version_indicator.scss";

interface PipelineVersionIndicatorProps {
  warningHelpLink?: string;
  version?: string;
  versionHelpLink: string;
  isPipelineVersion: boolean;
  isNewVersionAvailable?: boolean;
}

export const PipelineVersionIndicator = ({
  warningHelpLink,
  version,
  versionHelpLink,
  isPipelineVersion,
  isNewVersionAvailable,
}: PipelineVersionIndicatorProps) => {
  const allowedFeatures = useAllowedFeatures();
  if (!allowedFeatures.includes(NCBI_COMPRESSED_INDEX) && !isPipelineVersion) {
    return null;
  }

  const newVersionAvailableText = (
    <div>
      A new {isPipelineVersion ? "major version" : "NCBI Index"} is available.
      Create a new project to run samples on the latest version.{" "}
      <ExternalLink href={warningHelpLink}>Learn More</ExternalLink>
    </div>
  );

  const header = isPipelineVersion ? "Pipeline Version:" : "NCBI Index Date:";

  const versionText = isPipelineVersion ? "version" : "NCBI Index";
  let versionSubtext: string | JSX.Element = "";
  if (version) {
    versionSubtext = (
      <span>
        <span>
          The selected project uses the above {versionText} to run your samples.{" "}
        </span>
        <ExternalLink href={versionHelpLink}>Learn More</ExternalLink>
      </span>
    );
  } else {
    versionSubtext = "Choose a project to view.";
  }

  return (
    <div className={cx(cs.wrapper, commonStyles.item)}>
      <div className={cs.headerRow}>
        <div className={commonStyles.subheader}>{header}</div>
        {isNewVersionAvailable && (
          <Tooltip
            className={cs.tooltip}
            arrow
            leaveDelay={1000}
            title={newVersionAvailableText}
            placement="top"
            data-test-id="pipeline-version-tooltip"
          >
            <div>
              <Icon
                className={cs.infoIcon}
                sdsIcon="infoCircle"
                sdsSize="s"
                sdsType="interactive"
              />
            </div>
          </Tooltip>
        )}
      </div>
      {version && <p className={cs.version}>{version}</p>}
      <p className={cs.subText}>{versionSubtext}</p>
    </div>
  );
};
