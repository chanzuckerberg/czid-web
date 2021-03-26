import { get } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import moment from "moment";

import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";
import ButtonTextPrimary from "~/components/ui/controls/buttons/ButtonTextPrimary";
import { IconPlusSmall } from "~/components/ui/icons";
import { Table } from "~/components/visualizations/table";
import Modal from "~ui/containers/Modal";

import cs from "./consensus_genome_previous_modal.scss";

export default function ConsensusGenomePreviousModal({
  consensusGenomeData,
  onClose,
  onNew,
  onRowClick,
  open,
}) {
  const columns = [
    {
      dataKey: "inputs",
      flexGrow: 1,
      label: "Consensus Genomes",
      headerClassName: cs.primaryHeader,
      cellRenderer: ({ cellData }) =>
        `${cellData.accession_id} - ${cellData.accession_name}`,
    },
    {
      dataKey: "executed_at",
      width: 100,
      label: "Date Created",
      className: cs.dateCell,
      cellRenderer: ({ cellData }) => moment(cellData).fromNow(),
    },
  ];

  const previousRuns = get("previousRuns", consensusGenomeData);
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
          defaultRowHeight={55}
          headerHeight={32}
          headerLabelClassName={cs.headerLabel}
          rowClassName={cs.row}
          onRowClick={withAnalytics(
            onRowClick,
            ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_PREVIOUS_MODAL_ROW_CLICKED
          )}
        />
      </div>
      <ButtonTextPrimary
        icon={<IconPlusSmall className={cs.icon} />}
        label="Create a New Consensus Genome"
        onClick={withAnalytics(
          () => onNew && onNew(consensusGenomeData),
          ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_PREVIOUS_MODAL_CREATE_NEW_CLICKED
        )}
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
  onRowClick: PropTypes.func.isRequired,
};
