import React from "react";
import { showToast } from "~/components/utils/toast";
import Notification from "~ui/notifications/Notification";
import { NOTIFICATION_TYPES, TABS } from "./constants";
import cs from "./sample_view.scss";

export const showNotification = (notification: $TSFixMe, params = {}) => {
  switch (notification) {
    case NOTIFICATION_TYPES.invalidBackground: {
      showToast(
        ({ closeToast }: $TSFixMe) =>
          renderIncompatibleBackgroundError(closeToast, params),
        {
          autoClose: 12000,
        },
      );
      break;
    }
    case NOTIFICATION_TYPES.consensusGenomeCreated: {
      showToast(
        ({ closeToast }: $TSFixMe) =>
          renderConsensusGenomeCreated(closeToast, params),
        {
          autoClose: 12000,
        },
      );
      break;
    }
    case NOTIFICATION_TYPES.discoveryViewFiltersPersisted: {
      showToast(
        ({ closeToast }: $TSFixMe) =>
          renderPersistedDiscoveryViewThresholds(closeToast, params),
        {
          autoClose: 12000,
        },
      );
      break;
    }
  }
};

const renderIncompatibleBackgroundError = (
  closeToast: $TSFixMe,
  { backgroundName }: $TSFixMe,
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
  closeToast: $TSFixMe,
  { handleTabChange }: $TSFixMe,
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
  closeToast: $TSFixMe,
  { revertToSampleViewFilters }: $TSFixMe,
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
