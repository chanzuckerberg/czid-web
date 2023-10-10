import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@czi-sds/components";
import React, { useEffect, useState } from "react";
import { ErrorButton } from "~/components/ui/controls/buttons";
import { pluralize } from "~/components/utils/stringUtil";
import { showToast } from "~/components/utils/toast";
import { WorkflowLabelType } from "~/components/utils/workflows";
import cs from "./bulk_delete_modal.scss";
import { DeleteErrorNotification } from "./DeleteErrorNotification";
import { DeleteSampleModalText } from "./DeleteSampleModalText";
import { DeleteSuccessNotification } from "./DeleteSuccessNotification";
import { InvalidSampleDeletionWarning } from "./InvalidSampleDeletionWarning";
interface BulkDeleteModalProps {
  bulkDeleteObjects: (selectedIds: number[]) => Promise<any>;
  isOpen: boolean;
  onClose(): void;
  selectedIds: number[];
  onSuccess?(): void;
  redirectOnSuccess?: boolean;
  validateUserCanDeleteObjects: (selectedIds: number[]) => Promise<any>;
  workflowLabel: WorkflowLabelType;
  isShortReadMngs?: boolean;
}

const BulkDeleteModal = ({
  isOpen,
  onClose,
  selectedIds,
  onSuccess,
  redirectOnSuccess,
  workflowLabel,
  isShortReadMngs,
  validateUserCanDeleteObjects,
  bulkDeleteObjects,
}: BulkDeleteModalProps) => {
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [validIds, setValidsIds] = useState<number[]>([]);
  const [invalidSampleNames, setInvalidSampleNames] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const validateSamplesCanBeDeleted = async () => {
      const { validIds: newIds, invalidSampleNames: newInvalidNames } =
        await validateUserCanDeleteObjects(selectedIds);

      setIsValidating(false);
      setValidsIds(newIds);
      setInvalidSampleNames(newInvalidNames);
    };

    setIsValidating(true);
    setValidsIds([]);
    setInvalidSampleNames([]);

    if (!isOpen) return;

    validateSamplesCanBeDeleted();
  }, [isOpen, selectedIds, validateUserCanDeleteObjects]);

  const onDeleteSuccess = ({ successCount }) => {
    if (!redirectOnSuccess) {
      setIsDeleting(false);
      onClose();
      showToast(({ closeToast }) => (
        <DeleteSuccessNotification
          onClose={closeToast}
          sampleCount={successCount}
          workflowLabel={workflowLabel}
        />
      ));
    }
    onSuccess && onSuccess();
  };

  const onDeleteError = ({ errorCount }) => {
    onClose();
    setIsDeleting(false);
    showToast(({ closeToast }) => (
      <DeleteErrorNotification
        onClose={closeToast}
        sampleCount={errorCount}
        workflowLabel={workflowLabel}
      />
    ));
  };

  const handleDeleteSamples = async () => {
    setIsDeleting(true);
    try {
      const { error } = await bulkDeleteObjects(validIds);
      if (error) {
        console.error(error);
        onDeleteError({ errorCount: validIds.length });
      } else {
        onDeleteSuccess({ successCount: validIds.length });
      }
    } catch (error) {
      console.error(error);
      onDeleteError({ errorCount: null });
    }
  };

  if (isValidating) return null;

  return (
    <Dialog
      className={cs.dialog}
      open={isOpen}
      sdsSize="xs"
      data-testid="bulk-delete-modal"
    >
      <DialogTitle className={cs.dialogTitle}>
        Are you sure you want to delete {validIds.length} {workflowLabel}{" "}
        {pluralize("run", validIds.length)}?
      </DialogTitle>
      <DialogContent>
        <DeleteSampleModalText isShortReadMngs={isShortReadMngs} />
        {invalidSampleNames.length > 0 && (
          <InvalidSampleDeletionWarning
            invalidSampleNames={invalidSampleNames}
          />
        )}
      </DialogContent>
      <DialogActions className={cs.dialogActions}>
        <ErrorButton
          onClick={handleDeleteSamples}
          data-testid="delete-samples-button"
          disabled={isDeleting}
          startIcon={isDeleting ? "loading" : undefined}
        >
          {!isDeleting ? "Delete" : "Deleting"}
        </ErrorButton>
        <Button
          sdsStyle="rounded"
          sdsType="secondary"
          onClick={onClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export { BulkDeleteModal };
