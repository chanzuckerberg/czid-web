import axios from "axios";
import React from "react";
import { Button } from "semantic-ui-react";

class PhyloTree extends React.Component {
  constructor(props) {
    super();
    this.csrf = props.csrf;
    this.taxon = props.taxon;
    this.project = props.project;
    this.samples = props.samples;
    this.pipeline_runs = props.pipeline_runs;
    this.tree = props.tree;
    this.state = {
      status: null
    };

    this.createTree = this.createTree.bind(this);
  }

  createTree() {
    var that = this;
    axios
      .post(`/projects/${this.project.id}/create_tree`, {
        authenticity_token: this.csrf
      })
      .then(res => {
        console.log(res);
        that.setState({status: res.data.message})
      })
  };

  render() {
    let title = (
      <h2>
        Phylogenetic tree for <i>{this.taxon.name}</i> in project <i>{this.project.name}</i>
      </h2>
    );
    let sample_list = this.samples.map(function(s, i) { return <p>{s.name}</p> });
    let no_tree_yet = (this.tree === undefined || this.tree.length == 0);
    let create_button = (
      <div>
        <Button primary onClick={this.createTree}>
          Create Tree
        </Button>
        <p>{this.state.status}</p>
      </div>
    );
    return (
      <div>
        {title}
        <h3>Relevant samples:</h3>
        {sample_list}
        {no_tree_yet ? create_button : (
           <PhyloTreeViz tree={this.tree} />
         )}
      </div>
    );
  }
}

export default PhyloTree;
