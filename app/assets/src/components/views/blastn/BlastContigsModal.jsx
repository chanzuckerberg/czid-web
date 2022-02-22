import { Tooltip } from "czifui";
import { compact, map, size } from "lodash/fp";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

import {
  withAnalytics,
  logAnalyticsEvent,
  ANALYTICS_EVENT_NAMES,
} from "~/api/analytics";
import { fetchLongestContigsForTaxonId } from "~/api/blast";
import List from "~/components/ui/List";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { BLASTN_HELP_LINK } from "~/components/utils/documentationLinks";
import { openUrlInNewTab } from "~/components/utils/links";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";
import BlastContigsTable from "./BlastContigsTable";
import { showBlastNotification } from "./BlastNotification";
import BlastRedirectionModal from "./BlastRedirectionModal";

import cs from "./blast_contigs_modal.scss";
import {
  BLAST_CONTIG_ROW_WIDTH,
  BLAST_CONTIG_HEADER_ROW_WIDTH,
  SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY,
} from "./constants";
import { prepareBlastQuery } from "./utils";

const BlastContigsModal = ({
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
  const [blastUrl, setBlastUrl] = useState("");

  useEffect(async () => {
    const { contigs } = await fetchLongestContigsForTaxonId({
      sampleId,
      pipelineVersion,
      taxonId,
    });

    setContigs(contigs);
  }, []);

  useEffect(() => {
    const contigSequences = compact(
      map(
        contig =>
          selectedContigIds.has(contig["contig_id"]) &&
          contig["fasta_sequence"],
        contigs,
      ),
    ).join("");

    const blastUrl = prepareBlastQuery({ sequences: contigSequences });

    setBlastUrl(blastUrl);
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
      openUrlInNewTab(blastUrl);
      logBlastEvent({
        analyticEventName:
          ANALYTICS_EVENT_NAMES.BLAST_CONTIGS_MODAL_CONTINUE_BUTTON_CLICKED,
        automaticallyRedirectedToNCBI: true,
      });
      showBlastNotification();
      onClose();
    } else {
      logAnalyticsEvent(
        ANALYTICS_EVENT_NAMES.BLAST_CONTIGS_MODAL_CONTINUE_BUTTON_CLICKED,
        {
          automaticallyRedirectedToNCBI: false,
          numberOfContigs: size(selectedContigIds),
        },
      );
      setShowBlastRedirectModal(true);
    }
  };

  const handleRedirectionModalClose = () => setShowBlastRedirectModal(false);

  const handleRedirectionModalContinue = shouldAutoRedirectBlastForCurrentSession => {
    shouldAutoRedirectBlastForCurrentSession &&
      autoRedirectBlastForCurrentSession();

    openUrlInNewTab(blastUrl);

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
    const totalSequenceLengthBlasted = size(
      compact(
        map(
          contig =>
            selectedContigIds.has(contig["contig_id"]) &&
            contig["fasta_sequence"],
          contigs,
        ),
      ).join(),
    );

    logAnalyticsEvent(analyticEventName, {
      automaticallyRedirectedToNCBI,
      sequenceLength: totalSequenceLengthBlasted,
      numberOfContigs: size(selectedContigIds),
      blastUrlLength: size(blastUrl),
    });
  };

  const autoRedirectBlastForCurrentSession = () => {
    sessionStorage.setItem(SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY, true);
  };

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

BlastContigsModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  pipelineVersion: PropTypes.number,
  sampleId: PropTypes.number,
  taxonId: PropTypes.number,
  taxonName: PropTypes.string,
};

export default BlastContigsModal;
