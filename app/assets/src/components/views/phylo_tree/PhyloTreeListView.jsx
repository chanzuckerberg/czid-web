import React from "react";
import Divider from "../../layout/Divider";
import Dropdown from "../../ui/controls/dropdowns/Dropdown";
import FilterRow from "../../layout/FilterRow";
import PhyloTreeVis from "./PhyloTreeVis";
import PropTypes from "prop-types";
import ViewHeader from "../../layout/ViewHeader";

class PhyloTreeListView extends React.Component {
  constructor(props) {
    super(props);

    this.phyloTreeMap = new Map(props.phyloTrees.map(tree => [tree.id, tree]));

    this.state = {
      selectedPhyloTreeId: props.phyloTrees ? props.phyloTrees[0].id : null
    };

    this.handleTreeChange = this.handleTreeChange.bind(this);
  }

  handleTreeChange(_, newPhyloTreeId) {
    this.setState({
      selectedPhyloTreeId: newPhyloTreeId.value
    });
  }

  render() {
    return (
      <div className="phylo-tree-list-view">
        <div className="phylo-tree-list-view__narrow-container">
          <ViewHeader title="Phylogenetic Trees" />
        </div>
        <Divider />
        <div className="phylo-tree-list-view__narrow-container">
          <FilterRow>
            <Dropdown
              label="Tree: "
              onChange={this.handleTreeChange}
              options={this.props.phyloTrees.map(tree => ({
                value: tree.id,
                text: tree.name
              }))}
              value={this.state.selectedPhyloTreeId}
            />
          </FilterRow>
        </div>
        <Divider />
        <div className="phylo-tree-list-view__narrow-container">
          {this.phyloTreeMap.get(this.state.selectedPhyloTreeId).newick ? (
            <PhyloTreeVis
              newick={
                this.phyloTreeMap.get(this.state.selectedPhyloTreeId).newick
              }
            />
          ) : (
            <p className="phylo-tree-list-view__no-tree-banner">
              Tree not available
            </p>
          )}
        </div>
      </div>
    );
  }
}

PhyloTreeListView.propTypes = {
  phyloTrees: PropTypes.array
};

export default PhyloTreeListView;
