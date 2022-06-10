import React from "react";
import { Grid } from "semantic-ui-react";
import {
  MetricOption,
  ThresholdFilterData,
  ThresholdFilterOperator,
} from "~/interface/dropdown";
import { ThresholdFilter } from "~ui/controls/dropdowns";

import cs from "./threshold_filter_list.scss";

interface ThresholdFilterListProps {
  metrics: MetricOption[];
  operators: ThresholdFilterOperator[];
  thresholds: ThresholdFilterData[];
  onChangeThreshold: (
    thresholdIdx: number,
    threshold: ThresholdFilterData,
  ) => void;
  onRemoveThreshold: (thresholdIdx: number) => void;
  onAddThreshold: () => void;
}

const ThresholdFilterList = ({
  metrics,
  operators,
  thresholds,
  onChangeThreshold,
  onRemoveThreshold,
  onAddThreshold,
}: ThresholdFilterListProps) => {
  return (
    <div className={cs.thresholdFilterList}>
      <Grid
        className={cs.thresholdFilterGrid}
        verticalAlign="middle"
        columns="equal"
      >
        {Array.isArray(thresholds) &&
          thresholds.map((threshold: ThresholdFilterData, idx: number) => (
            <ThresholdFilter
              key={idx}
              metrics={metrics}
              operators={operators}
              threshold={threshold}
              onChange={(threshold: ThresholdFilterData) => {
                onChangeThreshold(idx, threshold);
              }}
              onRemove={() => {
                onRemoveThreshold(idx);
              }}
            />
          ))}
        <Grid.Row className={cs.addThresholdRow}>
          <Grid.Column className={cs.addThresholdColumn}>
            <span
              className={cs.addThresholdLink}
              onClick={() => {
                onAddThreshold();
              }}
            >
              + ADD THRESHOLD
            </span>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
};

export default ThresholdFilterList;
