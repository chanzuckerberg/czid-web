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

    return [
      {
        message: "NCBI Taxonomy Browser",
        icon: "fa-link",
        handleClick: this.props.onNcbiActionClick,
        enabled: this.props.ncbiEnabled,
        disabledMessage: "NCBI Taxonomy Not Found",
        params: {
          taxId: this.props.taxId,
        },
      },
      {
        message: "FASTA Download",
        icon: "fa-download",
        handleClick: this.props.onFastaActionClick,
        enabled: this.props.fastaEnabled,
        disabledMessage: "FASTA Download Not Available",
        params: {
          taxId: this.props.taxId,
          taxLevel: this.props.taxLevel,
        },
      },
      {
        message: "Contigs Download",
        icon: "fa-puzzle-piece",
        handleClick: this.props.onContigVizClick,
        enabled: this.props.contigVizEnabled,
        disabledMessage: "No Contigs Available",
        params: {
          taxId: this.props.taxId,
        },
      },
      hasCoverageViz
        ? {
            message: "Coverage Visualization",
            iconComponentClass: CoverageIcon,
            handleClick: this.props.onCoverageVizClick,
            enabled: this.props.coverageVizEnabled,
            disabledMessage:
              "Coverage Visualization Not Available - requires reads in NT",
            params: {
              taxId: this.props.taxId,
              taxLevel: this.props.taxLevel === 1 ? "species" : "genus",
              taxName: this.props.taxName,
              taxCommonName: this.props.taxCommonName,
            },
          }
        : {
            message: "Alignment Visualization",
            icon: "fa-bars",
            handleClick: this.props.onCoverageVizClick,
            enabled: this.props.coverageVizEnabled,
            disabledMessage:
              "Alignment Visualization Not Available - requires reads in NT",
            params: {
              taxId: this.props.taxId,
              taxLevel: this.props.taxLevel === 1 ? "species" : "genus",
              taxName: this.props.taxName,
            },
          },
      {
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
        key={hoverAction.icon}
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
  taxId: PropTypes.number,
  taxLevel: PropTypes.number,
  taxName: PropTypes.string,
  taxCommonName: PropTypes.string,
  ncbiEnabled: PropTypes.bool,
  onNcbiActionClick: PropTypes.func.isRequired,
  fastaEnabled: PropTypes.bool,
  onFastaActionClick: PropTypes.func.isRequired,
  coverageVizEnabled: PropTypes.bool,
  onCoverageVizClick: PropTypes.func.isRequired,
  contigVizEnabled: PropTypes.bool,
  onContigVizClick: PropTypes.func.isRequired,
  phyloTreeEnabled: PropTypes.bool,
  onPhyloTreeModalOpened: PropTypes.func,
  pipelineVersion: PropTypes.string,
};

export default HoverActions;
