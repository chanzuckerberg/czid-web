import React from "react";
import PropTypes from "prop-types";

import { withAnalytics } from "~/api/analytics";
import BacteriaCultureIcon from "~ui/icons/BacteriaCultureIcon";
import Link from "~ui/controls/Link";
import Modal from "~ui/containers/Modal";

import InfoBanner from "./InfoBanner";
import cs from "./empty_state_modal.scss";

const EmptyStateModal = ({ onClose }) => {
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

EmptyStateModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default EmptyStateModal;
