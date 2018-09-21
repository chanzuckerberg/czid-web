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
    this.treeVis = new Dendogram(this.treeContainer, null, {
      colorGroupAttribute: "project_id"
    });
    this.treeVis.setTree(
      Tree.fromNewickString(this.props.newick, this.props.nodeData)
    );
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
