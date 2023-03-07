import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "czifui";
import React, { useEffect, useState } from "react";
import { bulkDeleteObjects, validateUserCanDeleteObjects } from "~/api";
import { showToast } from "~/components/utils/toast";
import {
  WORKFLOW_VALUES,
  getLabelFromWorkflow,
} from "~/components/utils/workflows";

import { DeleteErrorNotification } from "./DeleteErrorNotification";
import { DeleteSampleModalText } from "./DeleteSampleModalText";
import { DeleteSuccessNotification } from "./DeleteSuccessNotification";
import { InvalidSampleDeletionWarning } from "./InvalidSampleDeletionWarning";
import cs from "./bulk_delete_modal.scss";

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose(): void;
  selectedIds: number[];
  workflow: WORKFLOW_VALUES;
}

const BulkDeleteModal = ({
  isOpen,
  onClose,
  selectedIds,
  workflow,
}: BulkDeleteModalProps) => {
  const [validIds, setValidsIds] = useState<number[]>([]);
  const [invalidSampleNames, setInvalidSampleNames] = useState<string[]>([]);

  const validateSamplesCanBeDeleted = async () => {
    const {
      validIds: newIds,
      invalidSampleNames: newInvalidNames,
    } = await validateUserCanDeleteObjects({ selectedIds, workflow });

    setValidsIds(newIds);
    setInvalidSampleNames(newInvalidNames);
  };

  useEffect(() => {
    setValidsIds([]);
    setInvalidSampleNames([]);

    if (!isOpen) return;

    validateSamplesCanBeDeleted();
  }, [selectedIds, workflow]);

  const sampleCount = selectedIds.length;
  const workflowLabel = getLabelFromWorkflow(workflow);

  const onDeleteSuccess = ({ successCount }) => {
    showToast(({ closeToast }) => (
      <DeleteSuccessNotification
        onClose={closeToast}
        sampleCount={successCount}
        workflowLabel={workflowLabel}
      />
    ));
  };

  const onDeleteError = ({ errorCount }) => {
    showToast(({ closeToast }) => (
      <DeleteErrorNotification
        onClose={closeToast}
        sampleCount={errorCount}
        workflowLabel={workflowLabel}
      />
    ));
  };

  const handleDeleteSamples = async () => {
    onClose();

    const { deletedIds, error } = await bulkDeleteObjects({
      selectedIds: validIds,
      workflow,
    });

    if (error) {
      const failedCount = validIds.length - deletedIds.length;
      onDeleteError({ errorCount: failedCount });
    } else {
      onDeleteSuccess({ successCount: deletedIds.length });
    }
  };

  return (
    <Dialog className={cs.dialog} open={isOpen} sdsSize="xs">
      <DialogTitle className={cs.dialogTitle}>
        Are you sure you want to delete {sampleCount} {workflowLabel} runs?
      </DialogTitle>
      <DialogContent>
        <DeleteSampleModalText />
        {invalidSampleNames.length > 0 && (
          <InvalidSampleDeletionWarning
            invalidSampleNames={invalidSampleNames}
          />
        )}
      </DialogContent>
      <DialogActions className={cs.dialogActions}>
        <Button
          className={cs.deleteButton}
          onClick={handleDeleteSamples}
          sdsStyle="rounded"
          sdsType="primary"
          color="error"
        >
          Delete
        </Button>
        <Button sdsStyle="rounded" sdsType="secondary" onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export { BulkDeleteModal };
