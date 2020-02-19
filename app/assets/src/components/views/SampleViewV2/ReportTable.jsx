import React from "react";
import { compact, getOr, keys, map, orderBy } from "lodash/fp";
import cx from "classnames";

import { Table } from "~/components/visualizations/table";
import { defaultTableRowRenderer } from "react-virtualized";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import { getCategoryAdjective } from "~/components/views/report/utils/taxon";
import { getCsrfToken } from "~/api/utils";
import {
  pipelineVersionHasAssembly,
  pipelineVersionHasCoverageViz,
} from "~/components/utils/sample";
import { UserContext } from "~/components/common/UserContext";
import BasicPopup from "~/components/BasicPopup";
import ReportInsightIcon from "../report/ReportInsightIcon";
import PathogenLabel from "~/components/ui/labels/PathogenLabel";
import PathogenPreview from "~/components/views/report/PathogenPreview";
import PhyloTreeChecks from "~/components/views/phylo_tree/PhyloTreeChecks";
import PropTypes from "~/components/utils/propTypes";
import PhyloTreeCreationModal from "~/components/views/phylo_tree/PhyloTreeCreationModal";
import TableRenderers from "~/components/views/discovery/TableRenderers";

import { REPORT_TABLE_COLUMNS } from "../report/ReportTable/constants";
import HoverActions from "../report/ReportTable/HoverActions";
import cs from "./report_table.scss";

// Values for null values when sorting ascending and descending
// for strings - HACK: In theory, there can be strings larger than this
const STRING_NULL_VALUES = ["", "zzzzzzzzz"];
const NUMBER_NULL_VALUES = [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
const INVALID_CALL_BASE_TAXID = -1e8;
const TAX_LEVEL_INDICES = {
  species: 1,
  genus: 2,
};

// Expand the coronavirus taxid by default.
const BETACORONAVIRUS_GENUS_TAXID = 694002;

class ReportTable extends React.Component {
  constructor(props) {
    super(props);

    const { pipelineVersion } = props;

    this.state = {
      expandAllOpened: false,
      expandedGenusIds: new Set([BETACORONAVIRUS_GENUS_TAXID]),
      dbType: this.props.initialDbType,
    };

    const assemblyEnabled = pipelineVersionHasAssembly(pipelineVersion);
    this.columns = compact([
      {
        cellRenderer: this.renderExpandIcon,
        className: cs.expandHeader,
        dataKey: "expanded",
        disableSort: true,
        headerClassName: cs.expandCell,
        headerRenderer: this.renderExpandIconHeader,
        width: 20,
      },
      {
        cellRenderer: this.renderName,
        className: cs.nameCell,
        dataKey: "displayName",
        flexGrow: 1,
        headerClassName: cs.taxonHeader,
        label: "Taxon",
        minWidth: 300,
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
        columnData: REPORT_TABLE_COLUMNS["NT_aggregatescore"],
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
        columnData: REPORT_TABLE_COLUMNS["zscore"],
        dataKey: "z_score",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["z_score"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 65,
      },
      {
        cellDataGetter: ({ rowData }) =>
          this.getNtNrFromDataRow(rowData, "rpm", 0),
        cellRenderer: ({ cellData }) =>
          this.renderNtNrDecimalValues({ cellData, decimalPlaces: 1 }),
        columnData: REPORT_TABLE_COLUMNS["rpm"],
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
        columnData: REPORT_TABLE_COLUMNS["r"],
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
      assemblyEnabled && {
        cellDataGetter: ({ rowData }) =>
          this.getNtNrFromDataRow(rowData, "contigCount", 0),
        cellRenderer: this.renderNtNrDecimalValues,
        columnData: REPORT_TABLE_COLUMNS["contigs"],
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
      assemblyEnabled && {
        cellDataGetter: ({ rowData }) =>
          this.getNtNrFromDataRow(rowData, "readsCount", 0),
        cellRenderer: this.renderNtNrDecimalValues,
        columnData: REPORT_TABLE_COLUMNS["contigreads"],
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
        columnData: REPORT_TABLE_COLUMNS["percentidentity"],
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
        columnData: REPORT_TABLE_COLUMNS["alignmentlength"],
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
        columnData: REPORT_TABLE_COLUMNS["neglogevalue"],
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
        width: 65,
      },
      {
        dataKey: "ntnrSelector",
        disableSort: true,
        headerClassName: cs.ntnrSelectorHeader,
        headerRenderer: this.renderNtNrSelector,
        width: 40,
      },
    ]);
  }

  renderAggregateScore = ({ cellData, rowData }) => {
    return (
      <div className={cs.annotatedData}>
        <div className={cs.icon}>
          {rowData.highlighted && <ReportInsightIcon />}
        </div>
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
        <div className={cs.taxonContainer}>
          <span
            className={cx(cs.taxonName, !!cellData || cs.missingName)}
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
              <span className={cs.countInfo}>
                {`(${rowData.filteredSpecies.length} species)`}
              </span>
            ))}
          <span>
            {rowData.pathogens && (
              <PathogenPreview tag2Count={rowData.pathogens} />
            )}
            {rowData.pathogenTag && (
              <PathogenLabel type={rowData.pathogenTag} />
            )}
          </span>
          <span>{this.renderHoverActions({ rowData })}</span>
        </div>
      )
    );
  };

  renderExpandIcon = ({ rowData }) => {
    const { expandedGenusIds } = this.state;
    return (
      <div className={cs.expandIcon}>
        {rowData.taxLevel == "genus" ? (
          <i
            className={cx(
              "fa",
              expandedGenusIds.has(rowData.taxId)
                ? "fa-angle-down"
                : "fa-angle-right"
            )}
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
    );
  };

  renderExpandIconHeader = () => {
    const { expandAllOpened } = this.state;
    return (
      <div className={cs.expandIcon}>
        <i
          className={cx(
            "fa",
            expandAllOpened ? "fa-angle-down" : "fa-angle-right"
          )}
          onClick={withAnalytics(
            () => this.toggleExpandAll(),
            "PipelineSampleReport_expand-all_clicked"
          )}
        />
      </div>
    );
  };

  renderNtNrDecimalValues = ({ cellData, decimalPlaces }) => {
    return this.renderNtNrStack({
      cellData: cellData.map(val =>
        TableRenderers.formatNumberWithCommas(
          Number(val).toFixed(decimalPlaces || 0)
        )
      ),
    });
  };

  renderNtNrSelector = () => {
    let selector = (
      <div>
        {this.renderNtNrStack({
          cellData: ["NT", "NR"],
          onClick: [
            withAnalytics(
              () => this.handleNtNrChange("nt"),
              "ReportTable_count-type_clicked",
              {
                countType: "nt",
              }
            ),
            withAnalytics(
              () => this.handleNtNrChange("nr"),
              "ReportTable_count-type_clicked",
              {
                countType: "nr",
              }
            ),
          ],
        })}
      </div>
    );
    return (
      <BasicPopup
        trigger={selector}
        position="top right"
        content="Switch count type"
        inverted
        basic={false}
        size="small"
      />
    );
  };

  renderNtNrStack = ({ cellData, onClick }) => {
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

  // Hover actions
  // TODO(tiago): consider moving the action inside HoverActions
  linkToNCBI = ({ taxId }) => {
    let num = parseInt(taxId);
    if (num < -1e8) {
      num = -num % -1e8;
    }
    num = num.toString();
    const ncbiLink = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${num}`;
    window.open(ncbiLink, "hide_referrer");
  };

  downloadFastaUrl = ({ taxLevel, taxId }) => {
    const { pipelineVersion, sampleId } = this.props;
    const taxLevelIndex = TAX_LEVEL_INDICES[taxLevel];
    if (!taxLevelIndex) {
      // eslint-disable-next-line no-console
      console.error("Unknown taxLevel:", taxLevel);
      return;
    }
    location.href = `/samples/${sampleId}/fasta/${taxLevelIndex}/${taxId}/NT_or_NR?pipeline_version=${pipelineVersion}`;
  };

  downloadContigUrl = ({ taxId }) => {
    const { pipelineVersion, sampleId } = this.props;
    location.href = `/samples/${sampleId}/taxid_contigs?taxid=${taxId}&pipeline_version=${pipelineVersion}`;
  };

  handleCoverageVizClick = ({
    taxId,
    taxLevel,
    taxName,
    taxCommonName,
    taxSpecies,
  }) => {
    const { onCoverageVizClick, pipelineVersion, sampleId } = this.props;
    const alignmentVizUrl = `/samples/${sampleId}/alignment_viz/nt_${taxLevel}_${taxId}?pipeline_version=${pipelineVersion}`;

    if (pipelineVersionHasCoverageViz(pipelineVersion)) {
      onCoverageVizClick({
        taxId,
        taxName,
        taxCommonName,
        taxLevel,
        alignmentVizUrl,
        taxSpecies,
      });
    } else {
      window.open(alignmentVizUrl);
    }
  };

  handlePhyloTreeModalOpen = phyloTreeModalParams => {
    this.setState({
      phyloTreeModalParams,
    });
  };

  handlePhyloTreeModalClose = () => {
    this.setState({
      phyloTreeModalParams: null,
    });
  };

  renderHoverActions = ({ rowData }) => {
    const {
      alignVizAvailable,
      fastaDownloadEnabled,
      phyloTreeAllowed,
      pipelineVersion,
      projectId,
      sampleId,
    } = this.props;

    const validTaxId =
      rowData.taxId < INVALID_CALL_BASE_TAXID || rowData.taxId > 0;
    const contigVizEnabled =
      !!keys(getOr({}, "nt.contigs", rowData)).length ||
      !!keys(getOr({}, "nr.contigs", rowData)).length;
    const coverageVizEnabled =
      alignVizAvailable && validTaxId && getOr(0, "nt.count", rowData) > 0;
    const phyloTreeEnabled =
      phyloTreeAllowed &&
      rowData.taxId > 0 &&
      PhyloTreeChecks.passesCreateCondition(
        getOr(0, "nt.count", rowData),
        getOr(0, "nr.count", rowData)
      );

    const analyticsContext = {
      projectId: projectId,
      sampleId: sampleId,
      taxId: rowData.taxId,
      taxLevel: rowData.taxLevel,
      taxName: rowData.name,
    };
    return (
      <HoverActions
        className={cs.hoverActions}
        taxId={rowData.taxId}
        taxLevel={rowData.taxLevel === "species" ? 1 : 2}
        taxName={rowData.name}
        taxCommonName={rowData.common_name}
        taxSpecies={rowData.species}
        ncbiEnabled={validTaxId}
        onNcbiActionClick={withAnalytics(
          this.linkToNCBI,
          "PipelineSampleReport_ncbi-link_clicked",
          analyticsContext
        )}
        fastaEnabled={fastaDownloadEnabled}
        onFastaActionClick={withAnalytics(
          this.downloadFastaUrl,
          "PipelineSampleReport_taxon-fasta-link_clicked",
          analyticsContext
        )}
        coverageVizEnabled={coverageVizEnabled}
        onCoverageVizClick={withAnalytics(
          this.handleCoverageVizClick,
          "PipelineSampleReport_coverage-viz-link_clicked",
          analyticsContext
        )}
        contigVizEnabled={contigVizEnabled}
        onContigVizClick={withAnalytics(
          this.downloadContigUrl,
          "PipelineSampleReport_contig-download-link_clicked",
          analyticsContext
        )}
        phyloTreeEnabled={phyloTreeEnabled}
        onPhyloTreeModalOpened={withAnalytics(
          this.handlePhyloTreeModalOpen,
          "PipelineSampleReport_phylotree-link_clicked",
          analyticsContext
        )}
        pipelineVersion={pipelineVersion}
      />
    );
  };

  rowRenderer = rowProps => {
    const data = rowProps.rowData;
    if (data) {
      rowProps.className = cx(
        rowProps.className,
        cs[`${data.taxLevel}Row`],
        (data.highlighted || data.highlightedChildren) && cs.highlighted
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
    logAnalyticsEvent("PipelineSampleReport_column-sort-arrow_clicked", {
      path,
      sortDirection,
    });
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
    const { data } = this.props;
    const { expandedGenusIds, expandAllOpened } = this.state;
    expandedGenusIds.delete(taxId) || expandedGenusIds.add(taxId);

    let newExpandedAllOpened = expandAllOpened;
    if (expandedGenusIds.size === data.length) {
      newExpandedAllOpened = true;
    } else if (!expandedGenusIds.size) {
      newExpandedAllOpened = false;
    }

    this.setState({
      expandedGenusIds: new Set(expandedGenusIds),
      expandAllOpened: newExpandedAllOpened,
    });
  };

  toggleExpandAll = () => {
    const { data } = this.props;
    const { expandAllOpened } = this.state;

    if (expandAllOpened) {
      this.setState({
        expandedGenusIds: new Set(),
        expandAllOpened: false,
      });
    } else {
      this.setState({
        expandedGenusIds: new Set(map("taxId", data)),
        expandAllOpened: true,
      });
    }
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
    const { projectId, projectName, rowHeight } = this.props;
    const { phyloTreeModalParams } = this.state;
    return (
      <React.Fragment>
        <Table
          cellClassName={cs.cell}
          columns={this.columns}
          data={this.getTableRows()}
          defaultRowHeight={rowHeight}
          headerClassName={cs.header}
          rowClassName={cs.row}
          rowRenderer={this.rowRenderer}
          sortable={true}
          sortedHeaderClassName={cs.sortedHeader}
        />
        {phyloTreeModalParams && (
          <UserContext.Consumer>
            {currentUser => (
              <PhyloTreeCreationModal
                admin={currentUser.admin ? 1 : 0}
                csrf={getCsrfToken()}
                taxonId={phyloTreeModalParams.taxId}
                taxonName={phyloTreeModalParams.taxName}
                projectId={projectId}
                projectName={projectName}
                onClose={this.handlePhyloTreeModalClose}
              />
            )}
          </UserContext.Consumer>
        )}
      </React.Fragment>
    );
  };
}

ReportTable.defaultProps = {
  data: [],
  initialDbType: "nt",
  rowHeight: 54,
};

ReportTable.propTypes = {
  data: PropTypes.array,
  initialDbType: PropTypes.oneOf(["nt", "nr"]),
  onTaxonNameClick: PropTypes.func,
  rowHeight: PropTypes.number,

  // Needed only for hover actions
  // Consider adding a callback to render the hover actions
  alignVizAvailable: PropTypes.bool.isRequired,
  fastaDownloadEnabled: PropTypes.bool.isRequired,
  onCoverageVizClick: PropTypes.func.isRequired,
  phyloTreeAllowed: PropTypes.bool.isRequired,
  pipelineVersion: PropTypes.string,
  projectId: PropTypes.number,
  projectName: PropTypes.string,
  sampleId: PropTypes.number,
};

export default ReportTable;
