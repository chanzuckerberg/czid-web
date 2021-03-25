import React from "react";
import PropTypes from "prop-types";

import { isNull } from "lodash/fp";
import {
  logAnalyticsEvent,
  withAnalytics,
  ANALYTICS_EVENT_NAMES,
} from "~/api/analytics";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { IconInfoSmall } from "~/components/ui/icons";
import Modal from "~ui/containers/Modal";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { SubtextDropdown } from "~ui/controls/dropdowns";

import cs from "./consensus_genome_creation_modal.scss";

export default class ConsensusGenomeCreationModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedAccessionIndex: null,
    };
  }

  getReferenceGenomes = () => {
    const { consensusGenomeData } = this.props;
    const {
      accessionData,
      percentIdentity,
      usedAccessions,
    } = consensusGenomeData;

    // If accessionData doesn't exist, just pass an empty list.
    if (!accessionData) {
      return [];
    }

    return accessionData.best_accessions.map((data, index) => {
      const disabled = usedAccessions.includes(data.id);
      const subtext = `${percentIdentity} %id, ${this.getSequenceCompleteness(
        data.name
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

  getSequenceCompleteness = accessionName => {
    if (accessionName.includes("partial")) {
      return "Partial Sequence";
    } else if (accessionName.includes("complete")) {
      return "Complete Sequence";
    }
  };

  handleAccessionChange = accessionIndex => {
    const { selectedAccessionIndex } = this.state;
    const { consensusGenomeData, sample } = this.props;
    const accessionData = consensusGenomeData.accessionData;
    if (accessionIndex === selectedAccessionIndex) {
      return;
    }

    this.setState({
      selectedAccessionIndex: accessionIndex,
    });

    logAnalyticsEvent(
      ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_CREATION_MODAL_SELECTED_ACCESSION_CHANGED,
      {
        previousAccession:
          accessionData.best_accessions[selectedAccessionIndex],
        selectedAccession: accessionData.best_accessions[accessionIndex],
        sampleId: sample.id,
      }
    );
  };

  handleConsensusGenomeCreate = () => {
    const { selectedAccessionIndex } = this.state;
    const { onCreation, consensusGenomeData, sample } = this.props;
    const { accessionData, taxId, taxName } = consensusGenomeData;
    const selectedAccession =
      accessionData.best_accessions[selectedAccessionIndex];

    onCreation({
      accessionId: selectedAccession.id,
      accessionName: selectedAccession.name,
      taxonId: taxId,
      taxonName: taxName,
    });

    logAnalyticsEvent(
      ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_CREATION_MODAL_CREATE_BUTTON_CLICKED,
      {
        accessionId: selectedAccession.id,
        accessionName: selectedAccession.name,
        taxonId: taxId,
        taxonName: taxName,
        sampleId: sample.id,
      }
    );
  };

  render() {
    const { consensusGenomeData, onClose, open } = this.props;
    const { selectedAccessionIndex } = this.state;
    return (
      <Modal
        className={cs.modal}
        narrow
        open={open}
        minimumHeight
        onClose={withAnalytics(
          onClose,
          ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_CREATION_MODAL_CLOSED
        )}
      >
        <div className={cs.title}>Generate Consensus Genome</div>
        <div className={cs.description}>
          Align non-host reads to the reference genome of choice to generate a
          consensus genome for this taxon.{" "}
          <ExternalLink
            href={"https://help.idseq.net"}
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
          Reference Genome
          <ColumnHeaderTooltip
            trigger={<IconInfoSmall className={cs.infoIcon} />}
            content={
              "Choose the reference genome you would like to map the non-host reads against to create a consensus genome."
            }
            link={"https://help.idseq.net"}
            position={"top center"}
          />
        </div>
        <SubtextDropdown
          className={cs.dropdown}
          fluid
          options={this.getReferenceGenomes()}
          onChange={this.handleAccessionChange}
          placeholder="Select a reference genome"
        />
        <PrimaryButton
          className={cs.button}
          text="Create Consensus Genome"
          onClick={this.handleConsensusGenomeCreate}
          disabled={isNull(selectedAccessionIndex)}
        />
      </Modal>
    );
  }
}

ConsensusGenomeCreationModal.propTypes = {
  consensusGenomeData: PropTypes.shape({
    accessionData: PropTypes.object,
    percentIdentity: PropTypes.number,
    taxId: PropTypes.number,
    taxName: PropTypes.string,
    usedAccessions: PropTypes.arrayOf(PropTypes.string),
  }),
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onCreation: PropTypes.func.isRequired,
  sample: PropTypes.object.isRequired,
};
