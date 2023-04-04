import { Icon } from "czifui";
import React from "react";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import List from "~/components/ui/List";
import cs from "./samples_heatmap_filter_stats.scss";

interface SamplesHeatmapFilterStatsPropsType {
  filteredTaxaCount: number;
  totalTaxaCount: number;
  prefilterConstants: any;
}

export const SamplesHeatmapFilterStats = ({
  filteredTaxaCount,
  totalTaxaCount,
  prefilterConstants,
}: SamplesHeatmapFilterStatsPropsType) => {
  const { topN, minReads } = prefilterConstants;

  const content = (
    <>
      In order to load the heatmap faster, the data included in this heatmap was
      preselected based on the following conditions:
      <List
        listClassName={cs.conditionList}
        listItems={[
          `The top ${topN} unique taxa per sample, based on relative abundance (rPM)`,
          `Only taxa with at least ${minReads} reads`,
        ]}
      />
      You can add taxa under 5 reads using the “Add taxa” button below.
    </>
  );

  return (
    <div className={cs.statsRowContainer}>
      <span className={cs.reportInfoMsg}>
        Showing top {filteredTaxaCount} taxa of {totalTaxaCount} preselected
        taxa.
        <ColumnHeaderTooltip
          trigger={
            <span>
              <Icon
                sdsIcon="infoCircle"
                sdsSize="s"
                sdsType="interactive"
                className={cs.infoIcon}
              />
            </span>
          }
          content={content}
        />
      </span>
    </div>
  );
};
