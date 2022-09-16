import { Tooltip, TooltipProps } from "czifui";
import React from "react";
import { ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { IconInfoSmall } from "~ui/icons";

import cs from "./project_info_icon_tooltip.scss";

interface ProjectInfoIconTooltipProps extends TooltipProps {
  isPublic: boolean;
}

const ProjectInfoIconTooltip = (props: ProjectInfoIconTooltipProps) => {
  const { isPublic, ...rest } = props;

  const description = isPublic
    ? "This project is viewable and searchable by anyone in CZ ID. "
    : "Samples added to this project will be private by default, visible only to you and other project members. Private samples will become public 1 year after their upload date. ";

  const content = (
    <>
      {description}
      <ExternalLink
        href={"https://help.czid.org"}
        analyticsEventName={
          ANALYTICS_EVENT_NAMES.PROJECT_VISIBILITY_HELP_LINK_CLICKED
        }
        analyticsEventData={{ link: "https://help.czid.org" }}
      >
        Learn more.
      </ExternalLink>
    </>
  );
  return (
    <Tooltip arrow title={content} {...rest}>
      <span className={cs.centerSpan}>
        <IconInfoSmall className={cs.projectInfoIcon} />
      </span>
    </Tooltip>
  );
};

export default ProjectInfoIconTooltip;
