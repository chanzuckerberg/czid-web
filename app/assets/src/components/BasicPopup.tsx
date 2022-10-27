// If the BasicPopup isn't working for a <Trigger>, try wrapping it in a <div>.
// BasicPopup requires the trigger to accept onMouseEnter, onMouseLeave props.

import React from "react";
import { Popup, PopupProps } from "semantic-ui-react";

const BasicPopup = (props: PopupProps) => <Popup on="hover" {...props} />;

BasicPopup.defaultProps = {
  basic: true,
  // Actionable tooltips should be black (inverted),
  // description/information tooltips should be white.
  inverted: true,
  size: "tiny",
};

export default BasicPopup;
