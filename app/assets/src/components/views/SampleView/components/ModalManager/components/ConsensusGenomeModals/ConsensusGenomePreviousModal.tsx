import { Button, Icon } from "@czi-sds/components";
import { get } from "lodash/fp";
import moment from "moment";
import React from "react";
import BasicPopup from "~/components/BasicPopup";
import { Table } from "~/components/visualizations/table";
import { numberWithCommas } from "~/helpers/strings";
import { ConsensusGenomeData } from "~/interface/shared";
import Modal from "~ui/containers/Modal";
import cs from "./consensus_genome_previous_modal.scss";

interface ConsensusGenomePreviousModalProps {
  consensusGenomeData?: ConsensusGenomeData;
  open?: boolean;
  onClose: $TSFixMeFunction;
  onNew: $TSFixMeFunction;
  sample: object;
  onRowClick: $TSFixMeFunction;
}

export const ConsensusGenomePreviousModal = ({
  consensusGenomeData,
  onClose,
  onNew,
  onRowClick,
  open,
}: ConsensusGenomePreviousModalProps) => {
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
      onClose={onClose}
      data-testid="previous-consensus-genome-modal"
    >
      <div className={cs.title}>Consensus Genome</div>
      <div className={cs.label}>
        Taxon:{" "}
        {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
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
          onRowClick={onRowClick}
        />
      </div>
      <Button
        className={cs.button}
        sdsType="primary"
        sdsStyle="minimal"
        isAllCaps={true}
        startIcon={<Icon sdsIcon="plus" sdsSize="xs" sdsType="button" />}
        onClick={() => onNew && onNew(consensusGenomeData)}
      >
        Create a New Consensus Genome
      </Button>
    </Modal>
  );
};
