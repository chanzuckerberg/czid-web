import React from "react";
import PropTypes from "prop-types";

import { logAnalyticsEvent } from "~/api/analytics";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";
import ImgMicrobePrimary from "~ui/illustrations/ImgMicrobePrimary";
import { IconAlert } from "~ui/icons";

import cs from "./nextclade_error_modal.scss";

const NextcladeErrorModal = ({ onCancel, onConfirm, open }) => {
  return (
    <Modal className={cs.nextcladeError} narrowest open={open}>
      <div className={cs.errorMessage}>
        <div className={cs.textContainer}>
          <div className={cs.error}>
            <IconAlert className={cs.icon} />
            <span className={cs.text}>Failed to send</span>
          </div>
          <div className={cs.title}>
            Sorry! There was an error sending your samples to Nextclade.
          </div>
          <div className={cs.message}>
            If you continue to have issues, please {}
            <a
              className={cs.actionLink}
              href="mailto:help@idseq.net"
              onClick={() =>
                logAnalyticsEvent(
                  "NextcladeModal_error-modal-help-link_clicked"
                )
              }
            >
              contact us
            </a>
            .
          </div>
        </div>
        <ImgMicrobePrimary className={cs.imgMicrobe} />
      </div>
      <div className={cs.actions}>
        <div className={cs.item}>
          <PrimaryButton text="Try Again" rounded={true} onClick={onConfirm} />
        </div>
        <div className={cs.item}>
          <SecondaryButton text="Cancel" rounded={true} onClick={onCancel} />
        </div>
      </div>
    </Modal>
  );
};

NextcladeErrorModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  open: PropTypes.bool,
};

export default NextcladeErrorModal;
