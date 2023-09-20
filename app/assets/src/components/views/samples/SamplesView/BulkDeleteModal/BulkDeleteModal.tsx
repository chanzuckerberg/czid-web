import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@czi-sds/components";
import React, { useEffect, useState } from "react";
import { bulkDeleteObjects, validateUserCanDeleteObjects } from "~/api";
import { ErrorButton } from "~/components/ui/controls/buttons";
import { pluralize } from "~/components/utils/stringUtil";
import { showToast } from "~/components/utils/toast";
import { WORKFLOWS, WorkflowType } from "~/components/utils/workflows";
import cs from "./bulk_delete_modal.scss";
import { DeleteErrorNotification } from "./DeleteErrorNotification";
import { DeleteSampleModalText } from "./DeleteSampleModalText";
import { DeleteSuccessNotification } from "./DeleteSuccessNotification";
import { InvalidSampleDeletionWarning } from "./InvalidSampleDeletionWarning";

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose(): void;
  selectedIds: number[];
  workflow: WorkflowType;
  onSuccess?(): void;
  redirectOnSuccess?: boolean;
}

const BulkDeleteModal = ({
  isOpen,
  onClose,
  selectedIds,
  workflow,
  onSuccess,
  redirectOnSuccess,
}: BulkDeleteModalProps) => {
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [validIds, setValidsIds] = useState<number[]>([]);
  const [invalidSampleNames, setInvalidSampleNames] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const validateSamplesCanBeDeleted = async () => {
    const { validIds: newIds, invalidSampleNames: newInvalidNames } =
      await validateUserCanDeleteObjects({ selectedIds, workflow });

    setIsValidating(false);
    setValidsIds(newIds);
    setInvalidSampleNames(newInvalidNames);
  };

  useEffect(() => {
    setIsValidating(true);
    setValidsIds([]);
    setInvalidSampleNames([]);

    if (!isOpen) return;

    validateSamplesCanBeDeleted();
  }, [selectedIds, workflow]);

  const workflowLabel = WORKFLOWS[workflow]?.label;

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
      const { error } = await bulkDeleteObjects({
        selectedIds: validIds,
        workflow,
      });
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
        <DeleteSampleModalText workflow={workflow} />
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
          startIcon={isDeleting ? "loading" : null}
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
