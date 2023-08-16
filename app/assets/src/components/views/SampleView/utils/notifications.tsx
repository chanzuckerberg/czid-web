import { Link } from "@czi-sds/components";
import React from "react";
import { showToast } from "~/components/utils/toast";
import Notification from "~ui/notifications/Notification";
import cs from "../sample_view.scss";
import { NOTIFICATION_TYPES, TABS } from "./constants";

export const showNotification = (
  notification: string,
  params: {
    sampleName?: string;
    backgroundName?: string;
    handleTabChange?: (tab: string) => void;
    revertToSampleViewFilters?: () => void;
  } = {},
) => {
  switch (notification) {
    case NOTIFICATION_TYPES.invalidBackground: {
      showToast(
        ({ closeToast }: { closeToast(): void }) =>
          renderIncompatibleBackgroundError(closeToast, params),
        {
          autoClose: 12000,
        },
      );
      break;
    }
    case NOTIFICATION_TYPES.consensusGenomeCreated: {
      showToast(
        ({ closeToast }: { closeToast(): void }) =>
          renderConsensusGenomeCreated(closeToast, params),
        {
          autoClose: 12000,
        },
      );
      break;
    }
    case NOTIFICATION_TYPES.discoveryViewFiltersPersisted: {
      showToast(
        ({ closeToast }: { closeToast(): void }) =>
          renderPersistedDiscoveryViewThresholds(closeToast, params),
        {
          autoClose: 12000,
        },
      );
      break;
    }
    case NOTIFICATION_TYPES.sampleDeleteSuccess: {
      showToast(
        ({ closeToast }: { closeToast(): void }) =>
          renderSampleDeleteSuccess(closeToast, params),
        {
          autoClose: 12000,
        },
      );
      break;
    }
    case NOTIFICATION_TYPES.sampleDeleteError: {
      showToast(
        ({ closeToast }: { closeToast(): void }) =>
          renderSampleDeleteError(closeToast, params),
        {
          autoClose: 12000,
        },
      );
      break;
    }
  }
};
const renderSampleDeleteError = (
  closeToast: () => void,
  params: { sampleName?: string },
) => {
  return (
    <Notification
      className={cs.notificationBody}
      closeWithIcon
      closeWithDismiss={true}
      type="error"
      onClose={closeToast}
    >
      {params.sampleName ?? "Sample"} failed to delete. Please try again. If the
      problem persists, please contact us at{" "}
      <Link sdsStyle="dashed" href="mailto:help@czid.org">
        help@czid.org
      </Link>
      .
    </Notification>
  );
};
const renderSampleDeleteSuccess = (
  closeToast: () => void,
  params: { sampleName?: string },
) => {
  return (
    <Notification
      className={cs.notificationBody}
      closeWithIcon
      closeWithDismiss={true}
      type="info"
      onClose={closeToast}
    >
      {params.sampleName ?? "Sample"} has been successfully deleted.
    </Notification>
  );
};

const renderIncompatibleBackgroundError = (
  closeToast: () => void,
  { backgroundName }: { backgroundName?: string },
) => (
  <Notification
    type="info"
    displayStyle="elevated"
    onClose={closeToast}
    closeWithIcon
  >
    The previous background &quot;{backgroundName}&quot; is not compatible with
    this sample, please select another background.
  </Notification>
);

const renderConsensusGenomeCreated = (
  closeToast: () => void,
  { handleTabChange }: { handleTabChange?: (tab: string) => void },
) => {
  return (
    <Notification
      className={cs.notificationBody}
      closeWithDismiss={false}
      closeWithIcon={true}
      type="info"
    >
      We&apos;re creating your requested consensus genome, you&apos;ll be able
      to view it in the Consensus Genome tab.
      <div
        className={cs.consensusGenomeLink}
        onClick={() => {
          handleTabChange(TABS.CONSENSUS_GENOME);
          closeToast();
        }}
        onKeyDown={() => {
          handleTabChange(TABS.CONSENSUS_GENOME);
          closeToast();
        }}
      >
        View Consensus Genomes
      </div>
    </Notification>
  );
};

const renderPersistedDiscoveryViewThresholds = (
  closeToast: () => void,
  { revertToSampleViewFilters }: { revertToSampleViewFilters?: () => void },
) => (
  <Notification
    className={cs.notificationBody}
    closeWithIcon
    closeWithDismiss={false}
    onClose={closeToast}
    type="warning"
  >
    The taxon filters from the samples page have carried over. If you would like
    to use filters previously applied to the report, click the button below.
    <div
      className={cs.revertFiltersLink}
      onClick={() => {
        revertToSampleViewFilters();
        closeToast();
      }}
      onKeyDown={() => {
        revertToSampleViewFilters();
        closeToast();
      }}
    >
      Revert
    </div>
  </Notification>
);
