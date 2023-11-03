import { Link } from "@czi-sds/components";
import React from "react";
import { CONTACT_US_LINK } from "~/components/utils/documentationLinks";
import { showToast } from "~/components/utils/toast";
import { WORKFLOW_TABS } from "~/components/utils/workflows";
import Notification from "~ui/notifications/Notification";
import cs from "../sample_view.scss";
import { NOTIFICATION_TYPES } from "./constants";

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
      <Link sdsStyle="dashed" href={CONTACT_US_LINK} target="_blank">
        our Help Center
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
          handleTabChange(WORKFLOW_TABS.CONSENSUS_GENOME);
          closeToast();
        }}
        onKeyDown={() => {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
          handleTabChange(WORKFLOW_TABS.CONSENSUS_GENOME);
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
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
        revertToSampleViewFilters();
        closeToast();
      }}
      onKeyDown={() => {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
        revertToSampleViewFilters();
        closeToast();
      }}
    >
      Revert
    </div>
  </Notification>
);
