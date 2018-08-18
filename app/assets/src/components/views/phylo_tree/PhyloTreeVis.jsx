import React from "react";
import Tree from "../../utils/structures/Tree";
import Dendogram from "../../visualizations/dendrogram/Dendogram";
import PropTypes from "prop-types";

class PhyloTreeVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      newick: props.newick
    };

    this.tree = Tree.fromNewickString(props.newick);
    this.treeVis = null;
  }

  componentWillReceiveProps(newProps) {
    if (newProps.newick != this.props.newick) {
      this.setState({ newick: newProps.newick });
      this.tree = Tree.fromNewickString(newProps.newick);
    }
  }

  componentDidMount() {
    this.treeVis = new Dendogram(this.treeContainer, this.tree);
    this.treeVis.update();
  }

  componentDidUpdate() {
    this.treeVis.setTree(this.tree);
    this.treeVis.update();
  }

  render() {
    return (
      <div
        className="phylo-tree-vis"
        ref={container => {
          this.treeContainer = container;
        }}
      />
    );
  }
}

PhyloTreeVis.propType = {
  newick: PropTypes.string
};

export default PhyloTreeVis;
