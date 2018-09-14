import axios from "axios";
import d3 from "d3";
import React from "react";
import PrimaryButton from "../../ui/controls/buttons/PrimaryButton";

class PhyloTreeViz extends React.Component {
  constructor(props) {
    super();
    this.csrf = props.csrf;
    this.phyloTree = props.phyloTree;
    this.createTreeViz = this.createTreeViz.bind(this);
    this.state = {
      show_retry_button: props.canEdit && this.phyloTree.status == 2,
      retry_message: ""
    };
    this.retryTree = this.retryTree.bind(this);
  }

  componentDidMount() {
    this.createTreeViz();
  }

  createTreeViz() {
    if (this.phyloTree && this.phyloTree.newick) {
      let newick = this.phyloTree.newick;
      // below from http://bl.ocks.org/spond/f6b51aa6f34561f7006f
      let tree = d3.layout
        .phylotree()
        // create a tree layout object
        .svg(d3.select(this.node));
      // render to this SVG element
      tree(d3.layout.newick_parser(newick))
        // parse the Newick into a d3 hierarchy object with additional fields
        .layout();
      // layout and render the tree
    }
  }
  retryTree() {
    var that = this;
    axios
      .post("/phylo_trees/retry", {
        id: this.phyloTree.id,
        authenticity_token: this.csrf
      })
      .then(res => {
        that.setState(
          {
            show_retry_button: !(res.data.status === "ok"),
            retry_message: res.data.message
          },
          () => {
            if (res.data.status === "ok") {
              location.href = `/phylo_trees/show?id=${this.phyloTree.id}`;
            }
          }
        );
      });
  }

  render() {
    let status_display;
    if (this.phyloTree) {
      switch (this.phyloTree.status) {
        case 1:
          status_display = "TREE IS READY";
          break;
        case 2:
          status_display = "TREE GENERATION FAILED";
          break;
        default:
          status_display = "TREE GENERATION IN PROGRESS";
      }
    }
    let retry_button = <PrimaryButton text="Retry" onClick={this.retryTree} />;
    let tree_svg =
      this.phyloTree && this.phyloTree.newick ? (
        <svg ref={node => (this.node = node)} />
      ) : null;
    return (
      <div className="phylo-tree-view">
        <p>{status_display}</p>
        {this.state.show_retry_button ? retry_button : null}
        {this.state.retry_message}
        {tree_svg}
      </div>
    );
  }
}

export default PhyloTreeViz;
