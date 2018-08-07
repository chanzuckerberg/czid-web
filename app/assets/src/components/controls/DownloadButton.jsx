import { Icon } from "semantic-ui-react";
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

export default DownloadButton;
