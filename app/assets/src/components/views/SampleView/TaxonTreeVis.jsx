import React from "react";
import PropTypes from "prop-types";

import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import { get, getOr, map } from "lodash/fp";
import PathogenLabel from "~/components/ui/labels/PathogenLabel";
import TidyTree from "~/components/visualizations/TidyTree";

const mapWithKeys = map.convert({ cap: false });

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
      history.replaceState(window.history.state, document.title, href);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  getCollapsedInUrl = () => {
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
  };

  componentDidUpdate() {
    let options = {};
    if (this.nameType !== this.props.nameType) {
      this.nameType = this.props.nameType;
      options.useCommonName = this.isCommonNameActive();
    }

    if (this.metric !== this.props.metric) {
      this.metric = this.props.metric;
      options.attribute = this.props.metric;
    }

    if (Object.keys(options).length) {
      this.treeVis.setOptions(options);
    }

    if (this.taxa !== this.props.taxa) {
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
    const { onTaxonClick } = this.props;
    if (["genus", "species"].includes(node.data.lineageRank)) {
      onTaxonClick(node.data);
    }
    logAnalyticsEvent("TaxonTreeVis_node-label_clicked", {
      taxonId: node.data.taxId,
      taxonName: node.data.name,
      taxLevel: node.data.lineageRank,
    });
  };

  isCommonNameActive = () => {
    return this.nameType.toLowerCase() === "common name";
  };

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

    root.eachAfter(node => {
      if (node.data.highlight) {
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

  createTree = () => {
    const { taxa, lineage } = this.props;
    const ROOT_ID = "_";
    const nodes = [{ id: ROOT_ID }];
    const addedNodesIds = new Set();

    const formatAndAddNode = ({ nodeData, parentId, fixedId }) => {
      const formattedNode = {
        id: `${fixedId || nodeData.taxId}`,
        taxId: nodeData.taxId,
        parentId: `${parentId}`,
        name: nodeData.name,
        scientificName: nodeData.name,
        lineageRank: nodeData.taxLevel,
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
      };
      addedNodesIds.add(formattedNode.id);
      nodes.push(formattedNode);
    };

    taxa.forEach(genusData => {
      // loading the genus id from the species lineage handles
      // cases where genus id is negative
      let genusIdFromLineage = null;

      genusData.filteredSpecies.forEach(speciesData => {
        const speciesLineage = lineage[speciesData.taxId] || {};
        // due to data inconsistencies, we try to infer the genus from the underlying species
        // lineage this value will be used if there is no lineage for the genus
        if (
          !genusIdFromLineage &&
          getOr(genusData.taxId, "parent", speciesLineage) !== genusData.taxId
        ) {
          genusIdFromLineage = speciesLineage.parent;
        }
      });

      genusData.filteredSpecies.forEach(speciesData => {
        const speciesLineage = lineage[speciesData.taxId] || {};
        formatAndAddNode({
          nodeData: speciesData,
          // due to data inconsistencies or to handle negative fake genus,
          // we try to get the parent tax id from:
          // 1) the species lineage info
          // 2) the parent genus if there is lineage defined for it
          // 3) the genus id inferred from all the children species' lineage
          // 4) the root id
          // this guarantees that lineage is defined for the genus node
          parentId:
            speciesLineage.parent ||
            (lineage[genusData.taxId] && genusData.taxId) ||
            genusIdFromLineage ||
            ROOT_ID,
        });
      });

      const genusLineage =
        lineage[genusData.taxId] || lineage[genusIdFromLineage] || {};
      formatAndAddNode({
        nodeData: genusData,
        parentId: genusLineage.parent || ROOT_ID,
        fixedId: genusIdFromLineage,
      });
    });
    // add remaining lineage nodes (above genus or negative genus)
    mapWithKeys((nodeLineage, taxId) => {
      if (!addedNodesIds.has(taxId)) {
        nodes.push({
          id: `${taxId}`,
          taxId: parseInt(taxId),
          parentId: `${nodeLineage.parent || ROOT_ID}`,
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
          <span
            key={`tt_${metric}`}
            className={`taxon_tooltip__row ${
              this.props.metric === metric ? "taxon_tooltip__row--active" : ""
            }`}
          >
            <div className="taxon_tooltip__row__label">
              {this.metrics[metric].label}:
            </div>
            <div className="taxon_tooltip__row__value">
              {Math.round(node.data.values[metric]).toLocaleString()}
            </div>
          </span>
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
          <div>{rows}</div>
        </div>
      </div>
    );
  };

  capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  renderPathogenLabel = (taxId, tagType) => {
    return (
      <div
        className={`node-overlay node-overlay__${taxId}`}
        key={`label-${taxId}`}
      >
        <PathogenLabel type={tagType} />
      </div>
    );
  };

  renderPathogenLabels = () => {
    const { taxa } = this.props;
    const labels = [];
    taxa.forEach(genusData => {
      if (genusData.pathogenTag) {
        labels.push(
          this.renderPathogenLabel(genusData.taxId, genusData.pathogenTag)
        );
      }
      genusData.filteredSpecies.forEach(speciesData => {
        if (speciesData.pathogenTag) {
          labels.push(
            this.renderPathogenLabel(speciesData.taxId, speciesData.pathogenTag)
          );
        }
      });
    });
    return labels;
  };

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
  onTaxonClick: PropTypes.func.isRequired,
};

export default TaxonTreeVis;
