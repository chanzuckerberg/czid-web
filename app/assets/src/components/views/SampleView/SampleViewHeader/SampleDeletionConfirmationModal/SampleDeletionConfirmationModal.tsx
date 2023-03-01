import React from "react";

import Modal from "~ui/containers/Modal";
import { SecondaryButton } from "~ui/controls/buttons";
import { ErrorButton } from "../../../../ui/controls/buttons";

import cs from "./sample_deletion_confirmation_modal.scss";

interface SampleDeletionConfirmationModalProps {
  onCancel: $TSFixMeFunction;
  onConfirm: $TSFixMeFunction;
  open: boolean;
}

const SampleDeletionConfirmationModal = ({
  onCancel,
  onConfirm,
  open,
}: SampleDeletionConfirmationModalProps) => (
  <Modal
    className={cs.sampleDeletionConfirmation}
    open={open}
    onClose={onCancel}
    narrowest
    sCloseIcon
  >
    <div className={cs.title}>Are you sure?</div>
    <div className={cs.text}>The sample will be deleted permanently.</div>
    <div className={cs.actions}>
      <div className={cs.item}>
        <ErrorButton text="Confirm" onClick={onConfirm} />
      </div>
      <div className={cs.item}>
        <SecondaryButton text="Cancel" onClick={onCancel} rounded />
      </div>
    </div>
  </Modal>
);

export default SampleDeletionConfirmationModal;
