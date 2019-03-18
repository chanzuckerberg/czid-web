import { forbidExtraProps } from "airbnb-prop-types";
import BareDropdown from "./BareDropdown";
import PropTypes from "prop-types";
import React from "react";
import DownloadIcon from "~ui/icons/DownloadIcon";
import cs from "./download_icon_dropdown.scss";
import cx from "classnames";

const DownloadIconDropdown = props => {
  const { iconClassName, onClick, ...extraProps } = props;
  return (
    <BareDropdown
      {...extraProps}
      hideArrow
      onChange={onClick}
      trigger={<DownloadIcon className={cx(cs.icon, iconClassName)} />}
    />
  );
};

DownloadIconDropdown.propTypes = forbidExtraProps({
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  disabled: PropTypes.bool,
  options: PropTypes.array,
  onClick: PropTypes.func,
  direction: PropTypes.oneOf(["left", "right"])
});

export default DownloadIconDropdown;
