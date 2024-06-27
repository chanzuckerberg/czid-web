import { cx } from "@emotion/css";
import React from "react";
import { Grid } from "semantic-ui-react";
import {
  MetricOption,
  ThresholdFilterData,
  ThresholdFilterOperator,
} from "~/interface/dropdown";
import ThresholdFilterSemantic from "./ThresholdFilterSemantic/ThresholdFilterSemantic";
import cs from "./threshold_filter_list_semantic.scss";

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
            <button
              data-testid="add-threshold"
              className={cx(cs.addThresholdLink, "noStyleButton")}
              onClick={() => {
                onAddThreshold();
              }}
            >
              + ADD THRESHOLD
            </button>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
};

export default ThresholdFilterListSemantic;
