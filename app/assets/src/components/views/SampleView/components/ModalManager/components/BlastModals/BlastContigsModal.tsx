import { Tab, Tabs, Tooltip } from "@czi-sds/components";
import cx from "classnames";
import { filter, map, reduce, size } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import { fetchLongestContigsForTaxonId } from "~/api/blast";
import { openUrlInNewTab } from "~/components/utils/links";
import { SampleId } from "~/interface/shared";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";
import Notification from "~ui/notifications/Notification";
import BlastContigsTable from "./BlastContigsTable";
import { showBlastNotification } from "./BlastNotification";
import BlastRedirectionModal from "./BlastRedirectionModal";
import cs from "./blast_contigs_modal.scss";
import {
  BlastModalInfo,
  BLAST_CONTIG_HEADER_ROW_WIDTH,
  BLAST_CONTIG_ROW_WIDTH,
  BLAST_SEQUENCE_CHARACTER_LIMIT,
  Contig,
  CountTypes,
  CountTypeToIndex,
  IndexToCountType,
  SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY,
} from "./constants";
import { prepareBlastQuery } from "./utils";

interface BlastContigsModalProps {
  blastModalInfo: BlastModalInfo;
  context: object;
  onClose: () => void;
  open: boolean;
  sampleId: SampleId;
  pipelineVersion: string;
  taxonName: string;
  taxonId: number;
}

export const BlastContigsModal = ({
  blastModalInfo,
  context,
  onClose,
  open,
  sampleId,
  pipelineVersion,
  taxonName,
  taxonId,
}: BlastContigsModalProps) => {
  const trackEvent = useTrackEvent();
  const [contigs, setContigs] = useState<Contig[]>([]);
  const [selectedContigIds, setSelectedContigIds] = useState<Set<number>>(
    new Set(),
  );

  // BlastN will not have any count type tabs available since the option is only for NT contigs/reads.
  const [selectedCountTypeTab, setSelectedCountTypeTab] = useState<
    number | null
  >(
    blastModalInfo?.showCountTypeTabs
      ? // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        CountTypeToIndex[blastModalInfo?.availableCountTypeTabsForContigs[0]]
      : null,
  );
  const [showBlastRedirectionModal, setShowBlastRedirectModal] =
    useState<boolean>(false);
  const [blastUrls, setBlastUrls] = useState<string[]>([]);
  const [sequencesAreTooLong, setSequencesAreTooLong] =
    useState<boolean>(false);
  const currentCountType =
    selectedCountTypeTab !== null
      ? IndexToCountType[selectedCountTypeTab]
      : CountTypes.NT;

  const fetchContigs = async () => {
    const { contigs } = await fetchLongestContigsForTaxonId({
      countType: currentCountType,
      sampleId,
      pipelineVersion,
      taxonId,
    });

    setContigs(contigs);
  };

  // We shouldn't fetch reads from NT or NR every time the user switches tabs.
  // Ideally we'd fetch them once and just render them based on the tab that they're on.
  // However this component is still pretty snappy, but we should probably refactor this later
  useEffect(() => {
    fetchContigs();
  }, [selectedCountTypeTab]);

  useEffect(() => {
    const contigSequences = filter(
      contig => selectedContigIds.has(contig["contig_id"]),
      contigs,
    );

    const sumOfSequenceLengths = reduce(
      (sum, contig) => sum + contig["contig_length"],
      0,
      contigSequences,
    );

    const sequencesAreTooLong =
      sumOfSequenceLengths > BLAST_SEQUENCE_CHARACTER_LIMIT;
    setSequencesAreTooLong(sequencesAreTooLong);

    // Prepare the BLAST URL(s) for the selected contig sequences
    let blastUrls = [];
    if (sequencesAreTooLong) {
      // SamplesController#taxid_contigs_for_blast will get the middle 7500 base pairs of a sequence if it is longer than 7500 (the NBCI BLAST character limit)
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      blastUrls = map(
        contig =>
          prepareBlastQuery({
            program: blastModalInfo?.selectedBlastType,
            sequences: contig["fasta_sequence"],
          }),
        contigSequences,
      );
    } else {
      blastUrls = [
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        prepareBlastQuery({
          program: blastModalInfo?.selectedBlastType,
          sequences: map(
            contig => contig["fasta_sequence"],
            contigSequences,
          ).join(""),
        }),
      ];
    }

    setBlastUrls(blastUrls);
  }, [selectedContigIds]);

  const handleAllContigsSelected = isChecked =>
    setSelectedContigIds(
      isChecked ? new Set(map("contig_id", contigs)) : new Set(),
    );

  const handleContigSelection = (value, isChecked) => {
    const selectedContigs = selectedContigIds;

    isChecked ? selectedContigs.add(value) : selectedContigs.delete(value);

    setSelectedContigIds(new Set(selectedContigs));
  };

  const renderContigsTable = () => {
    // Style must be explicitly passed in via inline styling here due to the Table component using Autosizer
    // Since Autosizer is baked in to the Table implementation, it requires a fixed parent height for virtualization to work
    // otherwise, the height of the table will be displayed as 0.
    // The total height of the parent div of the table is calculated by the following equation:
    //   (height of an individual row in px * number of contigs to display) + height of the header row
    // If the styling of the either the header row or contig rows are being updated, we must update the values in BlastContigsTable.jsx
    return (
      <div
        className={cs.table}
        style={{
          height:
            BLAST_CONTIG_ROW_WIDTH * size(contigs) +
            BLAST_CONTIG_HEADER_ROW_WIDTH,
        }}
      >
        <BlastContigsTable
          contigs={contigs}
          onContigSelection={(value, isChecked) =>
            handleContigSelection(value, isChecked)
          }
          onAllContigsSelected={isChecked =>
            handleAllContigsSelected(isChecked)
          }
          selectedContigs={selectedContigIds}
        />
      </div>
    );
  };

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
      blastUrls.forEach(url => openUrlInNewTab(url));
      logBlastEvent({
        analyticEventName:
          ANALYTICS_EVENT_NAMES.BLAST_CONTIGS_MODAL_CONTINUE_BUTTON_CLICKED,
        automaticallyRedirectedToNCBI: true,
      });
      showBlastNotification();
      onClose();
    } else {
      logBlastEvent({
        analyticEventName:
          ANALYTICS_EVENT_NAMES.BLAST_CONTIGS_MODAL_CONTINUE_BUTTON_CLICKED,
        automaticallyRedirectedToNCBI: false,
      });
      setShowBlastRedirectModal(true);
    }
  };

  const handleRedirectionModalClose = () => setShowBlastRedirectModal(false);

  const handleRedirectionModalContinue =
    shouldAutoRedirectBlastForCurrentSession => {
      shouldAutoRedirectBlastForCurrentSession &&
        autoRedirectBlastForCurrentSession();

      blastUrls.forEach(url => openUrlInNewTab(url));

      logBlastEvent({
        analyticEventName:
          ANALYTICS_EVENT_NAMES.BLAST_REDIRECTION_MODAL_CONTINUE_BUTTON_CLICKED,
        automaticallyRedirectedToNCBI: shouldAutoRedirectBlastForCurrentSession,
      });
      setShowBlastRedirectModal(false);
      showBlastNotification();
      onClose();
    };

  const logBlastEvent = ({
    analyticEventName,
    automaticallyRedirectedToNCBI,
  }) => {
    const contigsBlasted = filter(
      contig => selectedContigIds.has(contig["contig_id"]),
      contigs,
    );
    const lengthsOfSequencesBlasted = map(
      contig => size(contig["fasta_sequence"]),
      contigsBlasted,
    );

    trackEvent(analyticEventName, {
      automaticallyRedirectedToNCBI,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
      lengthsOfSequencesBlasted,
      numberOfContigs: size(selectedContigIds),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
      blastUrlLengths: map(url => size(url), blastUrls),
      sampleId,
      countType: currentCountType,
      blastType: blastModalInfo?.selectedBlastType,
      ...context,
    });
  };

  const autoRedirectBlastForCurrentSession = () => {
    sessionStorage.setItem(
      SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY,
      true.toString(),
    );
  };

  const renderLongContigNotification = () => (
    <Notification
      type="info"
      displayStyle="flat"
      className={cs.longContigNotification}
    >
      For selected contig(s) that exceeds ~7500 base pairs (bp), up to the
      middle 7500 bp will be used due to NCBI{`'`}s server limitation.
    </Notification>
  );

  const renderActions = () => (
    <div className={cs.actions}>
      <div className={cs.item}>
        {size(selectedContigIds) === 0 ? (
          <Tooltip
            arrow
            placement="top"
            title="Select at least 1 contig to continue"
          >
            <span>
              <PrimaryButton text="Continue" rounded disabled />
            </span>
          </Tooltip>
        ) : (
          <PrimaryButton
            text="Continue"
            rounded
            onClick={() => handleContinue()}
          />
        )}
      </div>
      <div className={cs.item}>
        <SecondaryButton text="Cancel" rounded onClick={onClose} />
      </div>
    </div>
  );

  const renderCountTypeTabs = () => {
    const shouldDisableNtTab =
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      !blastModalInfo?.availableCountTypeTabsForContigs.includes(CountTypes.NT);
    const shouldDisableNrTab =
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      !blastModalInfo?.availableCountTypeTabsForContigs.includes(CountTypes.NR);
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
        onChange={(_, selectedTabIndex) => {
          setSelectedCountTypeTab(selectedTabIndex);
          // Reset user contig selections when they switch NT/NR tabs
          setSelectedContigIds(new Set());
        }}
      >
        {ntTab}
        {nrTab}
      </Tabs>
    );
  };

  return (
    <Modal open={open} onClose={onClose} tall narrow xlCloseIcon>
      <div className={cs.blastContigsModal}>
        <div className={cs.header}>{blastModalInfo?.selectedBlastType}</div>
        <div className={cs.taxonName}>{taxonName}</div>
        {blastModalInfo?.showCountTypeTabs && renderCountTypeTabs()}
        <div
          className={cx(
            cs.contigSelection,
            !blastModalInfo?.showCountTypeTabs && cs.spacing,
          )}
        >
          <div className={cs.title}>Select a contig</div>
          <div className={cs.instructions}>
            Up to 3 of the longest contigs are available to BLAST. The more
            contigs you choose, the longer the results will take to load.
          </div>
        </div>
        {renderContigsTable()}
        {sequencesAreTooLong && renderLongContigNotification()}
        {renderActions()}
      </div>
      {showBlastRedirectionModal && (
        <BlastRedirectionModal
          open
          onClose={handleRedirectionModalClose}
          onContinue={handleRedirectionModalContinue}
          shouldOpenMultipleTabs={
            sequencesAreTooLong && size(selectedContigIds) > 1
          }
        />
      )}
    </Modal>
  );
};
