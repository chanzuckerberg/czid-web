import { forbidExtraProps } from "airbnb-prop-types";
import BareDropdown from "./BareDropdown";
import PropTypes from "prop-types";
import React from "react";
import HeatmapIcon from "~ui/icons/HeatmapIcon";
import BasicPopup from "~/components/BasicPopup";
import cs from "./heatmap_icon_dropdown.scss";
import cx from "classnames";

const HeatmapIconDropdown = props => {
  const { iconClassName, onClick, ...extraProps } = props;
  return (
    <BareDropdown
      {...extraProps}
      hideArrow
      onChange={onClick}
      trigger={<HeatmapIcon className={cx(cs.icon, iconClassName)} />}
    />
  );
};

HeatmapIconDropdown.propTypes = forbidExtraProps({
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  disabled: PropTypes.bool,
  options: PropTypes.array,
  onClick: PropTypes.func,
  direction: PropTypes.oneOf(["left", "right"])
});

export default HeatmapIconDropdown;
