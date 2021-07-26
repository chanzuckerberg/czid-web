import { forbidExtraProps } from "airbnb-prop-types";
import PropTypes from "prop-types";
import React from "react";

import { IconDownload } from "~ui/icons";

import ButtonDropdown from "./ButtonDropdown";

import cs from "./download_button_dropdown.scss";

const DownloadButtonDropdown = props => {
  return (
    <ButtonDropdown
      {...props}
      secondary
      fluid
      text="Download"
      icon={<IconDownload className={cs.iconDownload} />}
    />
  );
};

DownloadButtonDropdown.propTypes = forbidExtraProps({
  className: PropTypes.string,
  disabled: PropTypes.bool,
  items: PropTypes.arrayOf(PropTypes.node),
  options: PropTypes.array,
  onClick: PropTypes.func,
  direction: PropTypes.oneOf(["left", "right"]),
});

export default DownloadButtonDropdown;
