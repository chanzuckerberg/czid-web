import cx from "classnames";
import React, { useEffect, useState } from "react";
import BasicPopup from "~/components/BasicPopup";
import { IconAlert, IconCloseSmall } from "~ui/icons";
import cs from "./announcement_banner.scss";

interface AnnouncementBannerProps {
  visible?: boolean;
  message: string | React.ReactNode;
  inverted?: boolean;
  id: string;
}

const AnnouncementBanner = ({
  visible = false,
  message,
  inverted = false,
  id,
}: AnnouncementBannerProps) => {
  const [showAnnouncementBanner, setShowAnnouncmentBanner] = useState(false);

  useEffect(() => {
    if (visible) {
      const dismissedAnnouncementBanner = localStorage.getItem(
        `dismissedAnnouncementBanner-${id}`,
      );
      if (dismissedAnnouncementBanner !== "true") {
        setShowAnnouncmentBanner(true);
      }
    }
  }, [visible, id]);

  const handleAnnouncementBannerClose = () => {
    setShowAnnouncmentBanner(false);
    localStorage.setItem(`dismissedAnnouncementBanner-${id}`, "true");
  };

  if (!showAnnouncementBanner) return null;

  return (
    <div className={cx(cs.announcementBanner, inverted && cs.inverted)}>
      <BasicPopup
        content={message}
        position="bottom center"
        wide="very"
        trigger={
          <span className={cs.content}>
            <IconAlert className={cx(cs.icon, inverted && cs.inverted)} />
            {message}
          </span>
        }
      />
      <IconCloseSmall
        className={cx(cs.close, inverted && cs.inverted)}
        onClick={handleAnnouncementBannerClose}
      />
    </div>
  );
};

export default AnnouncementBanner;
