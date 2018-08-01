import React from "react";
class PhyloTreeList extends React.Component {
  constructor(props) {
    super();
    this.project = props.project;
    this.phylo_trees = props.phylo_trees;
  }
  render() {
    let title = this.project.name
      ? 'Existing trees for project "' + this.project.name + '":'
      : "Existing trees:";
    return (
      <div>
        <h2>{title}</h2>
        {this.phylo_trees.length === 0
          ? "No trees yet."
          : this.phylo_trees.map((tree, i) => {
              return (
                <p key={`tree_${i}`}>
                  <a
                    href={`/phylo_trees/show?project_id=${
                      tree.project_id
                    }&taxid=${tree.taxid}`}
                  >
                    {tree.tax_name} (taxon ID: {tree.taxid})
                  </a>
                </p>
              );
            })}
        <p>
          <b>
            You can create trees by clicking on the tree icon next to a taxon on
            a sample's report page.
          </b>
        </p>
      </div>
    );
  }
}
export default PhyloTreeList;
