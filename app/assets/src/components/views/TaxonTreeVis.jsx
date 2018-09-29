import React from "react";
// import PropTypes from "prop-types";
import TidyTree from "../visualizations/TidyTree";

const TaxonLevels = [
  "species",
  "genus",
  "family",
  "order",
  "class",
  "phylum",
  "kingdom",
  "superkingdom"
];
class TaxonTreeVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      nodeHover: null
    };

    this.nameType = this.props.nameType;
    this.metric = this.props.metric || "aggregatescore";
    this.taxons = this.props.taxons;

    this.tree = null;
    this.treeVis = null;

    this.metrics = {
      aggregatescore: {
        label: "Aggregate Score",
        agg: arr => Math.max(...arr)
      },
      nt_r: { label: "NT - r", agg: arr => arr.reduce((a, b) => a + b, 0) },
      nt_rpm: { label: "NT - rpm", agg: arr => arr.reduce((a, b) => a + b, 0) },
      nt_zscore: { label: "NT - Z-Score", agg: arr => Math.max(...arr) },
      nr_r: { label: "NR - r", agg: arr => arr.reduce((a, b) => a + b, 0) },
      nr_rpm: { label: "NR - rpm", agg: arr => arr.reduce((a, b) => a + b, 0) },
      nr_zscore: { label: "NR - Z-Score", agg: arr => Math.max(...arr) }
    };

    this.onNodeHover = this.onNodeHover.bind(this);
    this.fillData = this.fillData.bind(this);

    console.log(this.props);
  }

  componentDidMount() {
    this.treeVis = new TidyTree(
      this.treeContainer,
      this.createTree(this.taxons),
      {
        attribute: this.metric,
        useCommonName: this.isCommonNameActive(),
        onNodeHover: this.onNodeHover,
        onCreatedTree: this.fillData,
        tooltipContainer: this.treeTooltip
      }
    );
    this.treeVis.update();
  }

  componentDidUpdate() {
    console.log("name type", this.props.nameType);
    let options = {};
    if (this.nameType != this.props.nameType) {
      this.nameType = this.props.nameType;
      options.useCommonName = this.isCommonNameActive();
    }

    if (this.metric != this.props.metric) {
      this.metric = this.props.metric;
      options.attribute = this.props.metric;
    }

    let needUpdate = false;
    if (Object.keys(options).length) {
      this.treeVis.setOptions(options);
      needUpdate = true;
    }

    if (this.taxons != this.props.taxons) {
      this.taxons = this.props.taxons;
      this.treeVis.setTree(this.createTree(this.props.taxons));
      needUpdate = true;
    }

    needUpdate && this.treeVis.update();
  }

  static createNode() {
    return {
      children: [],
      collapsed: false
    };
  }

  onNodeHover(node) {
    this.setState({ nodeHover: node });
  }

  getParentTaxId(taxon) {
    let originalTaxId = taxon.lineage[`${TaxonLevels[taxon.tax_level]}_taxid`];
    return originalTaxId > 0
      ? originalTaxId
      : `_${TaxonLevels[taxon.tax_level]}`;
  }

  isCommonNameActive() {
    return this.nameType.toLowerCase() == "common name";
  }

  fillData(root) {
    root.eachAfter(node => {
      for (let metric in this.metrics) {
        node.data.values || (node.data.values = {});
        if (
          this.metrics.hasOwnProperty(metric) &&
          !node.data.values.hasOwnProperty(metric)
        ) {
          node.data.values[metric] = this.metrics[metric].agg(
            node.children.map(child => child.data.values[metric] || 0)
          );
        }
      }
    });
  }

  renderTooltip() {
    let node = this.state.nodeHover;

    if (!node) {
      return null;
    }
    let rows = [];
    for (let metric in this.metrics) {
      if (this.metrics.hasOwnProperty(metric)) {
        rows.push(
          <li
            key={`tt_${metric}`}
            className={`taxon_tooltip__row ${
              this.state.metric == metric ? "taxon_tooltip__row--active" : ""
            }`}
          >
            <div className="taxon_tooltip__row__label">
              {this.metrics[metric].label}:
            </div>
            <div className="taxon_tooltip__row__value">
              {Math.round(node.data.values[metric]).toLocaleString()}
            </div>
          </li>
        );
      }
    }
    return (
      <div className="taxon_tooltip">
        <div className="taxon_tooltip__title">{node.data.lineageRank}</div>
        <div className="taxon_tooltip__name">
          {(this.isCommonNameActive() && node.data.commonName) ||
            node.data.scientificName}
        </div>
        <div className="taxon_tooltip__title">Data</div>
        <div className="taxon_tooltip__data">
          <ul>{rows}</ul>
        </div>
      </div>
    );
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  createTree(taxons) {
    const parseId = (id, defaultId) => (id > 0 ? id : defaultId);

    let nodes = [{ id: "_" }];

    let seenNodes = new Set();
    taxons.forEach(taxon => {
      let parentId = nodes[0].id;
      for (let i = TaxonLevels.length - 1; i >= taxon.tax_level; i--) {
        let nodeId = parseId(
          taxon.lineage[`${TaxonLevels[i]}_taxid`],
          `${parentId}_`
        );
        if (!seenNodes.has(nodeId)) {
          nodes.push({
            id: nodeId,
            parentId: parentId,
            scientificName:
              taxon.lineage[`${TaxonLevels[i]}_name`] ||
              `Uncategorized ${this.capitalize(TaxonLevels[i])}`,
            lineageRank: TaxonLevels[i]
          });
          seenNodes.add(nodeId);
        }
        parentId = nodeId;
      }

      let nodeId = parseId(
        taxon.tax_id,
        `_${TaxonLevels[taxon.tax_level - 1]}`
      );
      nodes.push({
        id: nodeId,
        commonName: taxon.common_name,
        scientificName:
          taxon.tax_id > 0
            ? taxon.name
            : `Uncategorized ${this.capitalize(
                TaxonLevels[taxon.tax_level - 1]
              )}`,
        lineageRank: TaxonLevels[taxon.tax_level - 1],
        parentId: parentId,
        values: {
          aggregatescore: taxon.NT.aggregatescore,
          nt_r: taxon.NT.r,
          nt_rpm: parseFloat(taxon.NT.rpm),
          nt_zscore: taxon.NT.zscore,
          nr_r: taxon.NR.r,
          nr_rpm: parseFloat(taxon.NR.rpm),
          nr_zscore: taxon.NR.zscore
        }
      });
      seenNodes.add(nodeId);
    });

    return nodes;
  }

  render() {
    return (
      <div className="taxon-tree-vis">
        <div
          className="taxon-tree-vis__container"
          ref={container => {
            this.treeContainer = container;
          }}
        />
        <div
          className="taxon-tree-vis__tooltip"
          ref={tooltip => {
            this.treeTooltip = tooltip;
          }}
        >
          {this.renderTooltip()}
        </div>
      </div>
    );
  }
}

TaxonTreeVis.propTypes = {};

export default TaxonTreeVis;
