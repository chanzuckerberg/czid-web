import React from "react";
import PropTypes from "prop-types";

import BasicPopup from "~/components/BasicPopup";
import InfoIconSmall from "~ui/icons/InfoIconSmall";
import cs from "./help_icon.scss";

class HelpIcon extends React.Component {
  render() {
    const { className, text } = this.props;
    return (
      <BasicPopup
        trigger={
          <div className={className}>
            <InfoIconSmall className={cs.helpIcon} />
          </div>
        }
        hoverable
        inverted={false}
        basic={false}
        size="small"
        position="top center"
        content={<div className={cs.tooltip}>{text}</div>}
      />
    );
  }
}

HelpIcon.propTypes = {
  className: PropTypes.string,
  text: PropTypes.node,
};

export default HelpIcon;
