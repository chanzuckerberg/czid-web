import React from "react";
import { IconShare } from "~ui/icons";
import PrimaryButton from "./PrimaryButton";

const ShareButton = props => (
  <PrimaryButton text="Share" {...props} icon={<IconShare />} />
);

export default ShareButton;
