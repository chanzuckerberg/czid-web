import PropTypes from "prop-types";
import React from "react";

import cs from "./blank_screen_message.scss";

class BlankScreenMessage extends React.Component {
  render() {
    const { icon, message, tagline, textWidth } = this.props;

    return (
      <div className={cs.blankScreenMessage}>
        <div className={cs.content}>
          <div className={cs.text} style={{ width: textWidth }}>
            <div className={cs.message}>{message}</div>
            <div className={cs.tagline}>{tagline}</div>
          </div>
          {icon}
        </div>
      </div>
    );
  }
}

BlankScreenMessage.propTypes = {
  icon: PropTypes.object,
  message: PropTypes.string,
  tagline: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  textWidth: PropTypes.number,
};

export default BlankScreenMessage;
