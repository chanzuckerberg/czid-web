import { Icon } from "semantic-ui-react";
import PropTypes from "prop-types";
import SecondaryButton from "./SecondaryButton";
import React from "react";

const DownloadButton = ({ what, disabled, onClick }) => {
  let text = "Download";
  if (what) {
    text += ` ${what}`;
  }
  return (
    <SecondaryButton
      text={text}
      disabled={disabled}
      onClick={onClick}
      icon={<Icon size="large" className={"cloud download alternate"} />}
    />
  );
};

DownloadButton.propTypes = {
  what: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};

export default DownloadButton;
