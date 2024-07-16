import { cx } from "@emotion/css";
import { compact, map } from "lodash/fp";
import React, { useState } from "react";
import {
  defaultTableRowRenderer,
  SortDirection,
  TableRowProps,
} from "react-virtualized";
import {
  ANALYTICS_EVENT_NAMES,
  useTrackEvent,
  useWithAnalytics,
} from "~/api/analytics";
import { getCsrfToken } from "~/api/utils";
import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import { UserContext } from "~/components/common/UserContext";
import { WORKFLOW_TABS } from "~/components/utils/workflows";
import PhyloTreeCreationModal from "~/components/views/PhyloTree/PhyloTreeCreationModal";
import {
  ANNOTATION_NOT_A_HIT,
  NANOPORE_DEFAULT_COLUMN_WIDTH,
  TAX_LEVEL_SPECIES,
} from "~/components/views/SampleView/utils";
import { Table } from "~/components/visualizations/table";
import { WorkflowRun } from "~/interface/sample";
import {
  BlastData,
  ColumnProps,
  ConsensusGenomeClick,
  CurrentTabSample,
  DBType,
} from "~/interface/sampleView";
import { SampleId, Taxon } from "~/interface/shared";
import { getIlluminaColumns } from "./components/columns/illuminaColumns";
import { getNanoporeColumns } from "./components/columns/nanoporeColumns";
import { getNonNumericColumns } from "./components/columns/nonNumericColumns";
import { getSharedColumns } from "./components/columns/sharedColumns";
import cs from "./report_table.scss";

// Values for null values when sorting ascending and descending
// for strings - HACK: In theory, there can be strings larger than this
export const STRING_NULL_VALUES = ["", "zzzzzzzzz"];
export const NUMBER_NULL_VALUES = [
  Number.MIN_SAFE_INTEGER,
  Number.MAX_SAFE_INTEGER,
];
export const Z_SCORE_NULL_VALUE = -100;
export const INVALID_CALL_BASE_TAXID = -1e8;
export const TAX_LEVEL_INDICES = {
  species: 1,
  genus: 2,
};

export type PhyloTreeModalParamsType = {
  taxId: number;
  taxName: string;
};
interface ReportTableProps {
  data?: Taxon[];
  shouldDisplayNoBackground?: boolean;
  onTaxonNameClick?: (clickedTaxonData: Taxon) => void;
  rowHeight?: number;
  // Needed only for hover actions
  // Consider adding a callback to render the hover actions
  currentTab: CurrentTabSample;
  consensusGenomeData?: Record<string, (WorkflowRun | null | undefined)[]>;
  isConsensusGenomeEnabled: boolean;
  isFastaDownloadEnabled: boolean;
  isPhyloTreeAllowed: boolean;
  onAnnotationUpdate: () => void;
  onBlastClick: (params: BlastData) => void;
  onConsensusGenomeClick: (params: ConsensusGenomeClick) => void;
  onCoverageVizClick: (newCoverageVizParams: CoverageVizParamsRaw) => void;
  onPreviousConsensusGenomeClick: (params: ConsensusGenomeClick) => void;
  pipelineRunId?: number | string | null;
  pipelineVersion?: string | null;
  projectId?: string;
  projectName?: string;
  sampleId?: SampleId;
  snapshotShareId?: string;
}

export const ReportTable = ({
  data = [],
  shouldDisplayNoBackground,
  onTaxonNameClick,
  rowHeight = 54,
  currentTab,
  consensusGenomeData,
  isConsensusGenomeEnabled,
  isFastaDownloadEnabled,
  isPhyloTreeAllowed,
  onAnnotationUpdate,
  onBlastClick,
  onConsensusGenomeClick,
  onCoverageVizClick,
  onPreviousConsensusGenomeClick,
  pipelineRunId,
  pipelineVersion,
  projectId,
  projectName,
  sampleId,
  snapshotShareId,
}: ReportTableProps) => {
  const trackEvent = useTrackEvent();
  const withAnalytics = useWithAnalytics();
  const [dbType, setDbType] = useState<DBType>("nt");
  const [expandedGenusIds, setExpandedGenusIds] = useState<Set<number>>(
    new Set(),
  );
  const [isExpandAllOpened, setIsExpandAllOpened] = useState<boolean>(false);
  const [phyloTreeModalParams, setPhyloTreeModalParams] =
    useState<PhyloTreeModalParamsType | null>(null);

  const handlePhyloTreeModalClose = () => {
    setPhyloTreeModalParams(null);
  };

  const toggleExpandAllRows = () => {
    if (isExpandAllOpened) {
      setExpandedGenusIds(new Set());
      setIsExpandAllOpened(false);
    } else {
      setExpandedGenusIds(new Set(map("taxId", data)));
      setIsExpandAllOpened(true);
    }
  };

  const toggleExpandGenus = ({ taxonId }: { taxonId: number }) => {
    const newExpandedGenusIds = new Set(expandedGenusIds);
    newExpandedGenusIds.delete(taxonId) || newExpandedGenusIds.add(taxonId);

    let newIsExpandedAllOpened = isExpandAllOpened;
    if (newExpandedGenusIds.size === data.length) {
      newIsExpandedAllOpened = true;
    } else if (!newExpandedGenusIds.size) {
      newIsExpandedAllOpened = false;
    }

    setExpandedGenusIds(newExpandedGenusIds);
    setIsExpandAllOpened(newIsExpandedAllOpened);
  };

  const handleNtNrChange = (selectedDbType: "nr" | "nt") => {
    setDbType(selectedDbType);
  };

  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
  const nonNumericColumns: Array<ColumnProps> = getNonNumericColumns(
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    consensusGenomeData,
    currentTab,
    expandedGenusIds,
    onCoverageVizClick,
    isConsensusGenomeEnabled,
    isExpandAllOpened,
    isFastaDownloadEnabled,
    isPhyloTreeAllowed,
    pipelineRunId,
    pipelineVersion,
    projectId,
    sampleId,
    setPhyloTreeModalParams,
    onAnnotationUpdate,
    onBlastClick,
    onConsensusGenomeClick,
    onPreviousConsensusGenomeClick,
    toggleExpandAllRows,
    toggleExpandGenus,
    withAnalytics,
    onTaxonNameClick,
    snapshotShareId,
  );

  const illuminaColumns = getIlluminaColumns(
    dbType,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    shouldDisplayNoBackground,
    pipelineVersion,
  );

  const nanoporeColumns = getNanoporeColumns(dbType);

  const numericColumnWidth =
    currentTab === WORKFLOW_TABS.LONG_READ_MNGS
      ? NANOPORE_DEFAULT_COLUMN_WIDTH
      : 70;

  const sharedColumns = getSharedColumns(
    dbType,
    handleNtNrChange,
    numericColumnWidth,
  );

  const columns = compact(
    nonNumericColumns.concat(
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
      currentTab === WORKFLOW_TABS.SHORT_READ_MNGS && illuminaColumns,
      currentTab === WORKFLOW_TABS.LONG_READ_MNGS && nanoporeColumns,
      sharedColumns,
    ),
  );

  // Table helpers
  const rowRenderer = (rowProps: TableRowProps) => {
    const rowData = rowProps.rowData;
    const isDimmed =
      rowData.taxLevel === TAX_LEVEL_SPECIES &&
      rowData.annotation === ANNOTATION_NOT_A_HIT;
    if (data) {
      rowProps.className = cx(
        rowProps.className,
        cs[`${rowData.taxLevel}Row`],
        (rowData.highlighted || rowData.highlightedChildren) && cs.highlighted,
        isDimmed && cs.dimmed,
      );
    }
    return defaultTableRowRenderer(rowProps);
  };

  const handleColumnSort = ({
    sortBy,
    sortDirection,
  }: {
    sortBy: string;
    sortDirection: "ASC" | "DESC";
  }) => {
    trackEvent(ANALYTICS_EVENT_NAMES.REPORT_TABLE_COLUMN_SORT_ARROW_CLICKED, {
      sortBy,
      sortDirection,
    });
  };

  const getTableRows = () => {
    // flatten data for consumption of react virtualized table
    // removes collapsed rows
    const tableRows: Taxon[] = [];
    data.forEach(genusData => {
      tableRows.push(genusData);

      if (expandedGenusIds.has(genusData.taxId)) {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        genusData.filteredSpecies.forEach(speciesData => {
          // Add a pointer to the genus data for sorting purposes
          speciesData.genus = genusData;
          tableRows.push(speciesData);
        });
      }
    });
    return tableRows;
  };

  const readsPerMillionKey =
    currentTab === WORKFLOW_TABS.SHORT_READ_MNGS ? "rpm" : "bpm";

  return (
    <div className={cs.reportTable}>
      <Table
        cellClassName={cs.cell}
        columns={columns}
        data={getTableRows()}
        defaultRowHeight={rowHeight}
        defaultSortBy={
          shouldDisplayNoBackground ? readsPerMillionKey : "agg_score"
        }
        defaultSortDirection={SortDirection.DESC}
        headerClassName={cs.header}
        onColumnSort={handleColumnSort}
        rowClassName={cs.row}
        rowRenderer={rowRenderer}
        sortable={true}
      />
      {/* TODO: FE Refactor (CZID-8444) - move this to live with other SampleView modals */}
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
              onClose={handlePhyloTreeModalClose}
            />
          )}
        </UserContext.Consumer>
      )}
    </div>
  );
};
