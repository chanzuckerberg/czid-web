import { Icon } from "semantic-ui-react";
import PropTypes from "prop-types";
import SecondaryButton from "./SecondaryButton";
import React from "react";

const DownloadButton = ({ disabled, onClick }) => {
  return (
    <SecondaryButton
      text="Download"
      disabled={disabled}
      onClick={onClick}
      icon={<Icon size="large" className={"cloud download alternate"} />}
    />
  );
};

DownloadButton.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};

export default DownloadButton;
