import React from "react";
import { Grid } from "semantic-ui-react";
import {
  MetricOption,
  ThresholdFilterData,
  ThresholdFilterOperator,
} from "~/interface/dropdown";
import cs from "./threshold_filter_list_semantic.scss";
import ThresholdFilterSemantic from "./ThresholdFilterSemantic/ThresholdFilterSemantic";

interface ThresholdFilterListSemanticProps {
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

const ThresholdFilterListSemantic = ({
  metrics,
  operators,
  thresholds,
  onChangeThreshold,
  onRemoveThreshold,
  onAddThreshold,
}: ThresholdFilterListSemanticProps) => {
  return (
    <div className={cs.thresholdFilterList}>
      <Grid
        className={cs.thresholdFilterGrid}
        verticalAlign="middle"
        columns="equal"
      >
        {Array.isArray(thresholds) &&
          thresholds.map((threshold: ThresholdFilterData, idx: number) => (
            <ThresholdFilterSemantic
              key={`${threshold.metric}-${idx}`}
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
              data-testid="add-threshold"
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

export default ThresholdFilterListSemantic;
