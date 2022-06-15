import React from "react";
import { Grid } from "semantic-ui-react";
import { BACKGROUND_DEPENDENT_THRESHOLDS } from "~/components/views/SampleView/constants";
import BackgroundModelFilter from "~/components/views/report/filters/BackgroundModelFilter";
import {
  BackgroundOption,
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
  backgroundOptions?: BackgroundOption[];
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
  backgroundOptions,
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
            <React.Fragment key={idx}>
              <ThresholdFilter
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
              { backgroundOptions && BACKGROUND_DEPENDENT_THRESHOLDS.map(a => a.text).includes(threshold.metricDisplay) && (
                <div>
                <BackgroundModelFilter
                  placeholder={"Select Background"}
                  allBackgrounds={backgroundOptions}
                  onChange={(value:number)=> {threshold["background_id"] = value;}}
                  enableMassNormalizedBackgrounds={false}
                  value={threshold}
                  usePortal
                  rounded={false}
                  label={""}
                />
                </div>
                ) }
            </React.Fragment>
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
