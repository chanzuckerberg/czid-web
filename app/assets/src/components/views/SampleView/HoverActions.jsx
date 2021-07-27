// These are the buttons that appear on a Report table row when hovered.
import cx from "classnames";
import { filter, size } from "lodash/fp";
import React from "react";

// TODO(mark): Move BasicPopup into /ui.
import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import BetaLabel from "~/components/ui/labels/BetaLabel";
import {
  isPipelineFeatureAvailable,
  COVERAGE_VIZ_FEATURE,
  CONSENSUS_GENOME_FEATURE,
  MINIMUM_VERSIONS,
} from "~/components/utils/pipeline_versions";
import PropTypes from "~/components/utils/propTypes";
import {
  IconAlignmentSmall,
  IconBrowserSmall,
  IconConsensusSmall,
  IconContigSmall,
  IconCoverage,
  IconDownloadSmall,
  IconPhyloTreeSmall,
} from "~ui/icons";
import cs from "./hover_actions.scss";

class HoverActions extends React.Component {
  handlePhyloModalOpen = () => {
    const { taxId, taxName, onPhyloTreeModalOpened } = this.props;

    onPhyloTreeModalOpened &&
      onPhyloTreeModalOpened({
        taxId,
        taxName,
      });
  };

  handleConsensusGenomeClick = () => {
    const {
      percentIdentity,
      taxId,
      taxName,
      onConsensusGenomeClick,
    } = this.props;

    onConsensusGenomeClick &&
      onConsensusGenomeClick({
        percentIdentity,
        taxId,
        taxName,
      });
  };

  handlePreviousConsensusGenomeClick = () => {
    const {
      onPreviousConsensusGenomeClick,
      taxId,
      taxName,
      percentIdentity,
    } = this.props;

    onPreviousConsensusGenomeClick &&
      onPreviousConsensusGenomeClick({
        percentIdentity,
        taxId,
        taxName,
      });
  };

  // Metadata for each of the hover actions.
  getHoverActions = () => {
    const {
      consensusGenomeEnabled,
      pipelineVersion,
      previousConsensusGenomeRuns,
      snapshotShareId,
    } = this.props;
    const hasCoverageViz = isPipelineFeatureAvailable(
      COVERAGE_VIZ_FEATURE,
      pipelineVersion
    );

    const params = {
      pipelineVersion,
      taxCommonName: this.props.taxCommonName,
      taxId: this.props.taxId,
      taxLevel: this.props.taxLevel === 1 ? "species" : "genus",
      taxName: this.props.taxName,
      taxSpecies: this.props.taxSpecies,
    };

    const hoverActions = [
      {
        key: `taxonomy_browser_${params.taxId}`,
        message: "NCBI Taxonomy Browser",
        iconComponentClass: IconBrowserSmall,
        handleClick: this.props.onNcbiActionClick,
        enabled: this.props.ncbiEnabled,
        disabledMessage: "NCBI Taxonomy Not Found",
        params,
        snapshotEnabled: true,
      },
      {
        key: `fasta_download_${params.taxId}`,
        message: "FASTA Download",
        iconComponentClass: IconDownloadSmall,
        handleClick: this.props.onFastaActionClick,
        enabled: this.props.fastaEnabled,
        disabledMessage: "FASTA Download Not Available",
        params,
      },
      {
        key: `contigs_download_${params.taxId}`,
        message: "Contigs Download",
        iconComponentClass: IconContigSmall,
        handleClick: this.props.onContigVizClick,
        enabled: this.props.contigVizEnabled,
        disabledMessage: "No Contigs Available",
        params,
      },
      hasCoverageViz
        ? {
            key: `coverage_viz_${params.taxId}`,
            message: "Coverage Visualization",
            iconComponentClass: IconCoverage,
            handleClick: this.props.onCoverageVizClick,
            enabled: this.props.coverageVizEnabled,
            disabledMessage:
              "Coverage Visualization Not Available - requires reads in NT",
            params,
            snapshotEnabled: true,
          }
        : {
            key: `alignment_viz_${params.taxId}`,
            message: "Alignment Visualization",
            iconComponentClass: IconAlignmentSmall,
            handleClick: this.props.onCoverageVizClick,
            enabled: this.props.coverageVizEnabled,
            disabledMessage:
              "Alignment Visualization Not Available - requires reads in NT",
            params,
          },
      {
        key: `phylo_tree_${params.taxId}`,
        message: (
          <div>
            Phylogenetic Analysis <BetaLabel />
          </div>
        ),
        iconComponentClass: IconPhyloTreeSmall,
        handleClick: this.handlePhyloModalOpen,
        enabled: this.props.phyloTreeEnabled,
        disabledMessage:
          "Phylogenetic Analysis Not Available - requires 100+ reads in NT/NR",
      },
    ];

    if (consensusGenomeEnabled) {
      if (previousConsensusGenomeRuns) {
        hoverActions.push({
          key: `consensus_genome_${params.taxId}`,
          message: `Consensus Genome`,
          iconComponentClass: IconConsensusSmall,
          count: size(previousConsensusGenomeRuns),
          handleClick: this.handlePreviousConsensusGenomeClick,
          enabled: true,
        });
      } else {
        hoverActions.push({
          key: `consensus_genome_${params.taxId}`,
          message: "Consensus Genome",
          iconComponentClass: IconConsensusSmall,
          handleClick: this.handleConsensusGenomeClick,
          enabled: !this.getConsensusGenomeError(),
          disabledMessage: this.getConsensusGenomeError(),
        });
      }
    }

    return snapshotShareId
      ? filter("snapshotEnabled", hoverActions)
      : hoverActions;
  };

  getConsensusGenomeError = () => {
    const {
      coverageVizEnabled,
      ntContigsAvailable,
      pipelineVersion,
      taxCategory,
      taxLevel,
    } = this.props;

    if (
      !isPipelineFeatureAvailable(CONSENSUS_GENOME_FEATURE, pipelineVersion)
    ) {
      return `Consensus genome pipeline not available for mNGS pipeline versions < ${MINIMUM_VERSIONS[CONSENSUS_GENOME_FEATURE]}`;
    } else if (taxCategory !== "viruses") {
      return "Consensus genome pipeline is currently available for viruses only.";
    } else if (taxLevel !== 1) {
      return "Consensus genome pipeline only available at the species level.";
    } else if (!ntContigsAvailable) {
      return "Please select a virus with at least 1 contig that aligned to the NT database to run the consensus genome pipeline.";
    } else if (!coverageVizEnabled) {
      return "Consensus genome pipeline only available when coverage visualization is available.";
    }
  };

  // Render the hover action according to metadata.
  renderHoverAction = hoverAction => {
    let trigger, tooltipMessage;
    const IconComponent = hoverAction.iconComponentClass;

    if (hoverAction.enabled) {
      const onClickFn = () => hoverAction.handleClick(hoverAction.params || {});

      const count = hoverAction.count ? (
        <span className={cs.countCircle}>{hoverAction.count}</span>
      ) : null;

      trigger = (
        <div onClick={onClickFn} className={cs.actionDot}>
          <IconComponent className={cs.icon} />
          {count}
        </div>
      );

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
        basic={false}
        position="top center"
        key={hoverAction.key}
        trigger={trigger}
        content={tooltipMessage}
      />
    );
  };

  render() {
    const { className } = this.props;

    return (
      <span className={cx(cs.hoverActions, className)}>
        {this.getHoverActions().map(this.renderHoverAction)}
      </span>
    );
  }
}

HoverActions.propTypes = {
  className: PropTypes.string,
  consensusGenomeEnabled: PropTypes.bool,
  contigVizEnabled: PropTypes.bool,
  coverageVizEnabled: PropTypes.bool,
  fastaEnabled: PropTypes.bool,
  ncbiEnabled: PropTypes.bool,
  ntContigsAvailable: PropTypes.bool,
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
  snapshotShareId: PropTypes.string,
  taxCategory: PropTypes.string,
  taxCommonName: PropTypes.string,
  taxId: PropTypes.number,
  taxLevel: PropTypes.number,
  taxName: PropTypes.string,
  taxSpecies: PropTypes.array,
};

HoverActions.contextType = UserContext;

export default HoverActions;
