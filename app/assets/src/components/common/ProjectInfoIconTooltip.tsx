import { Icon, Tooltip, TooltipProps } from "@czi-sds/components";
import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { PROJECT_SHARING_HELP_LINK } from "~/components/utils/documentationLinks";
import cs from "./project_info_icon_tooltip.scss";

interface ProjectInfoIconTooltipProps
  extends Omit<TooltipProps, "children" | "title"> {
  isPublic: boolean;
}

const ProjectInfoIconTooltip = (props: ProjectInfoIconTooltipProps) => {
  const { isPublic, ...rest } = props;

  const description = isPublic
    ? "This project is viewable and searchable by anyone in CZ ID. "
    : "Samples added to this project will be private by default, visible only to you and other project members. You can change your project from private to public at anytime.";

  const content = (
    <>
      {description}
      <ExternalLink
        href={PROJECT_SHARING_HELP_LINK}
        analyticsEventData={{
          link: PROJECT_SHARING_HELP_LINK,
        }}
      >
        Learn more.
      </ExternalLink>
    </>
  );
  return (
    <Tooltip arrow title={content} {...rest}>
      <span className={cs.centerSpan}>
        <Icon
          sdsIcon="infoCircle"
          sdsSize="s"
          sdsType="interactive"
          className={cs.projectInfoIcon}
        />
      </span>
    </Tooltip>
  );
};

export default ProjectInfoIconTooltip;
