import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@czi-sds/components";
import React, { Suspense, useState } from "react";
import { useLazyLoadQuery, useMutation } from "react-relay";
import { graphql } from "relay-runtime";
import { getCsrfToken } from "~/api/utils";
import { ErrorButton } from "~/components/ui/controls/buttons";
import { logError } from "~/components/utils/logUtil";
import { pluralize } from "~/components/utils/stringUtil";
import { showToast } from "~/components/utils/toast";
import { isNotNullish } from "~/components/utils/typeUtils";
import {
  getWorkflowTypeFromLabel,
  WorkflowLabelType,
} from "~/components/utils/workflows";
import { SampleId } from "~/interface/shared";
import cs from "./bulk_delete_modal.scss";
import { DeleteErrorNotification } from "./DeleteErrorNotification";
import { DeleteSampleModalText } from "./DeleteSampleModalText";
import { DeleteSuccessNotification } from "./DeleteSuccessNotification";
import { InvalidSampleDeletionWarning } from "./InvalidSampleDeletionWarning";
import { BulkDeleteModalMutation as BulkDeleteModalMutationType } from "./__generated__/BulkDeleteModalMutation.graphql";
import { BulkDeleteModalQuery as BulkDeleteModalQueryType } from "./__generated__/BulkDeleteModalQuery.graphql";

const BulkDeleteModalQuery = graphql`
  query BulkDeleteModalQuery(
    $selectedIds: [Int]
    $selectedIdsStrings: [String]
    $workflow: String!
    $authenticityToken: String!
  ) {
    ValidateUserCanDeleteObjects(
      input: {
        selectedIds: $selectedIds
        selectedIdsStrings: $selectedIdsStrings
        workflow: $workflow
        authenticityToken: $authenticityToken
      }
    ) {
      validIdsStrings
      invalidSampleNames
      error
    }
  }
`;

const BulkDeleteModalMutation = graphql`
  mutation BulkDeleteModalMutation(
    $ids: [Int]
    $idsStrings: [String]
    $workflow: String!
    $authenticityToken: String!
  ) {
    DeleteSamples(
      input: {
        ids: $ids
        idsStrings: $idsStrings
        workflow: $workflow
        authenticityToken: $authenticityToken
      }
    ) {
      error
    }
  }
`;

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose(): void;
  selectedIds: SampleId[];
  onSuccess?(): void;
  redirectOnSuccess?: boolean;
  workflowLabel: WorkflowLabelType;
  isShortReadMngs?: boolean;
}

const BulkDeleteModalComponent = ({
  isOpen,
  onClose,
  selectedIds,
  onSuccess,
  redirectOnSuccess,
  workflowLabel,
  isShortReadMngs,
}: BulkDeleteModalProps) => {
  // Relay hooks:
  const { ValidateUserCanDeleteObjects: data } =
    useLazyLoadQuery<BulkDeleteModalQueryType>(BulkDeleteModalQuery, {
      selectedIdsStrings: selectedIds.map((id: SampleId) => id.toString()),
      workflow: getWorkflowTypeFromLabel(workflowLabel),
      authenticityToken: getCsrfToken(),
    });
  const [commit, isInFlight] = useMutation<BulkDeleteModalMutationType>(
    BulkDeleteModalMutation,
  );

  // Component state:
  const [isRedirecting, setIsRedirecting] = useState(false);
  const buttonsDisabled = isInFlight || isRedirecting;

  // Loading error:
  if (data == null || data.error) {
    logError({
      message: data?.error
        ? data.error
        : "Error retrieving deletion permissions",
    });
    return null;
  }

  // Data from query:
  const validIds = data.validIdsStrings.filter(isNotNullish);
  const invalidSampleNames = data.invalidSampleNames.filter(
    (invalidSampleName): invalidSampleName is string =>
      invalidSampleName != null,
  );

  // Delete callbacks:
  const deleteSamples = async () => {
    commit({
      variables: {
        idsStrings: validIds,
        workflow: getWorkflowTypeFromLabel(workflowLabel),
        authenticityToken: getCsrfToken(),
      },
      onCompleted: data => {
        if (data.DeleteSamples != null && data.DeleteSamples.error == null) {
          onDeleteSuccess({
            successCount: validIds.length,
          });
        } else {
          onDeleteError(
            data.DeleteSamples?.error ?? undefined,
            validIds.length,
          );
        }
      },
      onError: error => {
        onDeleteError(error.message);
      },
    });
  };
  const onDeleteSuccess = ({ successCount }) => {
    if (redirectOnSuccess) {
      setIsRedirecting(true);
    } else {
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
  const onDeleteError = (error?: string, numSamples?: number) => {
    onClose();
    showToast(({ closeToast }) => (
      <DeleteErrorNotification
        onClose={closeToast}
        sampleCount={numSamples}
        workflowLabel={workflowLabel}
      />
    ));
    if (error !== undefined) {
      logError({ message: `Delete failed: ${error}` });
    }
  };

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
          onClick={deleteSamples}
          data-testid="delete-samples-button"
          disabled={buttonsDisabled}
          startIcon={buttonsDisabled ? "loading" : undefined}
        >
          {buttonsDisabled ? "Deleting" : "Delete"}
        </ErrorButton>
        <Button
          sdsStyle="rounded"
          sdsType="secondary"
          onClick={onClose}
          disabled={buttonsDisabled}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export function BulkDeleteModal(props: BulkDeleteModalProps) {
  if (!props.isOpen) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <BulkDeleteModalComponent {...props}></BulkDeleteModalComponent>
    </Suspense>
  );
}
