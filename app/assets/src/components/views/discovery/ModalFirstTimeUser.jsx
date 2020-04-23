import React from "react";
import PropTypes from "prop-types";

import { withAnalytics } from "~/api/analytics";
import BacteriaCultureIcon from "~ui/icons/BacteriaCultureIcon";
import Link from "~ui/controls/Link";
import Modal from "~ui/containers/Modal";

import InfoBanner from "./InfoBanner";
import cs from "./modal_first_time_user.scss";

const ModalFirstTimeUser = ({ onClose }) => {
  return (
    <Modal
      open
      narrow
      tall
      className={cs.emptyStateModal}
      onClose={withAnalytics(onClose, "EmptyStatesModal_close-modal_clicked")}
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
            </Link>.
          </React.Fragment>
        }
        title="Welcome to IDseq!"
        titleClassName={cs.titleClassName}
        type="initial-modal"
      />
    </Modal>
  );
};

ModalFirstTimeUser.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ModalFirstTimeUser;
