import React from "react";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";
import cs from "./disable_sharing_confirmation_modal.scss";

interface DisableSharingConfirmationModalProps {
  open?: boolean;
  onCancel: $TSFixMeFunction;
  onConfirm: $TSFixMeFunction;
}

const DisableSharingConfirmationModal = ({
  open,
  onCancel,
  onConfirm,
}: DisableSharingConfirmationModalProps) => {
  return (
    <Modal className={cs.confirmationModal} narrowest open={open} tall>
      <div className={cs.title}>
        Are you sure you want to disable the View-Only Link?
      </div>
      <div className={cs.body}>
        You will not be able to restore this link. However, you can create a new
        link with the current sample list and pipeline version.
      </div>
      <div className={cs.actions}>
        <div className={cs.item}>
          <PrimaryButton
            text="Turn off link"
            rounded={true}
            onClick={onConfirm}
          />
        </div>
        <div className={cs.item}>
          <SecondaryButton text="Cancel" rounded={true} onClick={onCancel} />
        </div>
      </div>
    </Modal>
  );
};

export default DisableSharingConfirmationModal;
