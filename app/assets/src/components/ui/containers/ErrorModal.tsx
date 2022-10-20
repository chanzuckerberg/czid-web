import React from "react";

import ExternalLink from "~/components/ui/controls/ExternalLink";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";
import { IconAlert } from "~ui/icons";
import ImgMicrobePrimary from "~ui/illustrations/ImgMicrobePrimary";

import cs from "./error_modal.scss";

interface ErrorModalProps {
  helpLinkEvent?: string;
  labelText?: string;
  onCancel: $TSFixMeFunction;
  onConfirm: $TSFixMeFunction;
  open?: boolean;
  title?: string;
}

const ErrorModal = ({
  helpLinkEvent,
  labelText,
  onCancel,
  onConfirm,
  open,
  title,
}: ErrorModalProps) => {
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
              href="mailto:help@czid.org"
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

export default ErrorModal;
