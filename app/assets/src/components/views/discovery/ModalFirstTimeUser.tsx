import React from "react";
import { withAnalytics } from "~/api/analytics";
import Modal from "~ui/containers/Modal";
import Link from "~ui/controls/Link";
import BacteriaCultureIcon from "~ui/icons/BacteriaCultureIcon";
import InfoBanner from "./InfoBanner";
import cs from "./modal_first_time_user.scss";

interface ModalFirstTimeUserProps {
  onClose: $TSFixMeFunction;
}

const ModalFirstTimeUser = ({ onClose }: ModalFirstTimeUserProps) => {
  return (
    <Modal
      open
      narrow
      tall
      className={cs.emptyStateModal}
      onClose={withAnalytics(onClose, "EmptyStatesModal_close-modal_clicked")}>
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
