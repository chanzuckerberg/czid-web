import React from "react";
import PropTypes from "prop-types";
import { Table } from "~/components/visualizations/table";
import { defaultTableRowRenderer } from "react-virtualized";
import cx from "classnames";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import { getOr, orderBy } from "lodash/fp";

import cs from "./report_table.scss";
import InsightIcon from "~ui/icons/InsightIcon";

// Values for null values when sorting ascending and descending
// for strings - HACK: In theory, there can be strings larger than this
const STRING_NULL_VALUES = ["", "zzzzzzzzz"];
const NUMBER_NULL_VALUES = [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];

class ReportTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expandedGenusIds: new Set(),
      dbType: this.props.initialDbType,
    };

    this.columns = [
      {
        cellRenderer: this.renderName,
        className: cs.nameCell,
        dataKey: "name",
        flexGrow: 1,
        headerClassName: cs.taxonHeader,
        label: "Taxon",
        width: 350,
        sortFunction: ({ data, sortDirection }) =>
          this.nestedSortFunction({
            data,
            sortDirection,
            path: ["name"],
            nullValue: "",
            limits: STRING_NULL_VALUES,
          }),
      },
      {
        cellRenderer: this.renderAggregateScore,
        dataKey: "agg_score",
        label: "Score",
        width: 130,
        sortFunction: ({ data, sortDirection }) =>
          this.nestedSortFunction({
            data,
            sortDirection,
            path: ["agg_score"],
            nullValue: NUMBER_NULL_VALUES[0],
            limits: NUMBER_NULL_VALUES,
          }),
      },
      {
        cellDataGetter: ({ rowData }) => {
          return [
            (rowData.nt || {}).z_score || 0,
            (rowData.nr || {}).z_score || 0,
          ];
        },
        cellRenderer: ({ cellData }) =>
          this.renderNtNrDecimalValues({ cellData, decimalPlaces: 1 }),
        dataKey: "z_score",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["z_score"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 60,
      },
      {
        cellDataGetter: ({ rowData }) => {
          return [(rowData.nt || {}).rpm || 0, (rowData.nr || {}).rpm || 0];
        },
        cellRenderer: ({ cellData }) =>
          this.renderNtNrDecimalValues({ cellData, decimalPlaces: 1 }),
        dataKey: "rpm",
        label: "rPM",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["rpm"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 75,
      },
      {
        cellDataGetter: ({ rowData }) => {
          return [(rowData.nt || {}).count || 0, (rowData.nr || {}).count || 0];
        },
        cellRenderer: this.renderNtNrDecimalValues,
        dataKey: "r",
        label: "r",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["count"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 75,
      },
      {
        cellDataGetter: ({ rowData }) => {
          return [
            (rowData.nt || {}).contigs || 0,
            (rowData.nr || {}).contigs || 0,
          ];
        },
        cellRenderer: this.renderNtNrDecimalValues,
        dataKey: "contigs",
        label: "contig",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["contigs"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 75,
      },
      {
        cellDataGetter: ({ rowData }) => {
          return [
            (rowData.nt || {}).contig_reads || 0,
            (rowData.nr || {}).contig_reads || 0,
          ];
        },
        cellRenderer: this.renderNtNrDecimalValues,
        dataKey: "contig_reads",
        label: "contig r",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["contig_reads"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 75,
      },
      {
        cellDataGetter: ({ rowData }) => {
          return [
            (rowData.nt || {}).percent_identity || 0,
            (rowData.nr || {}).percent_identity || 0,
          ];
        },
        cellRenderer: ({ cellData }) =>
          this.renderNtNrDecimalValues({ cellData, decimalPlaces: 1 }),
        dataKey: "percent_identity",
        label: "%id",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["percent_identity"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 60,
      },
      {
        cellDataGetter: ({ rowData }) => {
          return [
            (rowData.nt || {}).alignment_length || 0,
            (rowData.nr || {}).alignment_length || 0,
          ];
        },
        cellRenderer: ({ cellData }) =>
          this.renderNtNrDecimalValues({ cellData, decimalPlaces: 1 }),
        dataKey: "alignment_length",
        label: "L",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["alignment_length"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 60,
      },
      {
        cellDataGetter: ({ rowData }) => {
          return [
            (rowData.nt || {}).e_value || 0,
            (rowData.nr || {}).e_value || 0,
          ];
        },
        cellRenderer: ({ cellData }) =>
          this.renderNtNrDecimalValues({ cellData, decimalPlaces: 1 }),
        dataKey: "e_value",
        label: "log(1/E)",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["e_value"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 60,
      },
      {
        dataKey: "ntnrSelector",
        disableSort: true,
        headerClassName: cs.ntnrSelectorHeader,
        headerRenderer: this.renderNtNrSelector,
        width: 40,
      },
    ];
  }

  nestedSortFunction = ({ data, path, sortDirection, nullValue, limits }) => {
    // Uses lodash's orderBy function.
    // It uses a sorting key that enables nested sorting of genus and species, while guaranteeing that
    // genus is always on top of its children species
    return orderBy(
      [
        rowData =>
          rowData.genus
            ? getOr(nullValue, ["genus"].concat(path), rowData)
            : getOr(nullValue, path, rowData),
        // this value guarantees that we keep species within their genus, even if the first value is duplicated
        rowData => (rowData.genus ? rowData.genus.taxId : rowData.taxId),
        rowData =>
          rowData.genus
            ? getOr(nullValue, path, rowData)
            : sortDirection === "asc"
              ? limits[0]
              : limits[1],
      ],
      [sortDirection, sortDirection, sortDirection],
      data
    );
  };

  nestedNtNrSortFunction = ({ path, ...props }) => {
    const { dbType } = this.state;
    return this.nestedSortFunction({ path: [dbType].concat(path), ...props });
  };

  toggleExpandGenus = ({ taxId }) => {
    const { expandedGenusIds } = this.state;
    expandedGenusIds.delete(taxId) || expandedGenusIds.add(taxId);

    this.setState({ expandedGenusIds: new Set(expandedGenusIds) });
  };

  renderAggregateScore = ({ cellData, rowData }) => {
    return (
      <div className={cs.annotatedData}>
        <div className={cs.icon}>{rowData.highlighted && <InsightIcon />}</div>
        <div className={cs.data}>
          {TableRenderers.formatNumberWithCommas(Number(cellData).toFixed(0))}
        </div>
      </div>
    );
  };

  renderName = ({ cellData, rowData }) => {
    return (
      rowData && (
        <React.Fragment>
          <div className={cs.expandIcon}>
            {rowData.taxLevel == "genus" ? (
              <i
                className={cx("fa", "fa-angle-right")}
                onClick={withAnalytics(
                  () => this.toggleExpandGenus({ taxId: rowData.taxId }),
                  "PipelineSampleReport_expand-genus_clicked",
                  { tax_id: rowData.taxId }
                )}
              />
            ) : (
              ""
            )}
          </div>
          <div className={cx(rowData.taxLevel == "species" && cs.speciesName)}>
            {cellData}
          </div>
        </React.Fragment>
      )
    );
  };

  renderNtNrDecimalValues = ({ cellData, decimalPlaces }) => {
    return this.renderNtNrValues({
      cellData: cellData.map(val =>
        TableRenderers.formatNumberWithCommas(
          Number(val).toFixed(decimalPlaces || 0)
        )
      ),
    });
  };

  handleNtNrChange = selectedDbType => {
    this.setState({
      dbType: selectedDbType,
    });
  };

  renderNtNrSelector = () => {
    return this.renderNtNrValues({
      cellData: ["NT", "NR"],
      onClick: [
        () => this.handleNtNrChange("nt"),
        () => this.handleNtNrChange("nr"),
      ],
    });
  };

  renderNtNrValues = ({ cellData, onClick }) => {
    const { dbType } = this.state;
    return (
      <div className={cs.stack}>
        <div
          className={cx(cs.stackElement, dbType == "nt" || cs.lowlightValue)}
          onClick={onClick ? () => onClick[0]("nt") : null}
        >
          {cellData ? cellData[0] : "-"}
        </div>
        <div
          className={cx(cs.stackElement, dbType == "nr" || cs.lowlightValue)}
          onClick={onClick ? () => onClick[1]("nr") : null}
        >
          {cellData ? cellData[1] : "-"}
        </div>
      </div>
    );
  };

  rowRenderer = rowProps => {
    const data = rowProps.rowData;
    if (data) {
      rowProps.className = cx(
        rowProps.className,
        cs[`${data.taxLevel}Row`],
        data.highlighted && cs.highlighted
      );
    }
    return defaultTableRowRenderer(rowProps);
  };

  getTableRows = () => {
    const { data } = this.props;
    const { expandedGenusIds } = this.state;

    const tableRows = [];
    data.forEach(genusData => {
      tableRows.push(genusData);
      if (expandedGenusIds.has(genusData.taxId)) {
        genusData.species.forEach(speciesData => {
          // Add a pointer to the genus data for sorting purposes
          speciesData.genus = genusData;
          tableRows.push(speciesData);
        });
      }
    });
    return tableRows;
  };

  render = () => {
    const { rowHeight } = this.props;
    return (
      <Table
        cellClassName={cs.cell}
        columns={this.columns}
        data={this.getTableRows()}
        defaultRowHeight={rowHeight}
        headerClassName={cs.header}
        rowRenderer={this.rowRenderer}
        sortable={true}
      />
    );
  };
}

ReportTable.defaultProps = {
  data: [],
  initialDbType: "nt",
  rowHeight: 55,
};

ReportTable.propTypes = {
  data: PropTypes.array,
  initialDbType: PropTypes.oneOf(["nt", "nr"]),
  rowHeight: PropTypes.number,
};

export default ReportTable;
