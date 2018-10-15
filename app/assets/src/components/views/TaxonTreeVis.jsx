import React from "react";
import PropTypes from "prop-types";
import TidyTree from "../visualizations/TidyTree";
import TaxonModal from "../views/report/TaxonModal";
import PathogenLabel from "../ui/labels/PathogenLabel";
import { getTaxonName } from "../../helpers/taxon";

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
      nodeHover: null,
      taxonModalData: null
    };

    this.nameType = this.props.nameType;
    this.metric = this.props.metric || "aggregatescore";
    this.taxa = this.props.taxa;

    this.tree = null;
    this.treeVis = null;

    this.metrics = {
      aggregatescore: {
        label: "Aggregate Score",
        agg: arr => Math.max(...arr)
      },
      nt_r: { label: "NT r", agg: arr => arr.reduce((a, b) => a + b, 0) },
      nt_rpm: { label: "NT rpm", agg: arr => arr.reduce((a, b) => a + b, 0) },
      nr_r: { label: "NR r", agg: arr => arr.reduce((a, b) => a + b, 0) },
      nr_rpm: { label: "NR rpm", agg: arr => arr.reduce((a, b) => a + b, 0) }
    };

    this.handleNodeHover = this.handleNodeHover.bind(this);
    this.handleNodeLabelClick = this.handleNodeLabelClick.bind(this);
    this.handleTaxonModalClose = this.handleTaxonModalClose.bind(this);
    this.fillNodeValues = this.fillNodeValues.bind(this);
    this.renderTooltip = this.renderTooltip.bind(this);
  }

  componentDidMount() {
    this.treeVis = new TidyTree(
      this.treeContainer,
      this.createTree(this.taxa),
      {
        attribute: this.metric,
        useCommonName: this.isCommonNameActive(),
        onNodeHover: this.handleNodeHover,
        onNodeLabelClick: this.handleNodeLabelClick,
        onCreatedTree: this.fillNodeValues,
        tooltipContainer: this.treeTooltip
      }
    );
    this.treeVis.update();
  }

  componentDidUpdate() {
    let options = {};
    if (this.nameType != this.props.nameType) {
      this.nameType = this.props.nameType;
      options.useCommonName = this.isCommonNameActive();
    }

    if (this.metric != this.props.metric) {
      this.metric = this.props.metric;
      options.attribute = this.props.metric;
    }

    if (Object.keys(options).length) {
      this.treeVis.setOptions(options);
    }

    if (this.taxa != this.props.taxa) {
      this.taxa = this.props.taxa;
      this.treeVis.setTree(this.createTree(this.props.taxa));
    }
  }

  static createNode() {
    return {
      children: [],
      collapsed: false
    };
  }

  handleNodeHover(node) {
    this.setState({ nodeHover: node });
  }

  handleNodeLabelClick(node) {
    this.setState({
      taxonModalData: node.data.modalData || null
    });
  }

  handleTaxonModalClose() {
    this.setState({
      taxonModalData: null
    });
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

  fillNodeValues(root) {
    // cleaning up spurious nodes without children with data
    root.leaves().forEach(leaf => {
      if (!leaf.children && !leaf.data.values) {
        // delete node that has no children or values
        let ancestors = leaf.ancestors();
        for (let i = 1; i < ancestors.length; i++) {
          let ancestor = ancestors[i];
          ancestor.children = ancestor.children.filter(
            child => child.id !== ancestors[i - 1].id
          );
          if (ancestor.children && ancestor.children.length > 0) {
            // stop if ancestor still has children
            break;
          }
        }
      }
    });

    let topTaxaIds = new Set(
      this.props.topTaxa.map(taxon => taxon.tax_id.toString())
    );
    root.eachAfter(node => {
      if (topTaxaIds.has(node.id)) {
        node.data.highlight = true;
        node.ancestors().forEach(ancestor => {
          ancestor.data.highlight = true;
        });
      }

      for (let metric in this.metrics) {
        node.data.values || (node.data.values = {});
        if (
          this.metrics.hasOwnProperty(metric) &&
          !node.data.values.hasOwnProperty(metric)
        ) {
          node.data.values[metric] = this.metrics[metric].agg(
            node.children
              .filter(child => child.data.values[metric])
              .map(child => child.data.values[metric])
          );
        }
      }
    });
  }

  createTree(taxa) {
    // this function assumes that genus are always seen first
    let nodes = [{ id: "_" }];

    let seenNodes = new Set();
    taxa.forEach(taxon => {
      let parentId = nodes[0].id;
      for (let i = TaxonLevels.length - 1; i >= taxon.tax_level; i--) {
        let taxId = taxon.lineage[`${TaxonLevels[i]}_taxid`];
        let nodeId = taxId > 0 ? taxId : `${parentId}_${taxId}`;
        if (!seenNodes.has(nodeId)) {
          nodes.push({
            id: nodeId,
            taxId: taxId,
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

      let nodeId =
        taxon.tax_id > 0 ? taxon.tax_id : `${parentId}_${taxon.tax_id}`;
      nodes.push({
        id: nodeId,
        taxId: taxon.tax_id,
        commonName: this.capitalize(taxon.common_name),
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
        },
        modalData: {
          taxInfo: taxon
        }
      });
      seenNodes.add(nodeId);
    });
    return nodes;
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
              this.props.metric == metric ? "taxon_tooltip__row--active" : ""
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

    let name =
      (this.isCommonNameActive() && node.data.commonName) ||
      node.data.scientificName;
    if (node.isAggregated) {
      // TODO: fix bug (not able to consistently reproduce) - currently just avoid crash
      name = `${(node.parent.collapsedChildren || []).length} Taxa`;
    }

    return (
      <div className="taxon_tooltip">
        <div className="taxon_tooltip__title">{node.data.lineageRank}</div>
        <div className="taxon_tooltip__name">{name}</div>
        <div className="taxon_tooltip__title">Data</div>
        <div className="taxon_tooltip__data">
          <ul>{rows}</ul>
        </div>
      </div>
    );
  }

  capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  renderPathogenLabels() {
    return this.taxa.filter(taxon => taxon.pathogenTag).map(taxon => (
      <div
        className={`node-overlay node-overlay__${taxon.tax_id}`}
        key={`label-${taxon.tax_id}`}
      >
        <PathogenLabel type={taxon.pathogenTag} />
      </div>
    ));
  }

  renderTaxonModal() {
    const { taxonModalData } = this.state;
    if (!taxonModalData) return;

    const { taxInfo } = taxonModalData;

    const taxonName = getTaxonName(taxInfo, this.props.nameType);

    return (
      <TaxonModal
        taxonId={taxInfo.tax_id}
        taxonValues={{
          NT: taxInfo.NT,
          NR: taxInfo.NR
        }}
        parentTaxonId={
          taxInfo.tax_level === 1 ? taxInfo.genus_taxid : undefined
        }
        background={this.props.backgroundData}
        taxonName={taxonName}
        handleClose={this.handleTaxonModalClose}
      />
    );
  }

  render() {
    return (
      <div className="taxon-tree-vis">
        <div
          className="taxon-tree-vis__container"
          ref={container => {
            this.treeContainer = container;
          }}
        >
          <div className="pathogen-labels">{this.renderPathogenLabels()}</div>
        </div>
        <div
          className="taxon-tree-vis__tooltip"
          ref={tooltip => {
            this.treeTooltip = tooltip;
          }}
        >
          {this.renderTooltip()}
        </div>
        {this.renderTaxonModal()}
      </div>
    );
  }
}

TaxonTreeVis.propTypes = {
  metric: PropTypes.string,
  nameType: PropTypes.string,
  taxa: PropTypes.array,
  topTaxa: PropTypes.array,
  backgroundData: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  })
};

export default TaxonTreeVis;
