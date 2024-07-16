import { WithAnalyticsType } from "~/api/analytics";
import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import cs from "~/components/views/SampleView/components/MngsReport/components/ReportTable/report_table.scss";
import {
  BlastData,
  ConsensusGenomeClick,
  CurrentTabSample,
  SortFunctionsParams,
} from "~/interface/sampleView";
import { SampleId, Taxon } from "~/interface/shared";
import {
  PhyloTreeModalParamsType,
  STRING_NULL_VALUES,
} from "../../ReportTable";
import { getExpandIconHeaderRenderer } from "./renderers/expandIconHeaderRenderer";
import { getExpandIconRenderer } from "./renderers/expandIconRenderer";
import { getNameRenderer } from "./renderers/nameRenderer";
import { nestedSortFunction } from "./utils";

export const getNonNumericColumns = (
  consensusGenomeData: Record<string, object[]>,
  currentTab: CurrentTabSample,
  expandedGenusIds: Set<number>,
  onCoverageVizClick: (newCoverageVizParams: CoverageVizParamsRaw) => void,
  isConsensusGenomeEnabled: boolean,
  isExpandAllOpened: boolean,
  isFastaDownloadEnabled: boolean,
  isPhyloTreeAllowed: boolean,
  pipelineRunId: number | string | null,
  pipelineVersion: string,
  projectId: string,
  sampleId: SampleId,
  handlePhyloTreeModalOpen: (
    phyloTreeModalParams: PhyloTreeModalParamsType,
  ) => void,
  onAnnotationUpdate: () => void,
  onBlastClick: (params: BlastData) => void,
  onConsensusGenomeClick: (options: ConsensusGenomeClick) => void,
  onPreviousConsensusGenomeClick: (params: ConsensusGenomeClick) => void,
  toggleExpandAll: () => void,
  toggleExpandGenus: ({ taxonId }: { taxonId: number }) => void,
  withAnalytics: WithAnalyticsType,
  onTaxonNameClick?: (clickedTaxonData: Taxon) => void,
  snapshotShareId?: string,
) => {
  return [
    {
      cellRenderer: getExpandIconRenderer(
        // TODO: does not update icon on click
        expandedGenusIds,
        toggleExpandGenus,
        withAnalytics,
      ),
      className: cs.expandHeader,
      dataKey: "expanded",
      disableSort: true,
      headerClassName: cs.expandCell,
      headerRenderer: getExpandIconHeaderRenderer(
        // TODO: does not update icon on click
        isExpandAllOpened,
        toggleExpandAll,
        withAnalytics,
      ),
      width: 20,
    },
    {
      cellRenderer: getNameRenderer(
        consensusGenomeData,
        currentTab,
        onCoverageVizClick,
        isConsensusGenomeEnabled,
        isFastaDownloadEnabled,
        isPhyloTreeAllowed,
        pipelineVersion,
        pipelineRunId,
        projectId,
        sampleId,
        handlePhyloTreeModalOpen,
        onAnnotationUpdate,
        onBlastClick,
        onConsensusGenomeClick,
        onPreviousConsensusGenomeClick,
        onTaxonNameClick,
        snapshotShareId,
      ),
      className: cs.nameCell,
      dataKey: "displayName",
      flexGrow: 1,
      headerClassName: cs.taxonHeader,
      label: "Taxon",
      minWidth: 300,
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedSortFunction({
          data,
          sortDirection,
          path: ["displayName"],
          nullValue: "",
          limits: STRING_NULL_VALUES,
        }),
    },
  ];
};
