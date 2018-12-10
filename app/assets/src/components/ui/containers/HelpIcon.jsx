import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { Popup } from "semantic-ui-react";
import cs from "./help_icon.scss";

class HelpIcon extends React.Component {
  render() {
    return (
      <Popup
        trigger={
          <i
            className={cx(
              "fa fa-question-circle",
              cs.helpIcon,
              this.props.className
            )}
          />
        }
        inverted
        content={this.props.text}
        horizontalOffset={13}
      />
    );
  }
}

HelpIcon.propTypes = {
  className: PropTypes.string,
  text: PropTypes.string
};

export default HelpIcon;
