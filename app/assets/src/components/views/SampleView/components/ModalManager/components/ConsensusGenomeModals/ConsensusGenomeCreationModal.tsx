import { Icon } from "@czi-sds/components";
import { isNull } from "lodash/fp";
import React, { useState } from "react";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { VIRAL_CONSENSUS_GENOME_DOC_LINK } from "~/components/utils/documentationLinks";
import Sample from "~/interface/sample";
import { ConsensusGenomeParams } from "~/interface/sampleView";
import { ConsensusGenomeData } from "~/interface/shared";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import Modal from "~ui/containers/Modal";
import { SubtextDropdown } from "~ui/controls/dropdowns";
import cs from "./consensus_genome_creation_modal.scss";

interface ConsensusGenomeCreationModalProps {
  consensusGenomeData?: ConsensusGenomeData;
  open?: boolean;
  onClose: () => void;
  onCreation: ({
    accessionId,
    accessionName,
    taxonId,
    taxonName,
  }: ConsensusGenomeParams) => Promise<void>;
  sample: Sample;
}

export const ConsensusGenomeCreationModal = ({
  consensusGenomeData,
  onClose,
  onCreation,
  open,
  sample,
}: ConsensusGenomeCreationModalProps) => {
  const [selectedAccessionIndex, setSelectedAccessionIndex] = useState(null);

  const getReferenceAccessions = () => {
    const { accessionData, percentIdentity, usedAccessions } =
      consensusGenomeData;

    // If accessionData doesn't exist, just pass an empty list.
    if (!accessionData) {
      return [];
    }

    return accessionData.best_accessions.map((data, index) => {
      const disabled = usedAccessions.includes(data.id);
      const subtext = `${percentIdentity} %id, ${getSequenceCompleteness(
        data.name,
      )}, ${data.coverage_depth}x coverage`;

      return {
        disabled,
        subtext,
        text: data.name,
        value: index,
        ...(disabled && {
          tooltip:
            "A consensus genome has already been generated for this accession",
        }),
      };
    });
  };

  const getSequenceCompleteness = (accessionName: string) => {
    if (accessionName.includes("partial")) {
      return "Partial Sequence";
    } else if (accessionName.includes("complete")) {
      return "Complete Sequence";
    }
  };

  const handleAccessionChange = (accessionIndex: number) => {
    const accessionData = consensusGenomeData.accessionData;
    if (accessionIndex === selectedAccessionIndex) {
      return;
    }

    setSelectedAccessionIndex(accessionIndex);

    trackEvent(
      ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_CREATION_MODAL_SELECTED_ACCESSION_CHANGED,
      {
        previousAccession:
          accessionData.best_accessions[selectedAccessionIndex],
        selectedAccession: accessionData.best_accessions[accessionIndex],
        sampleId: sample.id,
      },
    );
  };

  const handleConsensusGenomeCreate = () => {
    const { accessionData, taxId, taxName } = consensusGenomeData;
    const selectedAccession =
      accessionData.best_accessions[selectedAccessionIndex];

    onCreation({
      accessionId: selectedAccession.id,
      accessionName: selectedAccession.name,
      taxonId: taxId,
      taxonName: taxName,
    });

    trackEvent(
      ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_CREATION_MODAL_CREATE_BUTTON_CLICKED,
      {
        accessionId: selectedAccession.id,
        accessionName: selectedAccession.name,
        taxonId: taxId,
        taxonName: taxName,
        sampleId: sample.id,
      },
    );
  };

  return (
    <Modal
      className={cs.modal}
      narrow
      open={open}
      minimumHeight
      onClose={withAnalytics(
        onClose,
        ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_CREATION_MODAL_CLOSED,
      )}
      data-testid="create-consensus-genome-modal"
    >
      <div className={cs.title}>Generate Consensus Genome</div>
      <div className={cs.description}>
        Align non-host reads to the reference accession of choice to generate a
        consensus genome for this taxon. This pipeline should not be used on
        samples using enrichment protocols such as MSSPE.{" "}
        <ExternalLink
          href={VIRAL_CONSENSUS_GENOME_DOC_LINK}
          analyticsEventName={
            ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_CREATION_MODAL_HELP_LINK_CLICKED
          }
        >
          Learn more.
        </ExternalLink>
      </div>
      <div className={cs.label}>
        Taxon:{" "}
        <span className={cs.taxonName}>{consensusGenomeData.taxName}</span>
      </div>
      <div className={cs.label}>
        Reference Accession
        <ColumnHeaderTooltip
          trigger={
            <span>
              <Icon
                sdsIcon="infoCircle"
                sdsSize="s"
                sdsType="interactive"
                className={cs.infoIcon}
              />
            </span>
          }
          content={
            "Choose the reference accession you would like to map the non-host reads against to create a consensus genome."
          }
          link={VIRAL_CONSENSUS_GENOME_DOC_LINK}
          position={"top center"}
        />
      </div>
      <SubtextDropdown
        className={cs.dropdown}
        fluid
        options={getReferenceAccessions()}
        onChange={handleAccessionChange}
        placeholder="Select a reference accession"
      />
      <PrimaryButton
        className={cs.button}
        text="Create Consensus Genome"
        onClick={handleConsensusGenomeCreate}
        disabled={isNull(selectedAccessionIndex)}
      />
    </Modal>
  );
};
