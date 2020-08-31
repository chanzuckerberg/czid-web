import React from "react";
import PropTypes from "~/components/utils/propTypes";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import InfoIconSmall from "~ui/icons/InfoIconSmall";

import cs from "./project_info_icon_tooltip.scss";

const ProjectInfoIconTooltip = props => {
  const { isPublic } = props;

  const description = isPublic
    ? "This project is viewable and searchable by anyone in IDseq. "
    : "Samples added to this project will be private by default, visible only to you and other project members. Private samples will become public 1 year after their upload date. ";
  return (
    <ColumnHeaderTooltip
      trigger={
        <span>
          <InfoIconSmall className={cs.projectInfoIcon} />
        </span>
      }
      // Offset required to align the carrot of the tooltip accurately on top of the InfoIconSmall.
      // This issue is caused by nested div containers being passed to the prop "content" in BasicPopup
      offset="-7px, 0px"
      wide={true}
      position="top left"
      content={description}
      link="https://help.idseq.net"
    />
  );
};

ProjectInfoIconTooltip.propTypes = {
  isPublic: PropTypes.bool.isRequired,
};

export default ProjectInfoIconTooltip;
