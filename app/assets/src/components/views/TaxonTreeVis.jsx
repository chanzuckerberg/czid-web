import React from "react";
// import PropTypes from "prop-types";
// import TidyTree from "../visualizations/TidyTree";

const TaxonLevels = [
  "superkingdom",
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species"
];
class TaxonTreeVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.tree = null;
    this.treeVis = null;
    console.log(this.props);
  }

  // componentDidMount() {
  //   this.treeVis = new TidyTree(this.container);
  // }

  static createNode() {
    return {
      children: [],
      collapsed: false
    };
  }

  addTaxonToNode(ancestors, taxon) {
    ancestors.forEach(ancestor => {});
  }

  createTree(taxons) {
    this.tree = TaxonTreeVis.createNode();

    let root = this.createNode();

    let taxonList = taxons.forEach(taxon => {
      let ancestors = TaxonLevels.map(level => {
        return (
          (taxon.lineage || {})[`${level}_taxid`] || {
            id: null
          }
        );
      });

      this.addTaxonToTree(root, ancestors, taxon);
    });
  }

  render() {
    return <div>This is the tree</div>;
  }
}

TaxonTreeVis.propTypes = {};

export default TaxonTreeVis;
