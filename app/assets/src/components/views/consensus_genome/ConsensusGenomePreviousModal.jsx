import React from "react";
import PropTypes from "prop-types";
import { get, map, merge } from "lodash/fp";

import { withAnalytics, ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import Modal from "~ui/containers/Modal";
import ButtonTextPrimary from "~/components/ui/controls/buttons/ButtonTextPrimary";
import { Table } from "~/components/visualizations/table";

import cs from "./consensus_genome_previous_modal.scss";

export default function ConsensusGenomePreviousModal({
  consensusGenomeData,
  onClose,
  onNew,
  open,
}) {
  const previousRuns = map(
    r => merge(r, r.inputs),
    get("previousRuns", consensusGenomeData)
  );
  const columns = [
    {
      dataKey: "accession_name",
      flexGrow: 1,
      label: "Consensus Genomes",
    },
    {
      dataKey: "executed_at",
      flexGrow: 1,
      label: "Date Created",
    },
  ];

  return (
    <Modal
      className={cs.modal}
      narrow
      open={open}
      minimumHeight
      onClose={withAnalytics(
        onClose,
        ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_PREVIOUS_MODAL_CLOSED
      )}
    >
      <div className={cs.title}>Consensus Genome</div>
      <div className={cs.label}>
        Taxon:{" "}
        <span className={cs.taxonName}>{consensusGenomeData.taxName}</span>
      </div>
      <div className={cs.table}>
        <Table
          columns={columns}
          data={previousRuns}
          defaultRowHeight={50}
          headerHeight={20}
        />
      </div>
      <ButtonTextPrimary
        text="+ Create a New Consensus Genome"
        onClick={() => onNew && onNew(consensusGenomeData)}
      />
    </Modal>
  );
}

ConsensusGenomePreviousModal.propTypes = {
  consensusGenomeData: PropTypes.shape({
    percentIdentity: PropTypes.number,
    previousRuns: PropTypes.arrayOf(PropTypes.object),
    taxId: PropTypes.number,
    taxName: PropTypes.string,
  }),
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onNew: PropTypes.func.isRequired,
  sample: PropTypes.object.isRequired,
};
