// BlastContigsModal.jsx is only used for Blast V0
import { Tooltip } from "czifui";
import { filter, map, reduce, size } from "lodash/fp";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

import {
  withAnalytics,
  trackEvent,
  ANALYTICS_EVENT_NAMES,
} from "~/api/analytics";
import { fetchLongestContigsForTaxonId } from "~/api/blast";
import List from "~/components/ui/List";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { BLASTN_HELP_LINK } from "~/components/utils/documentationLinks";
import { openUrlInNewTab } from "~/components/utils/links";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";
import Notification from "~ui/notifications/Notification";
import BlastContigsTable from "./BlastContigsTable";
import { showBlastNotification } from "./BlastNotification";
import BlastRedirectionModal from "./BlastRedirectionModal";

import cs from "./blast_contigs_modal.scss";
import {
  BLAST_CONTIG_ROW_WIDTH,
  BLAST_CONTIG_HEADER_ROW_WIDTH,
  BLAST_SEQUENCE_CHARACTER_LIMIT,
  SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY,
} from "./constants";
import { prepareBlastQuery } from "./utils";

const BlastContigsModal = ({
  context,
  onClose,
  open,
  sampleId,
  pipelineVersion,
  taxonName,
  taxonId,
}) => {
  const [contigs, setContigs] = useState([]);
  const [selectedContigIds, setSelectedContigIds] = useState(new Set());
  const [showBlastRedirectionModal, setShowBlastRedirectModal] = useState(
    false,
  );
  const [blastUrls, setBlastUrls] = useState([]);
  const [sequencesAreTooLong, setSequencesAreTooLong] = useState(false);

  useEffect(() => {
    // Run async logic in separate function since `useEffect(async () => ...)` is not supported
    async function run() {
      const { contigs } = await fetchLongestContigsForTaxonId({
        sampleId,
        pipelineVersion,
        taxonId,
      });

      setContigs(contigs);
    }

    run();
  }, []);

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
      blastUrls = map(
        contig => prepareBlastQuery({ sequences: contig["fasta_sequence"] }),
        contigSequences,
      );
    } else {
      blastUrls = [
        prepareBlastQuery({
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
        numberOfContigs: size(selectedContigIds),
        sampleId,
      });
      setShowBlastRedirectModal(true);
    }
  };

  const handleRedirectionModalClose = () => setShowBlastRedirectModal(false);

  const handleRedirectionModalContinue = shouldAutoRedirectBlastForCurrentSession => {
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
      lengthsOfSequencesBlasted,
      numberOfContigs: size(selectedContigIds),
      blastUrlLengths: map(url => size(url), blastUrls),
      sampleId,
      ...context,
    });
  };

  const autoRedirectBlastForCurrentSession = () => {
    sessionStorage.setItem(SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY, true);
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

  return (
    <Modal
      open={open}
      onClose={withAnalytics(
        onClose,
        ANALYTICS_EVENT_NAMES.BLAST_CONTIGS_MODAL_CLOSE_BUTTON_CLICKED,
      )}
      tall
      narrow
      xlCloseIcon
    >
      <div className={cs.blastContigsModal}>
        <div className={cs.header}>BLASTN Contig</div>
        <div className={cs.taxonName}>{taxonName}</div>
        <div className={cs.blastnDescription}>
          BLASTN compares nucleotide query sequence(s) to the nucleotide (NT)
          databases in NCBI.{" "}
          <ExternalLink
            href={BLASTN_HELP_LINK}
            analyticsEventName={
              ANALYTICS_EVENT_NAMES.BLAST_CONTIGS_MODAL_LEARN_MORE_CLICKED
            }
          >
            Learn more
          </ExternalLink>
        </div>
        <div className={cs.useCases}>
          <div className={cs.title}>BLASTN contigs helps you:</div>
          <List
            itemClassName={cs.listItems}
            listClassName={cs.list}
            listItems={[
              `Confirm hits.`,
              `Determine region of coverage.`,
              `Collect metrics for publication.`,
            ]}
          />
        </div>
        <div className={cs.contigSelection}>
          <div className={cs.title}>Make a selection</div>
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

BlastContigsModal.propTypes = {
  context: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  pipelineVersion: PropTypes.string,
  sampleId: PropTypes.number,
  taxonId: PropTypes.number,
  taxonName: PropTypes.string,
};

export default BlastContigsModal;
