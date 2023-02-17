import { Icon } from "czifui";
import React from "react";

import { trackEvent } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import cs from "./help_icon.scss";

interface HelpIconProps {
  analyticsEventData?: object;
  analyticsEventName?: string;
  className?: string;
  text?: React.ReactNode;
}

class HelpIcon extends React.Component<HelpIconProps> {
  handleTriggerEnter = () => {
    const { analyticsEventName, analyticsEventData } = this.props;
    if (analyticsEventName) {
      trackEvent(analyticsEventName, analyticsEventData);
    }
  };

  render() {
    const { className, text } = this.props;
    return (
      <BasicPopup
        trigger={
          <div className={className} onMouseEnter={this.handleTriggerEnter}>
            <Icon
              sdsIcon="infoCircle"
              sdsSize="s"
              sdsType="interactive"
              className={cs.helpIcon}
            />
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

export default HelpIcon;
