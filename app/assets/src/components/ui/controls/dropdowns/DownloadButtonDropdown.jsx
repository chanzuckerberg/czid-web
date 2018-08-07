import { Icon } from "semantic-ui-react";
import ButtonDropdown from "./ButtonDropdown";
import PropTypes from "prop-types";
import React from "react";

const DownloadButtonDropdown = ({ disabled, options, onClick }) => {
  return (
    <ButtonDropdown
      secondary
      fluid
      options={options}
      disabled={disabled}
      text="Download"
      onClick={onClick}
      icon={<Icon size="large" className={"cloud download alternate"} />}
    />
  );
};

DownloadButtonDropdown.propTypes = {
  disabled: PropTypes.bool,
  options: PropTypes.array,
  onClick: PropTypes.func
};

export default DownloadButtonDropdown;
