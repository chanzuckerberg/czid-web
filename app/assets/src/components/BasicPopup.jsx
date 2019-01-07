import React from "react";
import { Popup } from "semantic-ui-react";
import PropTypes from "prop-types";

class BasicPopup extends React.Component {
  render() {
    return <Popup {...this.props} on="hover" basic inverted />;
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
