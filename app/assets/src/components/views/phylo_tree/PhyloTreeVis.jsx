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

    this.treeVis = null;
  }

  static getDerivedStateFromProps(props, state) {
    if (props.newick !== state.newick || props.nodeData !== state.nodeData) {
      return {
        newick: props.newick,
        props: props.nodeData
      };
    }
  }

  componentDidMount() {
    let tree = Tree.fromNewickString(this.props.newick, this.props.nodeData);
    this.treeVis = new Dendogram(this.treeContainer, tree, {
      colormapName: "viridis",
      colorGroupAttribute: "project_name",
      colorGroupLegendTitle: "Project Name",
      // Name for the legend when the attribute is missing / other
      colorGroupAbsentName: "NCBI References",
      legendX: 900,
      legendY: 50
    });
    this.treeVis.update();
  }

  componentDidUpdate() {
    this.treeVis.setTree(
      Tree.fromNewickString(this.props.newick, this.props.nodeData)
    );
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

PhyloTreeVis.propTypes = {
  newick: PropTypes.string,
  nodeData: PropTypes.object
};

export default PhyloTreeVis;
