import { get } from "lodash/fp";
import moment from "moment";
import React from "react";

import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import ButtonTextPrimary from "~/components/ui/controls/buttons/ButtonTextPrimary";
import { IconPlusSmall } from "~/components/ui/icons";
import { Table } from "~/components/visualizations/table";
import { numberWithCommas } from "~/helpers/strings";
import Modal from "~ui/containers/Modal";

import cs from "./consensus_genome_previous_modal.scss";

interface ConsensusGenomePreviousModalProps {
  consensusGenomeData?: {
    percentIdentity?: number;
    previousRuns?: object[];
    taxId?: number;
    taxName?: string;
  };
  open?: boolean;
  onClose: $TSFixMeFunction;
  onNew: $TSFixMeFunction;
  sample: object;
  onRowClick: $TSFixMeFunction;
}

export default function ConsensusGenomePreviousModal({
  consensusGenomeData,
  onClose,
  onNew,
  onRowClick,
  open,
}: ConsensusGenomePreviousModalProps) {
  const renderPrimaryCell = (cellData: {
    inputs: { accession_id: $TSFixMeUnknown; accession_name: $TSFixMeUnknown };
    parsed_cached_results: any;
  }) => {
    const { inputs, parsed_cached_results: results } = cellData;

    const coverage = get("coverage_viz.coverage_depth", results);
    const percentId = get("quality_metrics.percent_identity", results);
    const referenceLength = numberWithCommas(
      get("quality_metrics.reference_genome_length", results),
    );
    const title = `${inputs.accession_id} - ${inputs.accession_name}`;
    return (
      <>
        <BasicPopup
          content={title}
          position="top right"
          trigger={<div className={cs.title}>{title}</div>}
        />
        <div className={cs.subtext}>
          {results &&
            `${percentId} %id, ${referenceLength} bp length, ${
              coverage ? coverage.toFixed(2) : ""
            }x coverage`}
        </div>
      </>
    );
  };

  const columns = [
    {
      dataKey: "", // Using multiple columns
      flexGrow: 1,
      label: "Consensus Genomes",
      headerClassName: cs.primaryHeader,
      className: cs.runData,
      cellDataGetter: ({ rowData }) => rowData,
      cellRenderer: ({ cellData }) => renderPrimaryCell(cellData),
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
        ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_PREVIOUS_MODAL_CLOSED,
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
            ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_PREVIOUS_MODAL_ROW_CLICKED,
          )}
        />
      </div>
      <ButtonTextPrimary
        icon={<IconPlusSmall className={cs.icon} />}
        label="Create a New Consensus Genome"
        onClick={withAnalytics(
          () => onNew && onNew(consensusGenomeData),
          ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_PREVIOUS_MODAL_CREATE_NEW_CLICKED,
        )}
      />
    </Modal>
  );
}
