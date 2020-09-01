import React from "react";
import PropTypes from "~/components/utils/propTypes";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import InfoIconSmall from "~ui/icons/InfoIconSmall";

import cs from "./project_info_icon_tooltip.scss";

const ProjectInfoIconTooltip = props => {
  const { isPublic, ...rest } = props;

  const description = isPublic
    ? "This project is viewable and searchable by anyone in IDseq. "
    : "Samples added to this project will be private by default, visible only to you and other project members. Private samples will become public 1 year after their upload date. ";
  return (
    <ColumnHeaderTooltip
      className={cs.projectInfoIconTooltip} // Manually sets width of tooltip to 300px
      trigger={
        <span className={cs.centerSpan}>
          <InfoIconSmall className={cs.projectInfoIcon} />
        </span>
      }
      content={description}
      link="https://help.idseq.net"
      {...rest}
    />
  );
};

ProjectInfoIconTooltip.propTypes = {
  isPublic: PropTypes.bool.isRequired,
};

export default ProjectInfoIconTooltip;
