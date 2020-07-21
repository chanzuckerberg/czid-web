import PropTypes from "prop-types";
import React from "react";
import { Icon } from "semantic-ui-react";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

const DownloadButton = ({ disabled, onClick, text, primary, ...props }) => {
  if (primary) {
    return (
      <PrimaryButton
        {...props}
        text={text}
        disabled={disabled}
        onClick={onClick}
        icon={<Icon size="large" className={"cloud download alternate"} />}
      />
    );
  } else {
    return (
      <SecondaryButton
        {...props}
        text={text}
        disabled={disabled}
        onClick={onClick}
        icon={<Icon size="large" className={"cloud download alternate"} />}
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
