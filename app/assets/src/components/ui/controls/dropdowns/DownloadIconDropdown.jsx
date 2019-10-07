import { forbidExtraProps } from "airbnb-prop-types";
import PropTypes from "prop-types";
import React from "react";

import ToolbarIcon from "~/components/views/samples/ToolbarIcon";

import BareDropdown from "./BareDropdown";

const DownloadIconDropdown = props => {
  const { iconClassName, onClick, ...extraProps } = props;
  return (
    <BareDropdown
      {...extraProps}
      hideArrow
      onChange={onClick}
      trigger={
        <ToolbarIcon
          className={iconClassName}
          icon="download"
          popupText="Download"
        />
      }
    />
  );
};

DownloadIconDropdown.propTypes = forbidExtraProps({
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  disabled: PropTypes.bool,
  options: PropTypes.array,
  onClick: PropTypes.func,
  direction: PropTypes.oneOf(["left", "right"]),
});

export default DownloadIconDropdown;
