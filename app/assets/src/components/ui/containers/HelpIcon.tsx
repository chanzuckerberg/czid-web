import { Icon } from "@czi-sds/components";
import React from "react";
import { useTrackEvent } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import ExternalLink from "../controls/ExternalLink";
import cs from "./help_icon.scss";

interface HelpIconProps {
  analyticsEventData?: object;
  analyticsEventName?: string;
  className?: string;
  // NOTE: putting links in a tooltip that opens on hover is not accessible. However, we are using
  // this pattern in many places already, so we are keeping it for now. May as well keep it in the reusable
  // component so that we can easily update it later.
  learnMoreLinkUrl?: string;
  learnMoreLinkAnalyticsEventName?: string;
  text?: React.ReactNode;
}

const HelpIcon = ({
  analyticsEventData,
  analyticsEventName,
  className,
  learnMoreLinkUrl,
  learnMoreLinkAnalyticsEventName,
  text,
}: HelpIconProps) => {
  const trackEvent = useTrackEvent();
  const handleTriggerEnter = () => {
    if (analyticsEventName) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
      trackEvent(analyticsEventName, analyticsEventData);
    }
  };

  return (
    <BasicPopup
      trigger={
        <div className={className} onMouseEnter={handleTriggerEnter}>
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
      content={
        <div className={cs.tooltip}>
          {text}
          {learnMoreLinkUrl && (
            <>
              {` `}
              <ExternalLink
                href={learnMoreLinkUrl}
                analyticsEventName={learnMoreLinkAnalyticsEventName}
              >
                Learn more.
              </ExternalLink>
            </>
          )}
        </div>
      }
    />
  );
};

export default HelpIcon;
