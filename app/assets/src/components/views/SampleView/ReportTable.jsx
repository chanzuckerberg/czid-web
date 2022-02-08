import cx from "classnames";
import { compact, filter, get, getOr, map, orderBy, reduce } from "lodash/fp";
import React from "react";
import { defaultTableRowRenderer, SortDirection } from "react-virtualized";

import {
  logAnalyticsEvent,
  withAnalytics,
  ANALYTICS_EVENT_NAMES,
} from "~/api/analytics";
import { getCsrfToken } from "~/api/utils";
import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import AnnotationLabel from "~/components/ui/labels/AnnotationLabel";
import PathogenLabel from "~/components/ui/labels/PathogenLabel";
import { BACKGROUND_MODELS_LINK } from "~/components/utils/documentationLinks";
import { ANNOTATION_FEATURE } from "~/components/utils/features";
import {
  isPipelineFeatureAvailable,
  ASSEMBLY_FEATURE,
  COVERAGE_VIZ_FEATURE,
} from "~/components/utils/pipeline_versions";
import PropTypes from "~/components/utils/propTypes";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import PhyloTreeChecks from "~/components/views/phylo_tree/PhyloTreeChecks";
import PhyloTreeCreationModal from "~/components/views/phylo_tree/PhyloTreeCreationModal";
import AnnotationPreview from "~/components/views/report/AnnotationPreview";
import PathogenPreview from "~/components/views/report/PathogenPreview";
import { getCategoryAdjective } from "~/components/views/report/utils/taxon";
import { Table } from "~/components/visualizations/table";
import { IconInsightSmall } from "~ui/icons";
import HoverActions from "./HoverActions";
import {
  REPORT_TABLE_COLUMNS,
  TAX_LEVEL_GENUS,
  TAX_LEVEL_SPECIES,
  SPECIES_LEVEL_INDEX,
  GENUS_LEVEL_INDEX,
  ANNOTATION_HIT,
  ANNOTATION_NOT_A_HIT,
  ANNOTATION_INCONCLUSIVE,
  ANNOTATION_NONE,
} from "./constants";
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

class ReportTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expandAllOpened: false,
      expandedGenusIds: new Set(),
      dbType: this.props.initialDbType,
    };

    this.columns = this.computeColumns();
  }

  componentDidUpdate(prevProps) {
    const { displayNoBackground } = this.props;
    if (displayNoBackground !== prevProps.displayNoBackground) {
      this.columns = this.computeColumns();
    }
  }

  computeColumns = () => {
    const {
      displayMergedNtNrValue,
      displayNoBackground,
      pipelineVersion,
    } = this.props;

    const countTypes = displayMergedNtNrValue ? ["merged_nt_nr"] : ["nt", "nr"];
    const assemblyEnabled = isPipelineFeatureAvailable(
      ASSEMBLY_FEATURE,
      pipelineVersion,
    );
    return compact([
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
        columnData: displayMergedNtNrValue
          ? REPORT_TABLE_COLUMNS["unavailable"]
          : REPORT_TABLE_COLUMNS["NT_aggregatescore"],
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
        disableSort: displayNoBackground,
      },
      {
        cellDataGetter: ({ rowData }) =>
          displayMergedNtNrValue
            ? null
            : this.getCountTypeValuesFromDataRow({
                rowData,
                field: "z_score",
                defaultValue: 0,
                countTypes: countTypes,
              }),
        cellRenderer: this.renderZscore,
        columnData: displayMergedNtNrValue
          ? REPORT_TABLE_COLUMNS["unavailable"]
          : REPORT_TABLE_COLUMNS["zscore"],
        dataKey: "z_score",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["z_score"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        disableSort: displayNoBackground,
        width: 65,
      },
      {
        cellDataGetter: ({ rowData }) =>
          this.getCountTypeValuesFromDataRow({
            rowData,
            field: "rpm",
            defaultValue: 0,
            countTypes: countTypes,
          }),
        cellRenderer: ({ cellData }) =>
          this.renderCellValue({ cellData, decimalPlaces: 1 }),
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
          this.getCountTypeValuesFromDataRow({
            rowData,
            field: "count",
            defaultValue: 0,
            countTypes: countTypes,
          }),
        cellRenderer: this.renderCellValue,
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
          this.getCountTypeValuesFromDataRow({
            rowData,
            field: "contigs",
            defaultValue: 0,
            countTypes: countTypes,
          }),
        cellRenderer: this.renderCellValue,
        columnData: REPORT_TABLE_COLUMNS["contigs"],
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
      assemblyEnabled && {
        cellDataGetter: ({ rowData }) =>
          this.getCountTypeValuesFromDataRow({
            rowData,
            field: "contig_r",
            defaultValue: 0,
            countTypes: countTypes,
          }),
        cellRenderer: this.renderCellValue,
        columnData: REPORT_TABLE_COLUMNS["contigreads"],
        dataKey: "contig_r",
        label: "contig r",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["contig_r"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 75,
      },
      {
        cellDataGetter: ({ rowData }) =>
          this.getCountTypeValuesFromDataRow({
            rowData,
            field: "percent_identity",
            defaultValue: 0,
            countTypes: countTypes,
          }),
        cellRenderer: ({ cellData }) =>
          this.renderCellValue({ cellData, decimalPlaces: 1 }),
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
          this.getCountTypeValuesFromDataRow({
            rowData,
            field: "alignment_length",
            defaultValue: 0,
            countTypes: countTypes,
          }),
        cellRenderer: ({ cellData }) =>
          this.renderCellValue({ cellData, decimalPlaces: 1 }),
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
        width: 70,
      },
      {
        cellDataGetter: ({ rowData }) =>
          this.getCountTypeValuesFromDataRow({
            rowData,
            field: "e_value",
            defaultValue: 0,
            countTypes: countTypes,
          }),
        cellRenderer: ({ cellData }) => this.render10BaseExponent(cellData),
        columnData: REPORT_TABLE_COLUMNS["evalue"],
        dataKey: "e_value",
        label: "E value",
        sortFunction: ({ data, sortDirection }) =>
          this.nestedNtNrSortFunction({
            data,
            sortDirection,
            path: ["e_value"],
            nullValue: 0,
            limits: NUMBER_NULL_VALUES,
          }),
        width: 70,
      },
      displayMergedNtNrValue
        ? {
            cellDataGetter: ({ rowData }) =>
              this.getCountTypeValuesFromDataRow({
                rowData,
                field: "source_count_type",
                defaultValue: "-",
                countTypes: countTypes,
              }),
            dataKey: "source_count_type",
            columnData: REPORT_TABLE_COLUMNS["sourceCountType"],
            // TODO(omar): Do users want to sort by SourceDB if prototype is successful?
            disableSort: true,
            label: "Source DB",
            width: 70,
          }
        : {
            dataKey: "ntnrSelector",
            disableSort: true,
            headerClassName: cs.ntnrSelectorHeader,
            headerRenderer: this.renderNtNrSelector,
            width: 40,
          },
    ]);
  };

  renderAggregateScore = ({ cellData, rowData }) => {
    const { displayNoBackground, displayMergedNtNrValue } = this.props;
    if (displayNoBackground || displayMergedNtNrValue) {
      return (
        <ColumnHeaderTooltip
          trigger={<div className={cs.noData}>-</div>}
          content={
            "To see the Aggregate Score, first choose a background model above."
          }
          link={BACKGROUND_MODELS_LINK}
        />
      );
    } else {
      return (
        <div className={cs.annotatedData}>
          <div className={cs.icon}>
            {rowData.highlighted && (
              <IconInsightSmall tooltip="Highest-scoring organisms satisfying certain thresholds" />
            )}
          </div>
          <div className={cs.data}>
            {TableRenderers.formatNumberWithCommas(Number(cellData).toFixed(0))}
          </div>
        </div>
      );
    }
  };

  renderZscore = ({ cellData }) => {
    const { displayNoBackground } = this.props;
    if (displayNoBackground) {
      return (
        <ColumnHeaderTooltip
          trigger={<div className={cs.noData}>-</div>}
          content={"To see the Z Score, first choose a background model above."}
          link={BACKGROUND_MODELS_LINK}
        />
      );
    } else {
      return cellData
        ? this.renderCellValue({ cellData, decimalPlaces: 1 })
        : "-";
    }
  };

  renderName = ({ cellData, rowData }) => {
    const { allowedFeatures = [] } = this.context || {};
    const { displayMergedNtNrValue, onTaxonNameClick } = this.props;
    let childrenCount = 0;
    if (rowData.taxLevel === TAX_LEVEL_GENUS) {
      childrenCount = displayMergedNtNrValue
        ? filter(species => species["merged_nt_nr"], rowData.filteredSpecies)
            .length
        : rowData.filteredSpecies.length;
    }
    const displayAnnotations =
      allowedFeatures.includes(ANNOTATION_FEATURE) && "annotation" in rowData;

    const displayAnnotationPreviews =
      allowedFeatures.includes(ANNOTATION_FEATURE) &&
      "species_annotations" in rowData &&
      (rowData.species_annotations[ANNOTATION_HIT] > 0 ||
        rowData.species_annotations[ANNOTATION_NOT_A_HIT] > 0 ||
        rowData.species_annotations[ANNOTATION_INCONCLUSIVE] > 0);

    return (
      rowData && (
        <div className={cs.taxonContainer}>
          {displayAnnotations && (
            <div className={cs.annotationLabel}>
              <AnnotationLabel type={rowData.annotation || ANNOTATION_NONE} />
            </div>
          )}
          <div className={cs.taxonInfo}>
            <span
              className={cx(cs.taxonName, !!cellData || cs.missingName)}
              onClick={() => onTaxonNameClick({ ...rowData })}
            >
              {cellData || rowData.name}
            </span>
            {rowData.taxLevel === TAX_LEVEL_GENUS &&
              (rowData.category ? (
                <span className={cs.countInfo}>
                  {`( ${childrenCount} ${getCategoryAdjective(
                    rowData.category,
                  )} species`}
                  {/* Only show a colon if needed */}
                  {(rowData.pathogens || displayAnnotationPreviews) && (
                    <span>:</span>
                  )}
                  {/* Show pathogen and annotation counts */}
                  {rowData.pathogens && (
                    <PathogenPreview tag2Count={rowData.pathogens} />
                  )}
                  {displayAnnotations && (
                    <AnnotationPreview
                      tag2Count={rowData.species_annotations}
                    />
                  )}
                  {` )`}
                </span>
              ) : (
                <span className={cs.countInfo}>
                  {`(${childrenCount} species)`}
                </span>
              ))}
            <span>
              {rowData.pathogenTag && (
                <PathogenLabel type={rowData.pathogenTag} />
              )}
            </span>
            <span>{this.renderHoverActions({ rowData })}</span>
          </div>
        </div>
      )
    );
  };

  renderExpandIcon = ({ rowData }) => {
    const { expandedGenusIds } = this.state;
    return (
      <div className={cs.expandIcon}>
        {rowData.taxLevel === TAX_LEVEL_GENUS ? (
          <i
            className={cx(
              "fa",
              expandedGenusIds.has(rowData.taxId)
                ? "fa-angle-down"
                : "fa-angle-right",
            )}
            onClick={withAnalytics(
              () => this.toggleExpandGenus({ taxId: rowData.taxId }),
              "PipelineSampleReport_expand-genus_clicked",
              { tax_id: rowData.taxId },
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
            expandAllOpened ? "fa-angle-down" : "fa-angle-right",
          )}
          onClick={withAnalytics(
            () => this.toggleExpandAll(),
            "PipelineSampleReport_expand-all_clicked",
          )}
        />
      </div>
    );
  };

  renderCellValue = ({ cellData, decimalPlaces }) => {
    if (!cellData.length) return "-";

    const hasMergedNtNrValue = cellData.length === 1;
    const mergedNtNrValue = (
      <div>
        {TableRenderers.formatNumberWithCommas(
          Number(cellData[0]).toFixed(decimalPlaces || 0),
        )}
      </div>
    );

    return hasMergedNtNrValue
      ? mergedNtNrValue
      : this.renderNtNrStack({
          cellData: cellData.map(val =>
            TableRenderers.formatNumberWithCommas(
              Number(val).toFixed(decimalPlaces || 0),
            ),
          ),
        });
  };

  render10BaseExponent = cellData => {
    if (!cellData.length) return "-";

    const hasMergedNtNrValue = cellData.length === 1;
    const mergedNtNrValue = (
      <div>{TableRenderers.format10BaseExponent(cellData[0])}</div>
    );

    return hasMergedNtNrValue
      ? mergedNtNrValue
      : this.renderNtNrStack({
          cellData: cellData.map(val =>
            TableRenderers.format10BaseExponent(val),
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
              },
            ),
            withAnalytics(
              () => this.handleNtNrChange("nr"),
              "ReportTable_count-type_clicked",
              {
                countType: "nr",
              },
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
          className={cx(cs.stackElement, dbType === "nt" || cs.lowlightValue)}
          onClick={onClick ? () => onClick[0]("nt") : null}
        >
          {cellData ? cellData[0] : "-"}
        </div>
        <div
          className={cx(cs.stackElement, dbType === "nr" || cs.lowlightValue)}
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
    location.href = `/samples/${sampleId}/taxid_contigs_download?taxid=${taxId}&pipeline_version=${pipelineVersion}`;
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

    if (isPipelineFeatureAvailable(COVERAGE_VIZ_FEATURE, pipelineVersion)) {
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
      consensusGenomeData,
      consensusGenomeEnabled,
      fastaDownloadEnabled,
      onBlastClick,
      onConsensusGenomeClick,
      onPreviousConsensusGenomeClick,
      phyloTreeAllowed,
      pipelineVersion,
      projectId,
      sampleId,
      snapshotShareId,
    } = this.props;

    const validTaxId =
      rowData.taxId < INVALID_CALL_BASE_TAXID || rowData.taxId > 0;
    const contigVizEnabled = !!(
      get("nt.contigs", rowData) || get("nr.contigs", rowData)
    );
    const coverageVizEnabled =
      alignVizAvailable && validTaxId && getOr(0, "nt.count", rowData) > 0;
    const phyloTreeEnabled =
      phyloTreeAllowed &&
      rowData.taxId > 0 &&
      PhyloTreeChecks.passesCreateCondition(
        getOr(0, "nt.count", rowData),
        getOr(0, "nr.count", rowData),
      );
    const percentIdentity = get("nt.percent_identity", rowData);
    const previousConsensusGenomeRuns = get(rowData.taxId, consensusGenomeData);
    const ntContigs = get("nt.contigs", rowData);
    const ntReads = get("nt.count", rowData);

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
        taxLevel={
          rowData.taxLevel === TAX_LEVEL_SPECIES
            ? SPECIES_LEVEL_INDEX
            : GENUS_LEVEL_INDEX
        }
        taxName={rowData.name}
        taxCommonName={rowData.common_name}
        taxSpecies={rowData.species}
        taxCategory={rowData.category}
        ncbiEnabled={validTaxId}
        ntContigs={ntContigs}
        ntReads={ntReads}
        onBlastClick={withAnalytics(
          onBlastClick,
          ANALYTICS_EVENT_NAMES.REPORT_TABLE_BLAST_BUTTON_HOVER_ACTION_CLICKED,
          analyticsContext,
        )}
        onNcbiActionClick={withAnalytics(
          this.linkToNCBI,
          "PipelineSampleReport_ncbi-link_clicked",
          analyticsContext,
        )}
        fastaEnabled={fastaDownloadEnabled}
        onFastaActionClick={withAnalytics(
          this.downloadFastaUrl,
          "PipelineSampleReport_taxon-fasta-link_clicked",
          analyticsContext,
        )}
        onConsensusGenomeClick={withAnalytics(
          onConsensusGenomeClick,
          ANALYTICS_EVENT_NAMES.REPORT_TABLE_CONSENSUS_GENOME_HOVER_ACTION_CLICKED,
          analyticsContext,
        )}
        onPreviousConsensusGenomeClick={withAnalytics(
          onPreviousConsensusGenomeClick,
          ANALYTICS_EVENT_NAMES.REPORT_TABLE_PREVIOUS_CONSENSUS_GENOME_HOVER_ACTION_CLICKED,
          analyticsContext,
        )}
        previousConsensusGenomeRuns={previousConsensusGenomeRuns}
        coverageVizEnabled={coverageVizEnabled}
        onCoverageVizClick={withAnalytics(
          this.handleCoverageVizClick,
          "PipelineSampleReport_coverage-viz-link_clicked",
          analyticsContext,
        )}
        contigVizEnabled={contigVizEnabled}
        onContigVizClick={withAnalytics(
          this.downloadContigUrl,
          "PipelineSampleReport_contig-download-link_clicked",
          analyticsContext,
        )}
        phyloTreeEnabled={phyloTreeEnabled}
        onPhyloTreeModalOpened={withAnalytics(
          this.handlePhyloTreeModalOpen,
          "PipelineSampleReport_phylotree-link_clicked",
          analyticsContext,
        )}
        percentIdentity={percentIdentity}
        pipelineVersion={pipelineVersion}
        snapshotShareId={snapshotShareId}
        consensusGenomeEnabled={consensusGenomeEnabled}
        sampleId={sampleId}
      />
    );
  };

  rowRenderer = rowProps => {
    const data = rowProps.rowData;
    if (data) {
      rowProps.className = cx(
        rowProps.className,
        cs[`${data.taxLevel}Row`],
        (data.highlighted || data.highlightedChildren) && cs.highlighted,
      );
    }
    return defaultTableRowRenderer(rowProps);
  };

  getCountTypeValuesFromDataRow({
    rowData,
    field,
    defaultValue,
    countTypes = ["nt", "nr"],
  }) {
    return reduce(
      (result, countType) => {
        result.push(getOr(defaultValue, [countType, field], rowData));
        return result;
      },
      [],
      countTypes,
    );
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
            ? getOr(nullValue, [TAX_LEVEL_GENUS].concat(path), rowData)
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
      data,
    );
  };

  nestedNtNrSortFunction = ({ path, ...props }) => {
    const { dbType } = this.state;
    return this.nestedSortFunction({ path: [dbType].concat(path), ...props });
  };

  handleColumnSort = ({ sortBy, sortDirection }) => {
    logAnalyticsEvent(
      ANALYTICS_EVENT_NAMES.REPORT_TABLE_COLUMN_SORT_ARROW_CLICKED,
      {
        sortBy,
        sortDirection,
      },
    );
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
    const { data, displayMergedNtNrValue } = this.props;
    const { expandedGenusIds } = this.state;

    // flatten data for consumption of react virtualized table
    // removes collapsed rows
    const tableRows = [];
    data.forEach(genusData => {
      if (displayMergedNtNrValue && !genusData["merged_nt_nr"]) {
        // skip lines without merged counts
        return;
      }

      tableRows.push(genusData);

      if (expandedGenusIds.has(genusData.taxId)) {
        genusData.filteredSpecies.forEach(speciesData => {
          if (displayMergedNtNrValue && !speciesData["merged_nt_nr"]) {
            // skip lines without merged counts
            return;
          }

          // Add a pointer to the genus data for sorting purposes
          speciesData.genus = genusData;
          tableRows.push(speciesData);
        });
      }
    });
    return tableRows;
  };

  render = () => {
    const {
      displayMergedNtNrValue,
      displayNoBackground,
      projectId,
      projectName,
      rowHeight,
    } = this.props;
    const { phyloTreeModalParams } = this.state;
    return (
      <>
        <Table
          cellClassName={cs.cell}
          columns={this.columns}
          data={this.getTableRows()}
          defaultRowHeight={rowHeight}
          defaultSortBy={
            displayNoBackground || displayMergedNtNrValue ? "rpm" : "agg_score"
          }
          defaultSortDirection={SortDirection.DESC}
          headerClassName={cs.header}
          onColumnSort={this.handleColumnSort}
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
      </>
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
  displayMergedNtNrValue: PropTypes.bool,
  displayNoBackground: PropTypes.bool,
  initialDbType: PropTypes.oneOf(["nt", "nr", "merged_nt_nr"]),
  onTaxonNameClick: PropTypes.func,
  rowHeight: PropTypes.number,

  // Needed only for hover actions
  // Consider adding a callback to render the hover actions
  alignVizAvailable: PropTypes.bool.isRequired,
  consensusGenomeData: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.object)),
  consensusGenomeEnabled: PropTypes.bool.isRequired,
  fastaDownloadEnabled: PropTypes.bool.isRequired,
  onBlastClick: PropTypes.func.isRequired,
  onConsensusGenomeClick: PropTypes.func.isRequired,
  onCoverageVizClick: PropTypes.func.isRequired,
  onPreviousConsensusGenomeClick: PropTypes.func.isRequired,
  phyloTreeAllowed: PropTypes.bool.isRequired,
  pipelineVersion: PropTypes.string,
  projectId: PropTypes.number,
  projectName: PropTypes.string,
  sampleId: PropTypes.number,
  snapshotShareId: PropTypes.string,
};

ReportTable.contextType = UserContext;

export default ReportTable;
