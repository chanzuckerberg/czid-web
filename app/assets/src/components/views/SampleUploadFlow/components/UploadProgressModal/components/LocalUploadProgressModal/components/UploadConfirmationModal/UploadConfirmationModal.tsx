import React from "react";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";
import cs from "./upload_confirmation_modal.scss";

interface UploadConfirmationModalProps {
  numberOfFailedSamples: number;
  open?: boolean;
  onCancel: $TSFixMeFunction;
  onConfirm: $TSFixMeFunction;
}

export const UploadConfirmationModal = ({
  numberOfFailedSamples,
  open,
  onCancel,
  onConfirm,
}: UploadConfirmationModalProps) => {
  return (
    <Modal className={cs.uploadConfirmationModal} narrowest open={open} tall>
      <div className={cs.title}>
        Are you sure you want to leave with {numberOfFailedSamples} failed
        upload{numberOfFailedSamples > 1 && "s"}?
      </div>
      <div className={cs.body}>
        You will lose the information you entered for the failed samples.
      </div>
      <div className={cs.actions}>
        <div className={cs.item}>
          <PrimaryButton
            text="Yes, leave Upload"
            rounded={true}
            onClick={onConfirm}
          />
        </div>
        <div className={cs.item}>
          <SecondaryButton
            text="Return to Upload"
            rounded={true}
            onClick={onCancel}
          />
        </div>
      </div>
    </Modal>
  );
};
