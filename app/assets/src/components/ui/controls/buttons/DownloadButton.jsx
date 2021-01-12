import PropTypes from "prop-types";
import React from "react";

import { IconDownload } from "~ui/icons";

import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

import cs from "./download_button.scss";

const DownloadButton = ({ disabled, onClick, text, primary, ...props }) => {
  if (primary) {
    return (
      <PrimaryButton
        {...props}
        text={text}
        disabled={disabled}
        onClick={onClick}
        icon={<IconDownload className={cs.iconDownload} />}
      />
    );
  } else {
    return (
      <SecondaryButton
        {...props}
        text={text}
        disabled={disabled}
        onClick={onClick}
        icon={<IconDownload className={cs.iconDownload} />}
      />
    );
  }
};

DownloadButton.defaultProps = {
  primary: false,
  text: "Download",
};

DownloadButton.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  primary: PropTypes.bool,
  text: PropTypes.string,
};

export default DownloadButton;
