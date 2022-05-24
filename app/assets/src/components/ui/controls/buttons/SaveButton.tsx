import React from "react";

import BasicPopup from "~/components/BasicPopup";
import { IconSave } from "~ui/icons";

import SecondaryButton from "./SecondaryButton";

export const SaveButton = props => (
  <BasicPopup
    trigger={<SecondaryButton text="Save" {...props} icon={<IconSave />} />}
    content="Your visualization was saved!"
    on="click"
    hideOnScroll
  />
);

export default SaveButton;
