import React from "react";
import PropTypes from "prop-types";

import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import { get, map } from "lodash/fp";

import TidyTree from "../visualizations/TidyTree";
import PathogenLabel from "../ui/labels/PathogenLabel";
import { getTaxonName } from "../../helpers/taxon";

const mapWithKeys = map.convert({ cap: false });

const TaxonLevels = [
  "species",
  "genus",
  "family",
  "order",
  "class",
  "phylum",
  "kingdom",
  "superkingdom",
];
class TaxonTreeVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      nodeHover: null,
      taxonSidebarData: null,
    };

    this.nameType = this.props.nameType;
    this.metric = this.props.metric;
    this.taxa = this.props.taxa;

    this.tree = null;
    this.treeVis = null;

    this.metrics = {
      aggregatescore: {
        label: "Aggregate Score",
        agg: arr => Math.max(...arr),
      },
      nt_r: { label: "NT r", agg: arr => arr.reduce((a, b) => a + b, 0) },
      nt_rpm: { label: "NT rpm", agg: arr => arr.reduce((a, b) => a + b, 0) },
      nr_r: { label: "NR r", agg: arr => arr.reduce((a, b) => a + b, 0) },
      nr_rpm: { label: "NR rpm", agg: arr => arr.reduce((a, b) => a + b, 0) },
    };
  }

  componentDidMount() {
    const tree = this.createTree(this.taxa);
    this.treeVis = new TidyTree(this.treeContainer, tree, {
      attribute: this.metric,
      useCommonName: this.isCommonNameActive(),
      onNodeHover: this.handleNodeHover,
      onNodeLabelClick: this.handleNodeLabelClick,
      onCreatedTree: this.fillNodeValues,
      tooltipContainer: this.treeTooltip,
      onCollapsedStateChange: withAnalytics(
        this.persistCollapsedInUrl,
        "TaxonTreeVis_node-collapsed-state_changed"
      ),
      collapsed: this.getCollapsedInUrl() || new Set(),
    });
    this.treeVis.update();
  }

  persistCollapsedInUrl(node) {
    function hasAllChildrenCollapsed(node) {
      return !!(!node.children && node.collapsedChildren);
    }
    try {
      const href = new URL(window.location.href);
      if (hasAllChildrenCollapsed(node)) {
        href.searchParams.set(node.id, "c"); // 'c'ollapsed
      } else {
        href.searchParams.delete(node.id);
      }
      // TODO (gdingle): make back button load previous vis state
      history.replaceState(window.history.state, document.title, href);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  getCollapsedInUrl() {
    try {
      const href = new URL(window.location.href);
      const collapsed = [];
      href.searchParams.forEach((v, k) => {
        if (v === "c") {
          collapsed.push(k);
        }
      });
      return new Set(collapsed);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
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

  handleNodeHover = node => {
    this.setState({ nodeHover: node });
    logAnalyticsEvent("TaxonTreeVis_node_hovered", {
      id: node.id,
      scientificName: node.data.scientificName,
      commonName: node.data.commonName,
    });
  };

  handleNodeLabelClick = node => {
    if (!node.data.modalData) {
      // TODO (gdingle): we should show a "no description" instead of no-op
      this.props.onTaxonClick(null);
      return;
    }

    const { taxInfo } = node.data.modalData;
    const taxonName = getTaxonName(
      taxInfo["name"],
      taxInfo["common_name"],
      this.props.nameType
    );
    // Pass config for taxon details sidebar.
    this.props.onTaxonClick({
      background: this.props.backgroundData,
      parentTaxonId: taxInfo.tax_level === 1 ? taxInfo.genus_taxid : undefined,
      taxonId: taxInfo.tax_id,
      taxonName,
      taxonValues: {
        NT: taxInfo.NT,
        NR: taxInfo.NR,
      },
    });
    logAnalyticsEvent("TaxonTreeVis_node-label_clicked", {
      taxonId: taxInfo.tax_id,
      taxonName,
      taxLevel: taxInfo.tax_level,
    });
  };

  getParentTaxId(taxon) {
    let originalTaxId = taxon.lineage[`${TaxonLevels[taxon.tax_level]}_taxid`];
    return originalTaxId > 0
      ? originalTaxId
      : `_${TaxonLevels[taxon.tax_level]}`;
  }

  isCommonNameActive() {
    return this.nameType.toLowerCase() == "common name";
  }

  fillNodeValues = root => {
    // this function computes the aggregated metric values
    // for higher levels of the tree (than species and genus)

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
      (this.props.topTaxa || []).map(taxon => taxon.tax_id.toString())
    );
    root.eachAfter(node => {
      if (topTaxaIds.has(node.id) || node.highlighted) {
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
  };

  createTree(taxa) {
    const { useReportV2Format } = this.props;
    if (useReportV2Format) {
      return this.createTreeV2();
    } else {
      return this.createTreeLegacy(taxa);
    }
  }

  createTreeLegacy = taxa => {
    console.log("taxa", taxa);
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
            lineageRank: TaxonLevels[i],
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
          nr_zscore: taxon.NR.zscore,
        },
        modalData: {
          taxInfo: taxon,
        },
      });
      seenNodes.add(nodeId);
    });
    return nodes;
  };

  createTreeV2 = () => {
    const { taxa, lineage } = this.props;
    const ROOT_ID = "_";
    const nodes = [{ id: ROOT_ID }];

    const formatNode = ({ nodeData, parentId }) => ({
      id: nodeData.taxId,
      taxId: nodeData.taxId,
      parentId: parentId,
      scientificName: nodeData.name,
      lineageRank: "genus",
      commonName: nodeData.common_name,
      highlight: nodeData.highlighted,
      values: {
        aggregatescore: nodeData.agg_score,
        nt_r: get("nt.count", nodeData) || 0,
        nt_rpm: get("nt.rpm", nodeData) || 0,
        nt_zscore: get("nt.z_score", nodeData) || 0,
        nr_r: get("nr.count", nodeData) || 0,
        nr_rpm: get("nr.rpm", nodeData) || 0,
        nr_zscore: get("nr.z_score", nodeData) || 0,
      },
    });

    taxa.forEach(genusData => {
      const genusLineage = lineage[genusData.taxId] || {};
      nodes.push(
        formatNode({
          nodeData: genusData,
          parentId: genusLineage.parent || ROOT_ID,
        })
      );

      genusData.filteredSpecies.forEach(speciesData => {
        const speciesLineage = lineage[genusData.taxId] || {};
        nodes.push(
          formatNode({
            nodeData: speciesData,
            parentId: genusData.taxId || speciesLineage.parent || ROOT_ID,
          })
        );
      });
    });

    // add other lineage nodes
    mapWithKeys((nodeLineage, taxId) => {
      // console.log(`taxId=${taxId}`, {parent: nodeLineage.parent});
      if (nodeLineage.rank != "genus" && nodeLineage.rank != "species") {
        // console.log("pushed with parent", nodeLineage.parent || ROOT_ID);
        nodes.push({
          id: taxId,
          taxId: parseInt(taxId),
          parentId: nodeLineage.parent || ROOT_ID,
          scientificName: nodeLineage.name,
          lineageRank: nodeLineage.rank,
        });
      }
    }, lineage);
    return nodes;
  };

  renderTooltip = () => {
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
  };

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
      </div>
    );
  }
}

TaxonTreeVis.defaultProps = {
  useReportV2Format: false,
};

TaxonTreeVis.propTypes = {
  // hash of lineage parental realtionships per taxid
  lineage: PropTypes.object,
  metric: PropTypes.string,
  nameType: PropTypes.string,
  taxa: PropTypes.array,
  topTaxa: PropTypes.array,
  backgroundData: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
  onTaxonClick: PropTypes.func.isRequired,
  useReportV2Format: PropTypes.bool,
};

export default TaxonTreeVis;
