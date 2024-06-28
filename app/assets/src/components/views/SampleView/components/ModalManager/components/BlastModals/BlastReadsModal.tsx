import { Tab, Tabs, Tooltip } from "@czi-sds/components";
import cx from "classnames";
import { size } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import { fetchLongestReadsForTaxonId } from "~/api/blast";
import { openUrlInNewTab } from "~/components/utils/links";
import { SampleId } from "~/interface/shared";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";
import { showBlastNotification } from "./BlastNotification";
import BlastRedirectionModal from "./BlastRedirectionModal";
import cs from "./blast_reads_modal.scss";
import {
  BlastModalInfo,
  CountTypes,
  CountTypeToIndex,
  IndexToCountType,
  SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY,
} from "./constants";
import { prepareBlastQuery } from "./utils";

interface BlastReadsModalProps {
  blastModalInfo: BlastModalInfo;
  context: object;
  onClose: () => void;
  open: boolean;
  sampleId: SampleId;
  pipelineVersion: string;
  taxonName: string;
  taxonLevel: number;
  taxonId: number;
}

export const BlastReadsModal = ({
  blastModalInfo,
  context,
  onClose,
  open,
  sampleId,
  pipelineVersion,
  taxonName,
  taxonLevel,
  taxonId,
}: BlastReadsModalProps) => {
  const trackEvent = useTrackEvent();
  const [shortestAlignmentLength, setShortestAlignmentLength] = useState();
  const [longestAlignmentLength, setLongestAlignmentLength] = useState();
  const [reads, setReads] = useState([]);
  const [showBlastRedirectionModal, setShowBlastRedirectModal] =
    useState(false);
  const [blastUrl, setBlastUrl] = useState("");
  // BlastN will not have any count type tabs available since the option is only for NT contigs/reads.
  const [selectedCountTypeTab, setSelectedCountTypeTab] = useState<
    number | null
  >(
    blastModalInfo?.showCountTypeTabs
      ? // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        CountTypeToIndex[blastModalInfo?.availableCountTypeTabsForReads[0]]
      : null,
  );
  const currentCountType =
    selectedCountTypeTab !== null
      ? IndexToCountType[selectedCountTypeTab]
      : CountTypes.NT;

  const fetchReads = async () => {
    const { reads, shortestAlignmentLength, longestAlignmentLength } =
      await fetchLongestReadsForTaxonId({
        countType: currentCountType,
        sampleId,
        pipelineVersion,
        taxonId,
        taxonLevel,
      });
    const blastUrl = prepareBlastQuery({
      program: blastModalInfo?.selectedBlastType,
      sequences: reads.join(""),
    });

    setShortestAlignmentLength(shortestAlignmentLength);
    setLongestAlignmentLength(longestAlignmentLength);
    setReads(reads);
    setBlastUrl(blastUrl);
  };

  useEffect(() => {
    fetchReads();
  }, []);

  // We shouldn't fetch reads from NT or NR every time the user switches tabs.
  // Ideally we'd fetch them once and just render them based on the tab that they're on.
  // However this component is still pretty snappy, but we should probably refactor this later
  useEffect(() => {
    fetchReads();
  }, [selectedCountTypeTab]);

  const handleContinue = () => {
    const shouldAutoRedirectBlast =
      JSON.parse(
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        sessionStorage.getItem(SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY),
      ) || false;

    if (shouldAutoRedirectBlast) {
      // Do not show the BlastRedirectionModal if the user selected the
      // "Automatically redirect in the future." option. Instead, automatically
      // redirect them to the BLAST page.
      openUrlInNewTab(blastUrl);
      showBlastNotification();
      onClose();
    } else {
      setShowBlastRedirectModal(true);
    }
  };

  const logBlastEvent = ({
    analyticsEventName,
    automaticallyRedirectedToNCBI,
  }) => {
    trackEvent(analyticsEventName, {
      automaticallyRedirectedToNCBI,
      numberOfReads: size(reads),
      shortestAlignmentLength,
      longestAlignmentLength,
      blastUrlSize: size(blastUrl),
      sampleId,
      countType: currentCountType,
      blastType: blastModalInfo?.selectedBlastType,
      ...context,
    });
  };

  const autoRedirectBlastForCurrentSession = () => {
    sessionStorage.setItem(SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY, "true");
  };

  const handleRedirectionModalClose = () => setShowBlastRedirectModal(false);

  const handleRedirectionModalContinue =
    shouldAutoRedirectBlastForCurrentSession => {
      shouldAutoRedirectBlastForCurrentSession &&
        autoRedirectBlastForCurrentSession();

      openUrlInNewTab(blastUrl);

      logBlastEvent({
        analyticsEventName:
          ANALYTICS_EVENT_NAMES.BLAST_REDIRECTION_MODAL_CONTINUE_BUTTON_CLICKED,
        automaticallyRedirectedToNCBI: shouldAutoRedirectBlastForCurrentSession,
      });
      showBlastNotification();
      onClose();
    };

  const renderReadsIdentificationSection = () => (
    <div className={cs.readsIdentification}>
      <div className={cs.description}>
        {`Up to 5 ${currentCountType} reads have been selected.`}
      </div>
      <div className={cs.alignmentRange}>
        Range of alignment lengths: {shortestAlignmentLength}-
        {longestAlignmentLength}
      </div>
    </div>
  );

  const renderActions = () => (
    <div className={cs.actions}>
      <div className={cs.item}>
        <PrimaryButton text="Continue" rounded onClick={handleContinue} />
      </div>
      <div className={cs.item}>
        <SecondaryButton text="Cancel" rounded onClick={onClose} />
      </div>
    </div>
  );

  const renderCountTypeTabs = () => {
    const shouldDisableNtTab =
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      !blastModalInfo?.availableCountTypeTabsForReads.includes(CountTypes.NT);
    const shouldDisableNrTab =
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      !blastModalInfo?.availableCountTypeTabsForReads.includes(CountTypes.NR);
    let ntTab = (
      <Tab disabled={shouldDisableNtTab} label={`${CountTypes.NT} hits`}></Tab>
    );
    let nrTab = (
      <Tab disabled={shouldDisableNrTab} label={`${CountTypes.NR} hits`}></Tab>
    );

    if (shouldDisableNtTab) {
      ntTab = (
        <Tooltip arrow placement="top" title="No NT hits available">
          <span>{ntTab}</span>
        </Tooltip>
      );
    }

    if (shouldDisableNrTab) {
      nrTab = (
        <Tooltip arrow placement="top" title="No NR hits available">
          <span>{nrTab}</span>
        </Tooltip>
      );
    }

    return (
      // @ts-expect-error SDS is working on a fix for this in v19.0.1
      <Tabs
        sdsSize="small"
        underlined
        value={selectedCountTypeTab}
        onChange={(_, selectedTabIndex) =>
          setSelectedCountTypeTab(selectedTabIndex)
        }
      >
        {ntTab}
        {nrTab}
      </Tabs>
    );
  };

  return (
    <Modal open={open} onClose={onClose} tall narrow xlCloseIcon>
      <div className={cs.blastReadsModal}>
        <div className={cs.blastType}>{blastModalInfo?.selectedBlastType}</div>
        <div className={cs.taxonName}>{taxonName}</div>
        {blastModalInfo?.showCountTypeTabs && renderCountTypeTabs()}
        <div
          className={cx(
            cs.title,
            !blastModalInfo?.showCountTypeTabs && cs.spacing,
          )}
        >
          Confirm reads
        </div>
        {renderReadsIdentificationSection()}
        {renderActions()}
      </div>
      {showBlastRedirectionModal && (
        <BlastRedirectionModal
          open
          onClose={handleRedirectionModalClose}
          onContinue={handleRedirectionModalContinue}
        />
      )}
    </Modal>
  );
};
