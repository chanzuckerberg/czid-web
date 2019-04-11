// These are the buttons that appear on a Report table row when hovered.
import React from "react";
import cx from "classnames";
// TODO(mark): Move BasicPopup into /ui.
import BasicPopup from "~/components/BasicPopup";
import PhyloTreeCreationModal from "~/components/views/phylo_tree/PhyloTreeCreationModal";
import BetaLabel from "~/components/ui/labels/BetaLabel";
import PropTypes from "~/components/utils/propTypes";
import { withAnalytics } from "~/api/analytics";

import cs from "./hover_actions.scss";

class HoverActions extends React.Component {
  state = {
    phyloTreeCreationModalOpen: false
  };

  handlePhyloModalOpen = () => {
    this.setState({ phyloTreeCreationModalOpen: true });
    this.onPhyloTreeModalOpened && this.onPhyloTreeModalOpened();
  };

  handlePhyloModalClose = () => {
    this.setState({ phyloTreeCreationModalOpen: false });
  };

  // Metadata for each of the hover actions.
  getHoverActions = () => [
    {
      message: "NCBI Taxonomy Browser",
      icon: "fa-link",
      handleClick: this.props.onNcbiActionClick,
      enabled: this.props.ncbiEnabled,
      disabledMessage: "NCBI Taxonomy Not Found"
    },
    {
      message: "FASTA Download",
      icon: "fa-download",
      handleClick: this.props.onFastaActionClick,
      enabled: this.props.fastaEnabled,
      disabledMessage: "FASTA Download Not Available",
      extraProps: {
        "data-tax-level": this.props.taxLevel
      }
    },
    {
      message: "Contigs Download",
      icon: "fa-puzzle-piece",
      handleClick: this.props.onContigVizClick,
      enabled: this.props.contigVizEnabled,
      disabledMessage: "No Contigs Available"
    },
    {
      message: "Alignment Visualization",
      icon: "fa-bars",
      handleClick: this.props.onAlignmentVizClick,
      enabled: this.props.alignmentVizEnabled,
      disabledMessage:
        "Alignment Visualization Not Available - requires reads in NT",
      extraProps: {
        "data-tax-level": this.props.taxLevel === 1 ? "species" : "genus"
      }
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
        "Phylogenetic Analysis Not Available - requires 100+ reads in NT/NR"
    }
  ];

  // Render the hover action according to metadata.
  renderHoverAction = hoverAction => {
    const { taxId } = this.props;
    let trigger, tooltipMessage;
    if (hoverAction.enabled) {
      trigger = (
        <i
          data-tax-id={taxId}
          onClick={hoverAction.handleClick}
          className={cx("fa", hoverAction.icon, cs.actionDot)}
          {...hoverAction.extraProps}
        />
      );
      tooltipMessage = hoverAction.message;
    } else {
      trigger = (
        <i className={cx("fa", hoverAction.icon, cs.actionDot, cs.disabled)} />
      );
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
    const {
      admin,
      csrf,
      taxId,
      taxName,
      projectId,
      projectName,
      className
    } = this.props;

    return (
      <span className={cx(cs.hoverActions, className)}>
        {this.getHoverActions().map(this.renderHoverAction)}
        {this.state.phyloTreeCreationModalOpen && (
          <PhyloTreeCreationModal
            admin={admin}
            csrf={csrf}
            taxonId={taxId}
            taxonName={taxName}
            projectId={projectId}
            projectName={projectName}
            onClose={this.handlePhyloModalClose}
          />
        )}
      </span>
    );
  }
}

HoverActions.propTypes = {
  className: PropTypes.string,
  admin: PropTypes.number,
  csrf: PropTypes.string,
  projectId: PropTypes.number,
  projectName: PropTypes.string,
  taxId: PropTypes.number,
  taxLevel: PropTypes.number,
  taxName: PropTypes.string,
  ncbiEnabled: PropTypes.bool,
  onNcbiActionClick: PropTypes.func.isRequired,
  fastaEnabled: PropTypes.bool,
  onFastaActionClick: PropTypes.func.isRequired,
  alignmentVizEnabled: PropTypes.bool,
  onAlignmentVizClick: PropTypes.func.isRequired,
  contigVizEnabled: PropTypes.bool,
  onContigVizClick: PropTypes.func.isRequired,
  phyloTreeEnabled: PropTypes.bool,
  onPhyloTreeModalOpened: PropTypes.func
};

export default HoverActions;
