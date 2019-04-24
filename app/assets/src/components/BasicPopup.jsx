// If the BasicPopup isn't working for a <Trigger>, try wrapping it in a <div>.
// BasicPopup requires the trigger to accept onMouseEnter, onMouseLeave props.

import React from "react";
import { Popup } from "semantic-ui-react";
import PropTypes from "prop-types";

class BasicPopup extends React.Component {
  render() {
    return <Popup on="hover" {...this.props} basic inverted />;
  }
}

BasicPopup.propTypes = {
  size: PropTypes.string,
  wide: PropTypes.string
};

BasicPopup.defaultProps = {
  size: "tiny"
};

export default BasicPopup;
