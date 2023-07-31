import { cx } from "@emotion/css";
import React from "react";
import { TaxonNode } from "../../TaxonTreeVis";
import cs from "./taxon_tree_node_tooltip.scss";

interface TaxonTreeNodeTooltipProps {
  activeMetric: string;
  isCommonNameActive: boolean;
  node: TaxonNode;
  metrics: $TSFixMe;
}

export const TaxonTreeNodeTooltip = ({
  activeMetric,
  isCommonNameActive,
  node,
  metrics,
}: TaxonTreeNodeTooltipProps) => {
  if (!node) {
    return null;
  }

  const rows = [];
  for (const metric in metrics) {
    rows.push(
      <span
        key={`tt_${metric}`}
        className={cx(
          cs.taxonTooltipRow,
          activeMetric === metric ? cs.taxonTooltipRowActive : "",
        )}
      >
        <div className={cs.taxonTooltipRowLabel}>{metrics[metric].label}:</div>
        <div className={cs.taxonTooltipRowValue}>
          {Math.round(node.data.values[metric]).toLocaleString()}
        </div>
      </span>,
    );
  }

  let name =
    (isCommonNameActive && node.data.commonName) || node.data.scientificName;
  if (node.isAggregated) {
    // TODO: fix bug (not able to consistently reproduce) - currently just avoid crash
    name = `${(node.parent.collapsedChildren || []).length} Taxa`;
  }

  return (
    <div className={cs.taxonTooltip}>
      <div className={cs.taxonTooltipTitle}>{node.data.lineageRank}</div>
      <div className={cs.taxonTooltipName}>{name}</div>
      <div className={cs.taxonTooltipTitle}>Data</div>
      <div className={cs.taxonTooltipData}>
        <div>{rows}</div>
      </div>
    </div>
  );
};
