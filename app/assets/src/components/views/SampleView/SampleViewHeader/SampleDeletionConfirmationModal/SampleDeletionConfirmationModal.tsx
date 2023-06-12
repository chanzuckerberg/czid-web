import { Button } from "@czi-sds/components";
import React, { useState } from "react";
import { ErrorButton } from "~/components/ui/controls/buttons";
import Modal from "~ui/containers/Modal";
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
}: SampleDeletionConfirmationModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const onConfirmClick = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (e) {
      onCancel();
      setIsDeleting(false);
      console.error("error deleting sample", e);
    }
  };
  return (
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
          <ErrorButton
            onClick={onConfirmClick}
            disabled={isDeleting}
            startIcon={isDeleting ? "loading" : "trashCan"}
          >
            {!isDeleting ? "Delete" : "Deleting..."}
          </ErrorButton>
        </div>
        <div className={cs.item}>
          <Button
            disabled={isDeleting}
            sdsStyle="rounded"
            sdsType="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SampleDeletionConfirmationModal;
