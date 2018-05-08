import React from "react";
import { Popup } from "semantic-ui-react";

class BasicPopup extends React.Component {
  render() {
    return <Popup {...this.props} on="hover" basic inverted size="tiny" />;
  }
}

export default BasicPopup;
