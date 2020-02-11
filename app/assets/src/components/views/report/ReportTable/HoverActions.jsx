// These are the buttons that appear on a Report table row when hovered.
import React from "react";
import cx from "classnames";
// TODO(mark): Move BasicPopup into /ui.
import BasicPopup from "~/components/BasicPopup";
import BetaLabel from "~/components/ui/labels/BetaLabel";
import CoverageIcon from "~ui/icons/CoverageIcon";
import PropTypes from "~/components/utils/propTypes";
import { pipelineVersionHasCoverageViz } from "~/components/utils/sample";

import cs from "./hover_actions.scss";

const NCOV_PUBLIC_SITE = true;

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
    const { pipelineVersion } = this.props;
    const hasCoverageViz = pipelineVersionHasCoverageViz(pipelineVersion);

    const params = {
      pipelineVersion,
      taxCommonName: this.props.taxCommonName,
      taxId: this.props.taxId,
      taxLevel: this.props.taxLevel === 1 ? "species" : "genus",
      taxName: this.props.taxName,
      taxSpecies: this.props.taxSpecies,
    };

    return [
      {
        key: `taxonomy_browser_${params.taxId}`,
        message: "NCBI Taxonomy Browser",
        icon: "fa-link",
        handleClick: this.props.onNcbiActionClick,
        enabled: this.props.ncbiEnabled,
        disabledMessage: "NCBI Taxonomy Not Found",
        params,
      },
      {
        key: `fasta_download_${params.taxId}`,
        message: "FASTA Download",
        icon: "fa-download",
        handleClick: this.props.onFastaActionClick,
        enabled: this.props.fastaEnabled,
        disabledMessage: "FASTA Download Not Available",
        params,
      },
      {
        key: `contigs_download_${params.taxId}`,
        message: "Contigs Download",
        icon: "fa-puzzle-piece",
        handleClick: this.props.onContigVizClick,
        enabled: this.props.contigVizEnabled,
        disabledMessage: "No Contigs Available",
        params,
      },
      hasCoverageViz
        ? {
            key: `coverage_viz_${params.taxId}`,
            message: "Coverage Visualization",
            iconComponentClass: CoverageIcon,
            handleClick: this.props.onCoverageVizClick,
            enabled: this.props.coverageVizEnabled,
            disabledMessage:
              "Coverage Visualization Not Available - requires reads in NT",
            params,
          }
        : {
            key: `alignment_viz_${params.taxId}`,
            message: "Alignment Visualization",
            icon: "fa-bars",
            handleClick: this.props.onCoverageVizClick,
            enabled: this.props.coverageVizEnabled,
            disabledMessage:
              "Alignment Visualization Not Available - requires reads in NT",
            params,
          },
      ...(!NCOV_PUBLIC_SITE
        ? [
            {
              key: `phylo_tree_${params.taxId}`,
              message: (
                <div>
                  Phylogenetic Analysis <BetaLabel />
                </div>
              ),
              icon: "fa-code-fork",
              handleClick: this.handlePhyloModalOpen,
              enabled: this.props.phyloTreeEnabled,
              disabledMessage:
                "Phylogenetic Analysis Not Available - requires 100+ reads in NT/NR",
            },
          ]
        : []),
    ];
  };

  // Render the hover action according to metadata.
  renderHoverAction = hoverAction => {
    let trigger, tooltipMessage;
    const IconComponent = hoverAction.iconComponentClass;
    if (hoverAction.enabled) {
      const onClickFn = () => hoverAction.handleClick(hoverAction.params || {});
      if (IconComponent) {
        trigger = (
          <div onClick={onClickFn} className={cs.actionDot}>
            <IconComponent className={cs.icon} />
          </div>
        );
      } else {
        trigger = (
          <i
            onClick={onClickFn}
            className={cx("fa", hoverAction.icon, cs.actionDot)}
          />
        );
      }
      tooltipMessage = hoverAction.message;
    } else {
      if (IconComponent) {
        trigger = (
          <div className={cs.actionDot}>
            <IconComponent className={cx(cs.icon, cs.disabled)} />
          </div>
        );
      } else {
        trigger = (
          <i
            className={cx("fa", hoverAction.icon, cs.actionDot, cs.disabled)}
          />
        );
      }

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
  taxCommonName: PropTypes.string,
  taxId: PropTypes.number,
  taxLevel: PropTypes.number,
  taxName: PropTypes.string,
  taxSpecies: PropTypes.array,
};

export default HoverActions;
