import { size } from "lodash/fp";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { fetchLongestReadsForTaxonId } from "~/api/blast";
import List from "~/components/ui/List";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { BLASTN_HELP_LINK } from "~/components/utils/documentationLinks";
import { openUrlInNewTab } from "~/components/utils/links";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";
import { showBlastNotification } from "./BlastNotification";
import BlastRedirectionModal from "./BlastRedirectionModal";

import cs from "./blast_reads_modal.scss";
import { SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY } from "./constants";
import { prepareBlastQuery } from "./utils";

const BlastReadsModal = ({
  context,
  onClose,
  open,
  sampleId,
  pipelineVersion,
  taxonName,
  taxonLevel,
  taxonId,
}) => {
  const [shortestAlignmentLength, setShortestAlignmentLength] = useState();
  const [longestAlignmentLength, setLongestAlignmentLength] = useState();
  const [reads, setReads] = useState([]);
  const [showBlastRedirectionModal, setShowBlastRedirectModal] = useState(
    false,
  );
  const [blastUrl, setBlastUrl] = useState("");

  useEffect(async () => {
    const {
      reads,
      shortestAlignmentLength,
      longestAlignmentLength,
    } = await fetchLongestReadsForTaxonId({
      sampleId,
      pipelineVersion,
      taxonId,
      taxonLevel,
    });
    const blastUrl = prepareBlastQuery({ sequences: reads.join("") });

    setShortestAlignmentLength(shortestAlignmentLength);
    setLongestAlignmentLength(longestAlignmentLength);
    setReads(reads);
    setBlastUrl(blastUrl);
  }, []);

  const handleContinue = () => {
    const shouldAutoRedirectBlast =
      JSON.parse(
        sessionStorage.getItem(SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY),
      ) || false;

    if (shouldAutoRedirectBlast) {
      // Do not show the BlastRedirectionModal if the user selected the
      // "Automatically redirect in the future." option. Instead, automatically
      // redirect them to the BLAST page.
      openUrlInNewTab(blastUrl);
      logBlastEvent({
        analyticsEventName:
          ANALYTICS_EVENT_NAMES.BLAST_READS_MODAL_CONTINUE_BUTTON_CLICKED,
        automaticallyRedirectedToNCBI: true,
      });
      showBlastNotification();
      onClose();
    } else {
      logBlastEvent({
        analyticsEventName:
          ANALYTICS_EVENT_NAMES.BLAST_READS_MODAL_CONTINUE_BUTTON_CLICKED,
        automaticallyRedirectedToNCBI: false,
      });
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
      ...context,
    });
  };

  const autoRedirectBlastForCurrentSession = () => {
    sessionStorage.setItem(SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY, true);
  };

  const handleRedirectionModalClose = () => setShowBlastRedirectModal(false);

  const handleRedirectionModalContinue = shouldAutoRedirectBlastForCurrentSession => {
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
        Up to 5 of the longest reads have been identified.
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

  return (
    <Modal open={open} onClose={onClose} tall narrow xlCloseIcon>
      <div className={cs.blastReadsModal}>
        <div className={cs.header}>
          <div className={cs.blastType}>BLASTN Reads</div>
          <div className={cs.dash}>—</div>
          <div className={cs.contigUnavailability}>No contig available</div>
        </div>
        <div className={cs.taxonName}>{taxonName}</div>
        <div className={cs.blastnDescription}>
          BLASTN compares nucleotide query sequence(s) to the nucleotide (NT)
          databases in NCBI.{" "}
          <ExternalLink
            href={BLASTN_HELP_LINK}
            analyticsEventName={
              ANALYTICS_EVENT_NAMES.BLAST_READS_MODAL_LEARN_MORE_CLICKED
            }
          >
            Learn more
          </ExternalLink>
        </div>
        <div className={cs.useCases}>
          <div className={cs.title}>BLASTN reads helps you:</div>
          <List
            listClassName={cs.list}
            listItems={[`Confirm hits.`, `Determine region of coverage.`]}
          />
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

BlastReadsModal.propTypes = {
  context: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  pipelineVersion: PropTypes.string,
  sampleId: PropTypes.number,
  taxonId: PropTypes.number,
  taxonLevel: PropTypes.number,
  taxonName: PropTypes.string,
};

export default BlastReadsModal;
