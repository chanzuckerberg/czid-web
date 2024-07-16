// These are the buttons that appear on a Report table row when hovered.
import { ButtonIcon, IconNameToSizes } from "@czi-sds/components";
import cx from "classnames";
import { filter, get, getOr, kebabCase, size } from "lodash/fp";
import React, { useState } from "react";
import { ANALYTICS_EVENT_NAMES, useWithAnalytics } from "~/api/analytics";
// TODO(mark): Move BasicPopup into /ui.
import BasicPopup from "~/components/common/BasicPopup";
import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import BareDropdown from "~/components/ui/controls/dropdowns/BareDropdown";
import BetaLabel from "~/components/ui/labels/BetaLabel";
import { getDownloadContigUrl } from "~/components/utils/download";
import {
  CONSENSUS_GENOME_FEATURE,
  COVERAGE_VIZ_FEATURE,
  isPipelineFeatureAvailable,
  MINIMUM_VERSIONS,
} from "~/components/utils/pipeline_versions";
import { WORKFLOW_TABS } from "~/components/utils/workflows";
import PhyloTreeChecks from "~/components/views/PhyloTree/PhyloTreeChecks";
import {
  DOWNLOAD_CONTIGS,
  DOWNLOAD_READS,
  GENUS_LEVEL_INDEX,
  SPECIES_LEVEL_INDEX,
  TAX_LEVEL_GENUS,
  TAX_LEVEL_SPECIES,
} from "~/components/views/SampleView/utils";
import {
  BlastData,
  ConsensusGenomeClick,
  CurrentTabSample,
} from "~/interface/sampleView";
import { SampleId, Taxon } from "~/interface/shared";
import { INVALID_CALL_BASE_TAXID } from "../../../MngsReport/components/ReportTable/ReportTable";
import cs from "./hover_actions.scss";

interface HoverActionsProps {
  className?: string;
  consensusGenomeEnabled?: boolean;
  consensusGenomeData?: Record<string, object[]>;
  currentTab: CurrentTabSample;
  fastaEnabled?: boolean;
  isPhyloTreeAllowed: boolean; // TODO: this name isn't very descriptive
  onBlastClick: (params: BlastData) => void;
  onConsensusGenomeClick: (options: ConsensusGenomeClick) => void;
  onCoverageVizClick: (newCoverageVizParams: CoverageVizParamsRaw) => void;
  onPhyloTreeModalOpened?: (options: object) => void;
  onPreviousConsensusGenomeClick?: (params: ConsensusGenomeClick) => void;
  pipelineVersion?: string;
  previousConsensusGenomeRuns?: $TSFixMeUnknown[];
  projectId?: number;
  rowData: Taxon;
  sampleId?: SampleId;
  snapshotShareId?: string;
}

export const HoverActions = ({
  className,
  consensusGenomeEnabled,
  currentTab,
  fastaEnabled,
  isPhyloTreeAllowed,
  onBlastClick,
  onConsensusGenomeClick,
  onCoverageVizClick,
  onPhyloTreeModalOpened,
  onPreviousConsensusGenomeClick,
  pipelineVersion,
  previousConsensusGenomeRuns,
  projectId,
  rowData,
  sampleId,
  snapshotShareId,
}: HoverActionsProps) => {
  const withAnalytics = useWithAnalytics();
  const [showHoverActions, setShowHoverActions] = useState(false);

  const {
    taxId: taxonId,
    taxLevel: taxonLevel,
    name: taxonName,
    common_name: taxonCommonName,
    species: taxonSpecies,
    category: taxonCategory,
  } = rowData;

  const taxonLevelIndex =
    taxonLevel === TAX_LEVEL_SPECIES ? SPECIES_LEVEL_INDEX : GENUS_LEVEL_INDEX;

  const validTaxonId = taxonId < INVALID_CALL_BASE_TAXID || taxonId > 0;
  const contigVizEnabled = !!(
    (get("nt.contigs", rowData) || get("nr.contigs", rowData)) // TODO: use optional chaining and update NT/NR types
  );
  const coverageVizEnabled =
    currentTab === WORKFLOW_TABS.LONG_READ_MNGS ||
    (validTaxonId && getOr(0, "nt.count", rowData) > 0);
  const phyloTreeEnabled =
    isPhyloTreeAllowed &&
    taxonId > 0 &&
    PhyloTreeChecks.passesCreateCondition(
      getOr(0, "nt.count", rowData),
      getOr(0, "nr.count", rowData),
    );
  const percentIdentity = get("nt.percent_identity", rowData);
  const taxonStatsByCountType = {
    ntContigs: get("nt.contigs", rowData),
    ntReads: get("nt.count", rowData),
    nrContigs: get("nr.contigs", rowData),
    nrReads: get("nr.count", rowData),
  };
  const { ntContigs } = taxonStatsByCountType;

  const analyticsContext = {
    projectId: projectId,
    sampleId: sampleId,
    taxId: taxonId,
    taxLevel: rowData.taxLevel,
    taxName: rowData.name,
  };

  const handlePhyloModalOpen = withAnalytics(
    () =>
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
      onPhyloTreeModalOpened({
        taxId: taxonId,
        taxName: taxonName,
      }),
    ANALYTICS_EVENT_NAMES.PIPELINE_SAMPLE_REPORT_PHYLOTREE_LINK_CLICKED,
    analyticsContext,
  );

  const handleConsensusGenomeClick = withAnalytics(
    () =>
      onConsensusGenomeClick({
        percentIdentity,
        taxId: taxonId,
        taxName: taxonName,
      }),
    ANALYTICS_EVENT_NAMES.REPORT_TABLE_CONSENSUS_GENOME_HOVER_ACTION_CLICKED,
    analyticsContext,
  );

  const handlePreviousConsensusGenomeClick = () =>
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
    onPreviousConsensusGenomeClick({
      percentIdentity,
      taxId: taxonId,
      taxName: taxonName,
    });

  // If there are contigs, then BLAST contigs, otherwise BLAST reads.
  const handleBlastClick = withAnalytics(
    () =>
      onBlastClick({
        context: {
          blastedFrom: "HoverActions",
        },
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        pipelineVersion,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        sampleId,
        // shouldBlastContigs is only used by the BLAST v0 feature. It will be removed after BLAST v1 is launched
        shouldBlastContigs: ntContigs >= 0,
        taxonStatsByCountType,
        taxName: taxonName,
        taxLevel: taxonLevelIndex,
        taxId: taxonId,
      }),
    ANALYTICS_EVENT_NAMES.REPORT_TABLE_BLAST_BUTTON_HOVER_ACTION_CLICKED,
    analyticsContext,
  );

  const params = {
    pipelineVersion,
    taxCommonName: taxonCommonName,
    taxId: taxonId,
    taxLevel:
      taxonLevelIndex === SPECIES_LEVEL_INDEX
        ? TAX_LEVEL_SPECIES
        : TAX_LEVEL_GENUS,
    taxName: taxonName,
    taxSpecies: taxonSpecies,
    taxonStatsByCountType,
  };

  const downloadFastaByUrl = () => {
    if (!taxonLevelIndex) {
      // eslint-disable-next-line no-console
      console.error("Unknown taxLevel:", taxonLevelIndex);
      return;
    }
    location.href = `/samples/${sampleId}/fasta/${taxonLevelIndex}/${taxonId}/NT_or_NR?pipeline_version=${pipelineVersion}`;
  };

  const openCoverageViz = () => {
    onCoverageVizClick({
      taxId: taxonId,
      taxName: taxonName,
      taxCommonName: taxonCommonName,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      taxLevel: taxonLevel,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      taxSpecies: taxonSpecies,
      taxonStatsByCountType,
    });
  };

  const handleCoverageVizClick = withAnalytics(
    openCoverageViz,
    ANALYTICS_EVENT_NAMES.PIPELINE_SAMPLE_REPORT_COVERAGE_VIZ_LINK_CLICKED,
    analyticsContext,
  );

  const downloadContigByUrl = () => {
    location.href = getDownloadContigUrl({
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      pipelineVersion,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      sampleId,
      taxId: taxonId,
    });
  };

  const handleContigVizClick = withAnalytics(
    downloadContigByUrl,
    ANALYTICS_EVENT_NAMES.PIPELINE_SAMPLE_REPORT_CONTIG_DOWNLOAD_LINK_CLICKED,
    analyticsContext,
  );

  // Metadata for each of the hover actions.
  const getHoverActions = () => {
    const hasCoverageViz =
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      isPipelineFeatureAvailable(COVERAGE_VIZ_FEATURE, pipelineVersion) ||
      currentTab === WORKFLOW_TABS.LONG_READ_MNGS;

    // Define all available icons (but don't display them)
    const HOVER_ACTIONS_VIZ = hasCoverageViz
      ? {
          key: `coverage_viz_${params.taxId}`,
          message: "Coverage Visualization",
          iconName: "barChartVertical4",
          handleClick: handleCoverageVizClick,
          enabled: coverageVizEnabled,
          disabledMessage:
            "Coverage Visualization Not Available - requires reads in NT",
          params,
          snapshotEnabled: true,
        }
      : null;

    const HOVER_ACTIONS_BLAST = {
      key: `blast_${params.taxId}_v1`,
      message: "BLAST",
      iconName: "searchLinesHorizontal",
      handleClick: handleBlastClick,
      enabled: true,
    };

    const HOVER_ACTIONS_PHYLO = {
      key: `phylo_tree_${params.taxId}`,
      message: (
        <div>
          Phylogenetic Analysis <BetaLabel />
        </div>
      ),
      iconName: "treeHorizontal",
      handleClick: handlePhyloModalOpen,
      enabled: phyloTreeEnabled,
      disabledMessage:
        "Phylogenetic Analysis Not Available - requires 100+ reads in NT/NR",
    };

    let HOVER_ACTIONS_CONSENSUS = null;
    if (consensusGenomeEnabled) {
      if (previousConsensusGenomeRuns) {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        HOVER_ACTIONS_CONSENSUS = {
          key: `consensus_genome_${params.taxId}`,
          message: `Consensus Genome`,
          iconName: "linesDashed3Solid1",
          count: size(previousConsensusGenomeRuns),
          handleClick: handlePreviousConsensusGenomeClick,
          enabled: true,
        };
      } else {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        HOVER_ACTIONS_CONSENSUS = {
          key: `consensus_genome_${params.taxId}`,
          message: "Consensus Genome",
          iconName: "linesDashed3Solid1",
          handleClick: handleConsensusGenomeClick,
          enabled: !getConsensusGenomeError(),
          disabledMessage: getConsensusGenomeError(),
        };
      }
    }

    const HOVER_ACTIONS_DOWNLOAD = {
      key: `download_${params.taxId}`,
      message: "Download Options",
      iconName: "download",
      options: [
        {
          text: "Contigs (.fasta)",
          value: DOWNLOAD_CONTIGS,
          disabled: !contigVizEnabled,
        },
        {
          text: "Reads (.fasta)",
          value: DOWNLOAD_READS,
          disabled: !fastaEnabled,
        },
      ],
      onChange: (value: typeof DOWNLOAD_CONTIGS | typeof DOWNLOAD_READS) => {
        if (value === DOWNLOAD_CONTIGS) handleContigVizClick();
        else if (value === DOWNLOAD_READS) downloadFastaByUrl();
        else console.error("Unexpected dropdown value:", value);
      },
      enabled: contigVizEnabled || fastaEnabled,
      disabledMessage: "Downloads Not Available",
      params,
    };

    // TODO: (FE Refactor): This should probably be configured in a wrapper component and passed as a prop
    // Build up the list of hover actions
    let hoverActions = [];
    if (currentTab === WORKFLOW_TABS.LONG_READ_MNGS) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      hoverActions = [HOVER_ACTIONS_VIZ, HOVER_ACTIONS_DOWNLOAD];
    } else {
      hoverActions = [
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        HOVER_ACTIONS_VIZ,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        HOVER_ACTIONS_BLAST,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        { divider: true },
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        HOVER_ACTIONS_PHYLO,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        HOVER_ACTIONS_CONSENSUS,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        HOVER_ACTIONS_DOWNLOAD,
      ];
    }
    // Remove null actions
    hoverActions = hoverActions.filter(d => d !== null);

    return snapshotShareId
      ? filter("snapshotEnabled", hoverActions)
      : hoverActions;
  };

  const getConsensusGenomeError = () => {
    if (
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      !isPipelineFeatureAvailable(CONSENSUS_GENOME_FEATURE, pipelineVersion)
    ) {
      return `Consensus genome pipeline not available for mNGS pipeline versions < ${MINIMUM_VERSIONS[CONSENSUS_GENOME_FEATURE]}`;
    } else if (taxonCategory !== "viruses") {
      return "Consensus genome pipeline is currently available for viruses only.";
    } else if (taxonLevelIndex !== 1) {
      return "Consensus genome pipeline only available at the species level.";
    } else if (ntContigs === undefined || ntContigs <= 0) {
      return "Please select a virus with at least 1 contig that aligned to the NT database to run the consensus genome pipeline.";
    } else if (!coverageVizEnabled) {
      return "Consensus genome pipeline only available when coverage visualization is available.";
    }
  };

  // TODO: move this to its own component
  // Render the hover action according to metadata.
  const renderHoverAction = (hoverAction: {
    key: string;
    iconName: keyof IconNameToSizes;
    divider: boolean;
    enabled: boolean;
    handleClick: $TSFixMeFunction;
    params: object;
    count: number;
    options?: {
      text: string;
      value: string;
      disabled: boolean;
    }[];
    onChange: $TSFixMeFunction;
    message: string;
    disabledMessage: string;
  }) => {
    // Show a vertical divider
    if (hoverAction.divider) return <span className={cs.divider} />;

    const count = hoverAction.count ? (
      <span className={cs.countCircle}>{hoverAction.count}</span>
    ) : null;

    const onClickFunction = !hoverAction.handleClick
      ? null
      : () => hoverAction.handleClick(hoverAction.params || {});

    const buttonIconComponent = (
      <div className={cs.actionDot} role="none">
        <ButtonIcon
          sdsSize="small"
          sdsType="primary"
          sdsIcon={hoverAction.iconName}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          onClick={onClickFunction}
          disabled={!hoverAction.enabled}
          data-testid={`hover-action-${kebabCase(hoverAction.key)}`}
        />
        {count}
      </div>
    );

    // If the hoverActions contains options, display these options in a dropdown menu.
    const trigger = hoverAction.options ? (
      <BareDropdown
        hideArrow
        onOpen={() => setShowHoverActions(true)}
        onClose={() => setShowHoverActions(false)}
        trigger={buttonIconComponent}
        options={hoverAction.options}
        onChange={hoverAction.onChange}
      />
    ) : (
      buttonIconComponent
    );

    const tooltipMessage = hoverAction.enabled
      ? hoverAction.message
      : hoverAction.disabledMessage;

    return (
      <BasicPopup
        className={cx(
          cs.hoverActionPopup,
          hoverAction.enabled ? cs.actionEnabled : cs.actionDisabled,
        )}
        basic={false}
        inverted={hoverAction.enabled}
        position="top center"
        key={hoverAction.key}
        trigger={React.cloneElement(trigger)}
        content={tooltipMessage}
      />
    );
  };

  // If the user clicks the download icon while hovering on a row, we want to
  // make sure the resulting dropdown is still visible even if the user has to
  // move away from the row in order to reach the dropdown--this happens when
  // opening a dropdown on the last row of a table.
  return (
    <span
      className={cx(
        cs.hoverActions,
        showHoverActions ? cs.hoverActionsDropdown : className,
      )}
      data-testid="hover-actions"
    >
      {getHoverActions().map((hoverAction, key) => (
        <span key={key}>{renderHoverAction(hoverAction)}</span>
      ))}
    </span>
  );
};
