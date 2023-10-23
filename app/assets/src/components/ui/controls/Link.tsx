import cx from "classnames";
import React from "react";
import { useTrackEvent } from "~/api/analytics";
import cs from "./link.scss";

export interface LinkProps {
  // We use black styling for links on a colored background.
  coloredBackground?: boolean;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  external?: boolean;
  href?: string;
  // We intentionally don't have an onClick prop, because we don't want to encourage arbitrary onClick handlers,
  // since there is already an on-click behavior (following the link href). trackEvent is an exception.
  analyticsEventName?: string;
  analyticsEventData?: object;
}

const Link = ({
  analyticsEventData = {},
  analyticsEventName,
  external = false,
  href,
  coloredBackground = false,
  children,
  className,
  disabled,
}: LinkProps) => {
  const trackEvent = useTrackEvent();
  const onClick = () => {
    if (analyticsEventName) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
      trackEvent(analyticsEventName, analyticsEventData);
    }
  };
  return (
    <a
      href={href}
      className={cx(
        coloredBackground ? cs.linkBlack : cs.linkDefault,
        disabled && cs.linkDisabled,
        className,
      )}
      target={external ? "_blank" : null}
      rel="noopener noreferrer"
      onClick={onClick}
    >
      {children}
    </a>
  );
};

export default Link;
