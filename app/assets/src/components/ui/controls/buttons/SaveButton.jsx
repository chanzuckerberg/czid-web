import React from "react";
import Icon from "~ui/icons/Icon";
import SecondaryButton from "./SecondaryButton";

export const SaveButton = props => (
  <SecondaryButton
    text="Save"
    {...props}
    icon={<Icon size="large" className={"save alternate"} />}
  />
);

export default SaveButton;
