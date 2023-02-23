import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
} from "czifui";
import React from "react";
import { WORKFLOW_LABELS } from "~/components/utils/workflows";

import cs from "./bulk_delete_modal.scss";

interface BulkDeleteModalProps {
  onDelete(): void;
  onClose(): void;
  sampleCount: number;
  workflowLabel: WORKFLOW_LABELS;
}

const BulkDeleteModal = ({
  onDelete,
  onClose,
  sampleCount,
  workflowLabel,
}: BulkDeleteModalProps) => (
  <Dialog className={cs.dialog} open sdsSize="xs">
    <DialogTitle className={cs.dialogTitle}>
      Are you sure you want to delete {sampleCount} {workflowLabel} runs?
    </DialogTitle>
    <DialogContent>
      <div>
        <div>
          Deleting your runs will permanently remove the following from CZ ID
          for
          <span className={cs.semibold}> you and any collaborators </span>
          with access:
        </div>
        <List className={cs.list}>
          <ListItem>The raw data, metadata, and results.</ListItem>
          <ListItem>
            Any bulk download files that contain the deleted run.
          </ListItem>
        </List>
        <div>Here is how other artifacts will be affected:</div>
        <List className={cs.list}>
          <ListItem>
            Any saved heatmap or phylotree that contains the deleted runs,
            including saved visualizations, will remain and be re-run without
            those runs.
          </ListItem>
          <ListItem>
            Sample deletion will not affect existing background models.
          </ListItem>
          <ListItem>
            Your collaborators will be notified about any runs that have been
            deleted.
          </ListItem>
        </List>
        <span className={cs.semibold}>
          You will not be able to undo this action once completed.
        </span>
      </div>
    </DialogContent>
    <DialogActions className={cs.dialogActions}>
      <Button
        className={cs.deleteButton}
        onClick={onDelete}
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

export { BulkDeleteModal };
