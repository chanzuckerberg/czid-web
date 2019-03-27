import React from "react";

import Icon from "~ui/icons/Icon";
import BasicPopup from "~/components/BasicPopup";

import SecondaryButton from "./SecondaryButton";

export const SaveButton = props => (
  <BasicPopup
    trigger={
      <SecondaryButton
        text="Save"
        {...props}
        icon={<Icon size="large" className={"save alternate"} />}
      />
    }
    content="Your visualization was saved!"
    on="click"
    hideOnScroll
  />
);

export default SaveButton;
