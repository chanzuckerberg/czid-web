import React from "react";
import PropTypes from "prop-types";

import ExternalLink from "~/components/ui/controls/ExternalLink";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";
import ImgMicrobePrimary from "~ui/illustrations/ImgMicrobePrimary";
import { IconAlert } from "~ui/icons";

import cs from "./error_modal.scss";

const ErrorModal = ({
  helpLinkEvent,
  labelText,
  onCancel,
  onConfirm,
  open,
  title,
}) => {
  return (
    <Modal className={cs.errorModal} narrowest open={open}>
      <div className={cs.errorMessage}>
        <div className={cs.textContainer}>
          <div className={cs.error}>
            <IconAlert className={cs.icon} />
            <span className={cs.text}>{labelText}</span>
          </div>
          <div className={cs.title}>{title}</div>
          <div className={cs.message}>
            If you continue to have issues, please {}
            <ExternalLink
              className={cs.actionLink}
              href="mailto:help@idseq.net"
              analyticsEventName={helpLinkEvent}
            >
              contact us
            </ExternalLink>
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

ErrorModal.propTypes = {
  helpLinkEvent: PropTypes.string,
  labelText: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  open: PropTypes.bool,
  title: PropTypes.string,
};

export default ErrorModal;
