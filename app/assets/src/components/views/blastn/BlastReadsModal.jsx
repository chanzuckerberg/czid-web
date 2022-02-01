import PropTypes from "prop-types";
import React from "react";

import { ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import List from "~/components/ui/List";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";

import cs from "./blast_reads_modal.scss";

const BlastReadsModal = ({
  open,
  onClose,
  shortestReadAlignmentLength,
  longestReadAlignmentLength,
  taxonName,
}) => {
  const renderReadsIdentificationSection = () => (
    <div className={cs.readsIdentification}>
      <div className={cs.description}>
        Up to 5 of the longest reads have been identified.
      </div>
      <div className={cs.alignmentRange}>
        Range of alignment lengths: {shortestReadAlignmentLength}-
        {longestReadAlignmentLength}
      </div>
    </div>
  );

  const renderActions = () => (
    <div className={cs.actions}>
      <div className={cs.item}>
        <PrimaryButton
          text="Continue"
          rounded
          onClick={() =>
            console.error("Need to implement BlastRedirectionModal")
          }
        />
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
            href="https://help.czid.org"
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
    </Modal>
  );
};

BlastReadsModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  shortestReadAlignmentLength: PropTypes.number,
  longestReadAlignmentLength: PropTypes.number,
  taxonName: PropTypes.string,
};

export default BlastReadsModal;
