import React, { useContext, useEffect } from "react";
import {
  ANALYTICS_EVENT_NAMES,
  useTrackEvent,
  useWithAnalytics,
} from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import Modal from "~ui/containers/Modal";
import Link from "~ui/controls/Link";
import BacteriaCultureIcon from "~ui/icons/BacteriaCultureIcon";
import InfoBanner from "./InfoBanner";
import cs from "./modal_first_time_user.scss";

interface ModalFirstTimeUserProps {
  onClose: $TSFixMeFunction;
}

const ModalFirstTimeUser = ({ onClose }: ModalFirstTimeUserProps) => {
  const { userId } = useContext(UserContext);
  const trackEvent = useTrackEvent();
  const withAnalytics = useWithAnalytics();

  useEffect(() => {
    trackEvent(ANALYTICS_EVENT_NAMES.MODAL_FIRST_TIME_USER_SHOWN, {
      userId: userId,
    });
  }, [trackEvent, userId]);

  return (
    <Modal
      open
      narrow
      tall
      className={cs.emptyStateModal}
      onClose={withAnalytics(
        onClose,
        ANALYTICS_EVENT_NAMES.EMPTY_STATES_MODAL_CLOSE_MODAL_CLICKED,
      )}
    >
      <InfoBanner
        className={cs.emptyStateBanner}
        contentClassName={cs.content}
        icon={<BacteriaCultureIcon />}
        iconClassName={cs.iconClassName}
        message={
          <React.Fragment>
            To get started, you can{" "}
            <Link className={cs.link} href={"/samples/upload"}>
              Upload
            </Link>{" "}
            your own data or browse our{" "}
            <Link className={cs.link} href="/public">
              Public Data
            </Link>
            .
          </React.Fragment>
        }
        title="Welcome to CZ ID!"
        titleClassName={cs.titleClassName}
        type="initial-modal"
      />
    </Modal>
  );
};

export default ModalFirstTimeUser;
