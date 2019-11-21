import React from "react";
import PropTypes from "prop-types";
import { getOr, orderBy } from "lodash/fp";

import { Table } from "~/components/visualizations/table";
import { defaultTableRowRenderer } from "react-virtualized";
import cx from "classnames";
import { withAnalytics } from "~/api/analytics";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import InsightIcon from "~ui/icons/InsightIcon";
import { getCategoryAdjective } from "~/components/views/report/utils/taxon";

import cs from "./report_table.scss";

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
        dataKey: "displayName",
        flexGrow: 1,
        headerClassName: cs.taxonHeader,
        label: "Taxon",
        width: 350,
        sortFunction: ({ data, sortDirection }) =>
          this.nestedSortFunction({
            data,
            sortDirection,
            path: ["displayName"],
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
        cellDataGetter: ({ rowData }) =>
          this.getNtNrFromDataRow(rowData, "z_score", 0),
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
        cellDataGetter: ({ rowData }) =>
          this.getNtNrFromDataRow(rowData, "rpm", 0),
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
        cellDataGetter: ({ rowData }) =>
          this.getNtNrFromDataRow(rowData, "count", 0),
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
        cellDataGetter: ({ rowData }) =>
          this.getNtNrFromDataRow(rowData, "contigCount", 0),
        cellRenderer: this.renderNtNrDecimalValues,
        dataKey: "contigCount",
        label: "contig",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["contigCount"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 75,
      },
      {
        cellDataGetter: ({ rowData }) =>
          this.getNtNrFromDataRow(rowData, "readsCount", 0),
        cellRenderer: this.renderNtNrDecimalValues,
        dataKey: "readsCount",
        label: "contig r",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["readsCount"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 75,
      },
      {
        cellDataGetter: ({ rowData }) =>
          this.getNtNrFromDataRow(rowData, "percent_identity", 0),
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
        cellDataGetter: ({ rowData }) =>
          this.getNtNrFromDataRow(rowData, "alignment_length", 0),
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
        cellDataGetter: ({ rowData }) =>
          this.getNtNrFromDataRow(rowData, "e_value", 0),
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
    const { onTaxonNameClick } = this.props;
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
            <span
              className={cx(cs.taxonName, cellData || cs.missingName)}
              onClick={() => onTaxonNameClick({ ...rowData })}
            >
              {cellData || rowData.name}
            </span>
            {rowData.taxLevel == "genus" &&
              (rowData.category ? (
                <span className={cs.countInfo}>{`(${
                  rowData.filteredSpecies.length
                } ${getCategoryAdjective(rowData.category)} species)`}</span>
              ) : (
                <span
                  className={cs.countInfo}
                >{`(${rowData.filteredSpecies.length} species)`}</span>
              ))}
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

  getNtNrFromDataRow(rowData, field, defaultValue) {
    return [
      getOr(defaultValue, ["nt", field], rowData),
      getOr(defaultValue, ["nr", field], rowData),
    ];
  }

  nestedSortFunction = ({ data, path, sortDirection, nullValue, limits }) => {
    // Uses lodash's orderBy function.
    // It uses a triple sorting key that enables nested sorting of genus and species, while guaranteeing that
    // genus is always on top of its children species
    return orderBy(
      [
        // 1st value: value defined by path for the genus (guarantees all genus together)
        // note: a species row has a field .genus that points to their genus
        rowData =>
          rowData.genus
            ? getOr(nullValue, ["genus"].concat(path), rowData)
            : getOr(nullValue, path, rowData),
        // 2nd value: the genus tax id
        // this value guarantees that we keep species within their genus, even if the first value is duplicated
        // e.g. if two genus have 2 reads they would be together on top and they species after them,
        // adding tax id guarantees all the species are below their respective genus
        rowData => (rowData.genus ? rowData.genus.taxId : rowData.taxId),
        // 3rd value: value defined by path for the species if species row;
        // using the limit value for genus based on direction guarantees that genus are always on top of their species.
        // e.g.
        //   genus A with tax id of 1001 has 2 reads and has species A1 with 1 read, and A2 with 1 read
        //   genus B with tax id of 1002 has 2 reads and has species B1 with 2 reads
        // without tax id, the ascending order would be A: [2, -], B: [2, -], A1: [2, 1], A2 [2, 1] B1: [2, 2]
        // with tax id, the ascending order would be A: [2, 1001, -], A1: [2, 1001, 1], A2: [2, 1001, 1], B: [2, 1002, -], B1: [2, 1002, 2]
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

  handleNtNrChange = selectedDbType => {
    this.setState({
      dbType: selectedDbType,
    });
  };

  getTableRows = () => {
    const { data } = this.props;
    const { expandedGenusIds } = this.state;

    // flatten data for consumption of react virtualized table
    // removes collapsed rows
    const tableRows = [];
    data.forEach(genusData => {
      tableRows.push(genusData);

      if (expandedGenusIds.has(genusData.taxId)) {
        genusData.filteredSpecies.forEach(speciesData => {
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
        sortedHeaderClassName={cs.sortedHeader}
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
  onTaxonNameClick: PropTypes.func,
  rowHeight: PropTypes.number,
};

export default ReportTable;
