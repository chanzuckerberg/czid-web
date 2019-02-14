import React from "react";
import Icon from "~ui/icons/Icon";
import PrimaryButton from "./PrimaryButton";

const ShareButton = props => (
  <PrimaryButton
    text="Share"
    {...props}
    icon={<Icon size="large" className={"share alternate"} />}
  />
);

export default ShareButton;
