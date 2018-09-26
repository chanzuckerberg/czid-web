import React from "react";
import PropTypes from "prop-types";
import Tree from "../utils/structures/Tree";

class TaxonTreeVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.treeVis = null;
  }

  componentDidMount() {
    this.treeVis = new Tree(this.container);
  }
}
