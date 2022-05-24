import React from "react";
import { IconHelp } from "~ui/icons";
import SecondaryButton from "./SecondaryButton";

import cs from "./help_button.scss";

const HelpButton = props => (
  <SecondaryButton
    circular={true}
    icon={<IconHelp className={cs.iconHelp} />}
    {...props}
  />
);

export default HelpButton;
