import React from "react";
class PhyloTreeList extends React.Component {
  constructor(props) {
    super();
    this.taxon = props.taxon;
    this.project = props.project;
    this.phyloTrees = props.phyloTrees;
  }
  render() {
    let title = "Existing trees";
    if (this.taxon.name) {
      title +=
        " for " + this.taxon.name + " (taxon ID " + this.taxon.taxid + ")";
    }
    if (this.project.name) {
      title += " in project " + this.project.name;
    }
    title += ":";
    return (
      <div>
        <h2>{title}</h2>
        {this.phyloTrees.length === 0
          ? "No trees yet."
          : this.phyloTrees.map((tree, i) => {
              return (
                <p key={`tree_${i}`}>
                  <a href={`/phylo_trees/show?id=${tree.id}`}>
                    {tree.name} ({tree.pipeline_runs.length} samples)
                  </a>
                </p>
              );
            })}
        <p>
          <b>
            {this.project.id && this.taxon.taxid ? (
              <a
                href={`/phylo_trees/new?project_id=${this.project.id}&taxid=${
                  this.taxon.taxid
                }`}
              >
                New tree
              </a>
            ) : (
              "You can create new trees by clicking on the tree icon next to a taxon on a sample's report page."
            )}
          </b>
        </p>
      </div>
    );
  }
}
export default PhyloTreeList;
