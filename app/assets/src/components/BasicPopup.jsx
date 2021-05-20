// If the BasicPopup isn't working for a <Trigger>, try wrapping it in a <div>.
// BasicPopup requires the trigger to accept onMouseEnter, onMouseLeave props.

import PropTypes from "prop-types";
import React from "react";
import { Popup } from "semantic-ui-react";

class BasicPopup extends React.Component {
  render() {
    return <Popup on="hover" {...this.props} />;
  }
}

BasicPopup.propTypes = {
  size: PropTypes.string,
  wide: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
};

BasicPopup.defaultProps = {
  basic: true,
  // Actionable tooltips should be black (inverted),
  // description/information tooltips should be white.
  inverted: true,
  size: "tiny",
};

export default BasicPopup;
