// These are the buttons that appear on a Report table row when hovered.
import React from "react";
import cx from "classnames";
// TODO(mark): Move BasicPopup into /ui.
import BasicPopup from "~/components/BasicPopup";
import BetaLabel from "~/components/ui/labels/BetaLabel";
import {
  IconAlignmentSmall,
  IconBrowserSmall,
  IconContigSmall,
  IconCoverage,
  IconDownloadSmall,
  IconPhyloTreeSmall,
} from "~ui/icons";
import PropTypes from "~/components/utils/propTypes";
import { pipelineVersionHasCoverageViz } from "~/components/utils/sample";

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

  // Metadata for each of the hover actions.
  getHoverActions = () => {
    const { pipelineVersion, snapshotShareId } = this.props;
    const hasCoverageViz = pipelineVersionHasCoverageViz(pipelineVersion);

    const params = {
      pipelineVersion,
      taxCommonName: this.props.taxCommonName,
      taxId: this.props.taxId,
      taxLevel: this.props.taxLevel === 1 ? "species" : "genus",
      taxName: this.props.taxName,
      taxSpecies: this.props.taxSpecies,
    };

    const basicHoverAction = [
      {
        key: `taxonomy_browser_${params.taxId}`,
        message: "NCBI Taxonomy Browser",
        iconComponentClass: IconBrowserSmall,
        handleClick: this.props.onNcbiActionClick,
        enabled: this.props.ncbiEnabled,
        disabledMessage: "NCBI Taxonomy Not Found",
        params,
      },
    ];

    const hoverActions = [
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

    return snapshotShareId
      ? basicHoverAction
      : [...basicHoverAction, ...hoverActions];
  };

  // Render the hover action according to metadata.
  renderHoverAction = hoverAction => {
    let trigger, tooltipMessage;
    const IconComponent = hoverAction.iconComponentClass;
    if (hoverAction.enabled) {
      const onClickFn = () => hoverAction.handleClick(hoverAction.params || {});
      trigger = (
        <div onClick={onClickFn} className={cs.actionDot}>
          <IconComponent className={cs.icon} />
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
  contigVizEnabled: PropTypes.bool,
  coverageVizEnabled: PropTypes.bool,
  fastaEnabled: PropTypes.bool,
  ncbiEnabled: PropTypes.bool,
  onContigVizClick: PropTypes.func.isRequired,
  onCoverageVizClick: PropTypes.func.isRequired,
  onFastaActionClick: PropTypes.func.isRequired,
  onNcbiActionClick: PropTypes.func.isRequired,
  onPhyloTreeModalOpened: PropTypes.func,
  phyloTreeEnabled: PropTypes.bool,
  pipelineVersion: PropTypes.string,
  snapshotShareId: PropTypes.string,
  taxCommonName: PropTypes.string,
  taxId: PropTypes.number,
  taxLevel: PropTypes.number,
  taxName: PropTypes.string,
  taxSpecies: PropTypes.array,
};

export default HoverActions;
