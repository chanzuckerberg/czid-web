import React from "react";
import Tree from "../../utils/structures/Tree";
import Dendogram from "../../visualizations/dendrogram/Dendogram";
import PropTypes from "prop-types";

class PhyloTreeVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      newick: props.newick,
      tree: Tree.fromNewickString(props.newick, props.nodeData)
    };

    this.treeVis = null;
  }

  componentWillReceiveProps(newProps) {
    if (newProps.newick !== this.props.newick) {
      this.setState({
        newick: newProps.newick,
        tree: Tree.fromNewickString(newProps.newick, newProps.nodeData)
      });
    }
  }

  componentDidMount() {
    this.treeVis = new Dendogram(this.treeContainer);
    this.treeVis.setTree(this.state.tree);
    this.treeVis.update();
  }

  componentDidUpdate() {
    this.treeVis.setTree(this.state.tree);
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
  newick: PropTypes.string,
  nodeData: PropTypes.object
};

export default PhyloTreeVis;
