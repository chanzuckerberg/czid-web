import { get, getOr, map } from "lodash/fp";
import React, { useEffect, useRef, useState } from "react";
import {
  getWorkflowTypeFromLabel,
  WorkflowLabelType,
  WORKFLOW_TABS,
} from "~/components/utils/workflows";
import { TREE_VIZ_TOOLTIP_METRICS } from "~/components/views/SampleView/utils";
import { TidyTree } from "~/components/visualizations/TidyTree";
import { Taxon } from "~/interface/shared";
import { TaxonTreeNodeTooltip } from "./components/TaxonTreeNodeTooltip";
import { TaxonTreePathogenLabels } from "./components/TaxonTreePathogenLabels";

interface TaxonTreeVisProps {
  // hash of lineage parental realtionships per taxid
  lineage?: object;
  metric?: string;
  nameType?: string;
  taxa?: Taxon[];
  currentTab: WorkflowLabelType;
  onTaxonClick: $TSFixMeFunction;
}

export interface TaxonNode {
  data: { commonName: string; lineageRank; values; scientificName: string };
  isAggregated: boolean;
  parent: { collapsedChildren: $TSFixMeUnknown[] };
}

// @ts-expect-error working with Lodash Types
const mapWithKeys = map.convert({ cap: false });

export const TaxonTreeVis = ({
  currentTab,
  lineage,
  metric,
  nameType,
  onTaxonClick,
  taxa,
}: TaxonTreeVisProps) => {
  const metrics =
    TREE_VIZ_TOOLTIP_METRICS[getWorkflowTypeFromLabel(currentTab)];

  const [activeNode, setActiveNode] = useState(null);
  const [treeVis, setTreeVis] = useState(null);

  const treeTooltipRef = useRef(null);
  const treeContainerRef = useRef(null);

  useEffect(() => {
    if (!treeContainerRef || !treeTooltipRef) return;

    const tree = createTree();
    const treeVis = new TidyTree(treeContainerRef.current, tree, {
      attribute: metric,
      useCommonName: isCommonNameActive,
      onNodeHover: handleNodeHover,
      onNodeLabelClick: handleNodeLabelClick,
      onCreatedTree: fillNodeValues,
      tooltipContainer: treeTooltipRef.current,
      onCollapsedStateChange: persistCollapsedInUrl,
      collapsed: getCollapsedInUrl() || new Set(),
    });
    treeVis.update();
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    setTreeVis(treeVis);
  }, [treeTooltipRef, treeContainerRef]);

  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
  const isCommonNameActive = nameType.toLowerCase() === "common name";

  const persistCollapsedInUrl = (node: $TSFixMe) => {
    function hasAllChildrenCollapsed(node: $TSFixMe) {
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
  };

  const getCollapsedInUrl = () => {
    try {
      const href = new URL(window.location.href);
      const collapsed: $TSFixMe = [];
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

  useEffect(() => {
    const options = {
      useCommonName: isCommonNameActive,
      attribute: metric,
    };
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
    if (treeVis) treeVis.setOptions(options);
  }, [metric, nameType]);

  useEffect(() => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
    if (treeVis) treeVis.setTree(createTree());
  }, [taxa]);

  const handleNodeHover = (node: $TSFixMe) => {
    setActiveNode(node);
  };

  const handleNodeLabelClick = (node: { data: Taxon }) => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    if (["genus", "species"].includes(node.data.lineageRank)) {
      onTaxonClick(node.data);
    }
  };

  const getNodeValues = nodeData => {
    if (currentTab === WORKFLOW_TABS.SHORT_READ_MNGS) {
      return {
        aggregatescore: nodeData.agg_score,
        nt_r: get("nt.count", nodeData) || 0,
        nt_rpm: get("nt.rpm", nodeData) || 0,
        nt_zscore: get("nt.z_score", nodeData) || 0,
        nr_r: get("nr.count", nodeData) || 0,
        nr_rpm: get("nr.rpm", nodeData) || 0,
        nr_zscore: get("nr.z_score", nodeData) || 0,
      };
    } else if (currentTab === WORKFLOW_TABS.LONG_READ_MNGS) {
      return {
        nt_b: get("nt.base_count", nodeData) || 0,
        nt_bpm: get("nt.bpm", nodeData) || 0,
        nr_b: get("nr.base_count", nodeData) || 0,
        nr_bpm: get("nr.bpm", nodeData) || 0,
      };
    }
  };

  const fillNodeValues = (root: $TSFixMe) => {
    // this function computes the aggregated metric values
    // for higher levels of the tree (than species and genus)

    // cleaning up spurious nodes without children with data
    root.leaves().forEach((leaf: $TSFixMe) => {
      if (!leaf.children && !leaf.data.values) {
        // delete node that has no children or values
        const ancestors = leaf.ancestors();
        for (let i = 1; i < ancestors.length; i++) {
          const ancestor = ancestors[i];
          ancestor.children = ancestor.children.filter(
            (child: $TSFixMe) => child.id !== ancestors[i - 1].id,
          );
          if (ancestor.children && ancestor.children.length > 0) {
            // stop if ancestor still has children
            break;
          }
        }
      }
    });

    root.eachAfter((node: $TSFixMe) => {
      if (node.data.highlight) {
        node.data.highlight = true;
        node.ancestors().forEach((ancestor: $TSFixMe) => {
          ancestor.data.highlight = true;
        });
      }

      for (const metric in metrics) {
        node.data.values || (node.data.values = {});
        if (!(metric in node.data.values)) {
          node.data.values[metric] = metrics[metric].agg(
            node.children
              .filter((child: $TSFixMe) => child.data.values[metric])
              .map((child: $TSFixMe) => child.data.values[metric]),
          );
        }
      }
    });
  };

  const createTree = () => {
    const ROOT_ID = "_";
    const nodes = [{ id: ROOT_ID }];
    const addedNodesIds = new Set();

    const formatAndAddNode = ({ nodeData, parentId, fixedId }: $TSFixMe) => {
      const formattedNode = {
        id: `${fixedId || nodeData.taxId}`,
        taxId: nodeData.taxId,
        parentId: `${parentId}`,
        name: nodeData.name,
        scientificName: nodeData.name,
        lineageRank: nodeData.taxLevel,
        commonName: nodeData.common_name,
        highlight: nodeData.highlighted,
        values: getNodeValues(nodeData),
      };
      addedNodesIds.add(formattedNode.id);
      nodes.push(formattedNode);
    };

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    taxa.forEach(genusData => {
      // loading the genus id from the species lineage handles
      // cases where genus id is negative
      let genusIdFromLineage: $TSFixMe = null;

      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      genusData.filteredSpecies.forEach(speciesData => {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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

      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      genusData.filteredSpecies.forEach(speciesData => {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
            (lineage[genusData.taxId] && genusData.taxId) ||
            genusIdFromLineage ||
            ROOT_ID,
        });
      });

      const genusLineage =
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        lineage[genusData.taxId] || lineage[genusIdFromLineage] || {};
      formatAndAddNode({
        nodeData: genusData,
        parentId: genusLineage.parent || ROOT_ID,
        fixedId: genusIdFromLineage,
      });
    });
    // add remaining lineage nodes (above genus or negative genus)
    mapWithKeys((nodeLineage: $TSFixMe, taxId: $TSFixMe) => {
      if (!addedNodesIds.has(taxId)) {
        nodes.push({
          id: `${taxId}`,
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ id: string; taxId: number; par... Remove this comment to see the full error message
          taxId: parseInt(taxId),
          parentId: `${nodeLineage.parent || ROOT_ID}`,
          scientificName: nodeLineage.name,
          lineageRank: nodeLineage.rank,
        });
      }
    }, lineage);
    return nodes;
  };

  return (
    <div className="taxon-tree-vis">
      <div className={"taxon-tree-vis__container"} ref={treeContainerRef}>
        {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322 */}
        <TaxonTreePathogenLabels taxa={taxa} />
      </div>
      <div className={"taxon-tree-vis__tooltip"} ref={treeTooltipRef}>
        <TaxonTreeNodeTooltip
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          activeMetric={metric}
          isCommonNameActive={isCommonNameActive}
          metrics={metrics}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          node={activeNode}
        />
      </div>
    </div>
  );
};
