// These are the buttons that appear on a Report table row when hovered.
import cx from "classnames";
import { filter, pick, size } from "lodash/fp";
import React, { useContext, useState } from "react";

import { trackEvent, ANALYTICS_EVENT_NAMES } from "~/api/analytics";
// TODO(mark): Move BasicPopup into /ui.
import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import BareDropdown from "~/components/ui/controls/dropdowns/BareDropdown";
import BetaLabel from "~/components/ui/labels/BetaLabel";
import { BLAST_V1_FEATURE } from "~/components/utils/features";
import {
  isPipelineFeatureAvailable,
  COVERAGE_VIZ_FEATURE,
  CONSENSUS_GENOME_FEATURE,
  MINIMUM_VERSIONS,
} from "~/components/utils/pipeline_versions";
import PropTypes from "~/components/utils/propTypes";
import {
  IconAlignmentSmall,
  IconBlastSmall,
  IconConsensusSmall,
  IconCoverage,
  IconDownloadSmall,
  IconPhyloTreeSmall,
} from "~ui/icons";
import {
  DOWNLOAD_CONTIGS,
  DOWNLOAD_READS,
  TAX_LEVEL_GENUS,
  TAX_LEVEL_SPECIES,
  SPECIES_LEVEL_INDEX,
} from "./constants";
import cs from "./hover_actions.scss";

const HoverActions = ({
  className,
  consensusGenomeEnabled,
  contigVizEnabled,
  coverageVizEnabled,
  fastaEnabled,
  ncbiEnabled,
  onBlastClick,
  onConsensusGenomeClick,
  onContigVizClick,
  onCoverageVizClick,
  onFastaActionClick,
  onNcbiActionClick,
  onPhyloTreeModalOpened,
  onPreviousConsensusGenomeClick,
  percentIdentity,
  phyloTreeEnabled,
  pipelineVersion,
  previousConsensusGenomeRuns,
  sampleId,
  snapshotShareId,
  taxonStatsByCountType,
  taxCategory,
  taxCommonName,
  taxId,
  taxLevel,
  taxName,
  taxSpecies,
}) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};
  const [showHoverActions, setShowHoverActions] = useState(false);
  const { ntContigs, ntReads } = taxonStatsByCountType;

  const handlePhyloModalOpen = () => {
    onPhyloTreeModalOpened &&
      onPhyloTreeModalOpened({
        taxId,
        taxName,
      });
  };

  const handleConsensusGenomeClick = () => {
    onConsensusGenomeClick &&
      onConsensusGenomeClick({
        percentIdentity,
        taxId,
        taxName,
      });
  };

  const handlePreviousConsensusGenomeClick = () => {
    onPreviousConsensusGenomeClick &&
      onPreviousConsensusGenomeClick({
        percentIdentity,
        taxId,
        taxName,
      });
  };

  const handleBlastClick = () => {
    // If there are contigs, then BLAST contigs, otherwise BLAST reads.
    onBlastClick &&
      onBlastClick({
        context: {
          blastedFrom: "HoverActions",
        },
        pipelineVersion,
        sampleId,
        // shouldBlastContigs is only used by the BLAST v0 feature. It will be removed after BLAST v1 is launched
        shouldBlastContigs: ntContigs >= 0,
        taxonStatsByCountType,
        taxName,
        taxLevel,
        taxId,
      });
  };

  // Metadata for each of the hover actions.
  const getHoverActions = () => {
    const hasCoverageViz = isPipelineFeatureAvailable(
      COVERAGE_VIZ_FEATURE,
      pipelineVersion,
    );
    const hasBlastv1Feature = allowedFeatures.includes(BLAST_V1_FEATURE);
    const params = {
      pipelineVersion,
      taxCommonName: taxCommonName,
      taxId: taxId,
      taxLevel:
        taxLevel === SPECIES_LEVEL_INDEX ? TAX_LEVEL_SPECIES : TAX_LEVEL_GENUS,
      taxName: taxName,
      taxSpecies: taxSpecies,
      taxonStatsByCountType,
    };

    // Define all available icons (but don't display them)
    const HOVER_ACTIONS_VIZ = hasCoverageViz
      ? {
          key: `coverage_viz_${params.taxId}`,
          message: "Coverage Visualization",
          iconComponentClass: IconCoverage,
          handleClick: onCoverageVizClick,
          enabled: coverageVizEnabled,
          disabledMessage:
            "Coverage Visualization Not Available - requires reads in NT",
          params,
          snapshotEnabled: true,
        }
      : {
          key: `alignment_viz_${params.taxId}`,
          message: "Alignment Visualization",
          iconComponentClass: IconAlignmentSmall,
          handleClick: onCoverageVizClick,
          enabled: coverageVizEnabled,
          disabledMessage:
            "Alignment Visualization Not Available - requires reads in NT",
          params,
        };

    const HOVER_ACTIONS_BLAST_V1 = {
      key: `blast_${params.taxId}_v1`,
      message: "BLAST",
      iconComponentClass: IconBlastSmall,
      handleClick: handleBlastClick,
      enabled: true,
    };

    const HOVER_ACTIONS_BLAST = {
      key: `blast_${params.taxId}`,
      message: "BLASTN",
      iconComponentClass: IconBlastSmall,
      handleClick: handleBlastClick,
      enabled: !!ntContigs || !!ntReads,
      disabledMessage:
        "BLAST is not available - requires at least 1 contig or read in NT.",
    };

    const HOVER_ACTIONS_PHYLO = {
      key: `phylo_tree_${params.taxId}`,
      message: (
        <div>
          Phylogenetic Analysis <BetaLabel />
        </div>
      ),
      iconComponentClass: IconPhyloTreeSmall,
      handleClick: handlePhyloModalOpen,
      enabled: phyloTreeEnabled,
      disabledMessage:
        "Phylogenetic Analysis Not Available - requires 100+ reads in NT/NR",
    };

    let HOVER_ACTIONS_CONSENSUS = null;
    if (consensusGenomeEnabled) {
      if (previousConsensusGenomeRuns) {
        HOVER_ACTIONS_CONSENSUS = {
          key: `consensus_genome_${params.taxId}`,
          message: `Consensus Genome`,
          iconComponentClass: IconConsensusSmall,
          count: size(previousConsensusGenomeRuns),
          handleClick: handlePreviousConsensusGenomeClick,
          enabled: true,
        };
      } else {
        HOVER_ACTIONS_CONSENSUS = {
          key: `consensus_genome_${params.taxId}`,
          message: "Consensus Genome",
          iconComponentClass: IconConsensusSmall,
          handleClick: handleConsensusGenomeClick,
          enabled: !getConsensusGenomeError(),
          disabledMessage: getConsensusGenomeError(),
        };
      }
    }

    const HOVER_ACTIONS_DOWNLOAD = {
      key: `download_${params.taxId}`,
      message: "Download Options",
      iconComponentClass: IconDownloadSmall,
      options: [
        {
          text: "Contigs FASTA",
          value: DOWNLOAD_CONTIGS,
          disabled: !contigVizEnabled,
        },
        {
          text: "Reads FASTA",
          value: DOWNLOAD_READS,
          disabled: !fastaEnabled,
        },
      ],
      onChange: value => {
        if (value === DOWNLOAD_CONTIGS) onContigVizClick(params || {});
        else if (value === DOWNLOAD_READS) onFastaActionClick(params || {});
        else console.error("Unexpected dropdown value:", value);
      },
      enabled: contigVizEnabled || fastaEnabled,
      disabledMessage: "Downloads Not Available",
      params,
    };

    // Build up the list of hover actions
    let hoverActions = [];
    if (hasBlastv1Feature) {
      hoverActions = [
        HOVER_ACTIONS_VIZ,
        HOVER_ACTIONS_BLAST_V1,
        { divider: true },
        HOVER_ACTIONS_PHYLO,
        HOVER_ACTIONS_CONSENSUS,
        HOVER_ACTIONS_DOWNLOAD,
      ];
    } else {
      hoverActions = [
        HOVER_ACTIONS_VIZ,
        HOVER_ACTIONS_BLAST,
        { divider: true },
        HOVER_ACTIONS_PHYLO,
        HOVER_ACTIONS_CONSENSUS,
        HOVER_ACTIONS_DOWNLOAD,
      ];
    }
    // Remove null actions (could happen with HOVER_ACTIONS_CONSENSUS)
    hoverActions = hoverActions.filter(d => d !== null);

    return snapshotShareId
      ? filter("snapshotEnabled", hoverActions)
      : hoverActions;
  };

  const getConsensusGenomeError = () => {
    if (
      !isPipelineFeatureAvailable(CONSENSUS_GENOME_FEATURE, pipelineVersion)
    ) {
      return `Consensus genome pipeline not available for mNGS pipeline versions < ${MINIMUM_VERSIONS[CONSENSUS_GENOME_FEATURE]}`;
    } else if (taxCategory !== "viruses") {
      return "Consensus genome pipeline is currently available for viruses only.";
    } else if (taxLevel !== 1) {
      return "Consensus genome pipeline only available at the species level.";
    } else if (ntContigs === undefined || ntContigs <= 0) {
      return "Please select a virus with at least 1 contig that aligned to the NT database to run the consensus genome pipeline.";
    } else if (!coverageVizEnabled) {
      return "Consensus genome pipeline only available when coverage visualization is available.";
    }
  };

  // Render the hover action according to metadata.
  const renderHoverAction = hoverAction => {
    let trigger, tooltipMessage;
    const IconComponent = hoverAction.iconComponentClass;

    // Show a vertical divider
    if (hoverAction.divider) {
      return <span className={cs.divider} />;
    }

    if (hoverAction.enabled) {
      const onClickFn = () => hoverAction.handleClick(hoverAction.params || {});

      const count = hoverAction.count ? (
        <span className={cs.countCircle}>{hoverAction.count}</span>
      ) : null;

      // Support for a dropdown menu
      if (!hoverAction.options) {
        trigger = (
          <div onClick={onClickFn} className={cs.actionDot} role="none">
            <IconComponent className={cs.icon} />
            {count}
          </div>
        );
      } else {
        trigger = (
          <div onClick={onClickFn} className={cs.actionDot} role="none">
            <BareDropdown
              hideArrow
              onOpen={() => setShowHoverActions(true)}
              onClose={() => setShowHoverActions(false)}
              trigger={<IconDownloadSmall className={cs.icon} />}
              options={hoverAction.options}
              onChange={hoverAction.onChange}
            />
          </div>
        );
      }

      tooltipMessage = hoverAction.message;
    } else {
      trigger = (
        <div className={cs.actionDot}>
          <IconComponent className={cx(cs.icon, cs.disabled)} />
        </div>
      );

      tooltipMessage = hoverAction.disabledMessage;
    }

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
        trigger={React.cloneElement(trigger, {
          onMouseEnter: () => {
            const { enabled, key, params } = hoverAction;

            trackEvent(ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_HOVER_ACTION_HOVERED, {
              enabled,
              key,
              sampleId,
              ...(params
                ? pick(
                    ["taxId", "taxLevel", "taxName", "pipelineVersion"],
                    params,
                  )
                : {}),
            });
          },
        })}
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
    >
      {getHoverActions().map(renderHoverAction)}
    </span>
  );
};

HoverActions.propTypes = {
  className: PropTypes.string,
  consensusGenomeEnabled: PropTypes.bool,
  contigVizEnabled: PropTypes.bool,
  coverageVizEnabled: PropTypes.bool,
  fastaEnabled: PropTypes.bool,
  ncbiEnabled: PropTypes.bool,
  onBlastClick: PropTypes.func.isRequired,
  onConsensusGenomeClick: PropTypes.func.isRequired,
  onContigVizClick: PropTypes.func.isRequired,
  onCoverageVizClick: PropTypes.func.isRequired,
  onFastaActionClick: PropTypes.func.isRequired,
  onNcbiActionClick: PropTypes.func.isRequired,
  onPhyloTreeModalOpened: PropTypes.func,
  onPreviousConsensusGenomeClick: PropTypes.func,
  percentIdentity: PropTypes.number,
  phyloTreeEnabled: PropTypes.bool,
  pipelineVersion: PropTypes.string,
  previousConsensusGenomeRuns: PropTypes.array,
  sampleId: PropTypes.number,
  snapshotShareId: PropTypes.string,
  taxonStatsByCountType: PropTypes.object,
  taxCategory: PropTypes.string,
  taxCommonName: PropTypes.string,
  taxId: PropTypes.number,
  taxLevel: PropTypes.number,
  taxName: PropTypes.string,
  taxSpecies: PropTypes.array,
};

export default HoverActions;
