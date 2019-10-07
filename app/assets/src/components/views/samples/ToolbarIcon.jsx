// ToolbarIcons are used at the top of the Samples View table.
// ToolbarIcons are opinionated about their sizing (styling is hard-coded and tweaked for certain icons)
// If you need multiple sizes of ToolbarIcons, please add a "size" prop instead of directly applying
// styles to ToolbarIcons.

import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";

import BasicPopup from "~/components/BasicPopup";
import DownloadIcon from "~ui/icons/DownloadIcon";
import HeatmapIcon from "~ui/icons/HeatmapIcon";
import PhyloTreeIcon from "~ui/icons/PhyloTreeIcon";
import SaveIcon from "~ui/icons/SaveIcon";

import cs from "./toolbar_icon.scss";

const ICON_COMPONENTS = {
  save: SaveIcon,
  heatmap: HeatmapIcon,
  phyloTree: PhyloTreeIcon,
  download: DownloadIcon,
};

class ToolbarIcon extends React.Component {
  getIconComponent() {
    return ICON_COMPONENTS[this.props.icon];
  }

  render() {
    const { className, popupText, disabled, onClick } = this.props;
    const IconComponent = this.getIconComponent();

    const icon = (
      <div
        className={cx(className, cs.iconWrapper, disabled && cs.disabled)}
        onClick={onClick}
      >
        <IconComponent className={cx(cs.icon, cs[this.props.icon])} />
      </div>
    );

    if (!popupText) {
      return icon;
    }

    return (
      <BasicPopup
        trigger={icon}
        content={popupText}
        position="top center"
        basic={false}
      />
    );
  }
}

ToolbarIcon.propTypes = {
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  icon: PropTypes.string,
  popupText: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

export default ToolbarIcon;
