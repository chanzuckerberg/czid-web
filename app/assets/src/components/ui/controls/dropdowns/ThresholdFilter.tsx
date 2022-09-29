import { get, find } from "lodash/fp";
import React from "react";
import { Grid } from "semantic-ui-react";

import Input from "~/components/ui/controls/Input";
import IconCloseSmall from "~/components/ui/icons/IconCloseSmall";
import {
  MetricOption,
  MetricText,
  ThresholdFilterData,
  ThresholdFilterOperator,
} from "~/interface/dropdown";
import Dropdown from "~ui/controls/dropdowns/Dropdown";

import cs from "./threshold_filter.scss";

interface ThresholdFilterProps {
  threshold: ThresholdFilterData;
  metrics: MetricOption[] | [];
  operators: ThresholdFilterOperator[] | [];
  onChange: (threshold: ThresholdFilterData) => void;
  onRemove: () => void;
}

const ThresholdFilter = ({
  threshold,
  metrics,
  operators,
  onChange,
  onRemove,
}: ThresholdFilterProps) => {
  const { metric, value, operator, metricDisplay } = threshold;

  const handleMetricChange = (newMetric: MetricText) => {
    const newMetricDisplay = get("text", find(["value", newMetric], metrics));
    onChange({
      metric: newMetric,
      value,
      operator,
      metricDisplay: newMetricDisplay,
    });
  };

  const handleOperatorChange = newOperator => {
    onChange({ metric, value, operator: newOperator, metricDisplay });
  };

  const handleValueChange = newValue => {
    onChange({ metric, value: newValue, operator, metricDisplay });
  };

  return (
    <Grid.Row className={cs.thresholdFilter}>
      <Grid.Column className={cs.inputFieldColumn} width={9}>
        <Dropdown
          className={cs.inputField}
          placeholder="Metric"
          fluid
          floating
          scrolling
          options={metrics}
          onChange={handleMetricChange}
          value={metric}
        />
      </Grid.Column>
      <Grid.Column className={cs.inputFieldColumn}>
        <Dropdown
          placeholder="Op."
          fluid
          floating
          scrolling
          options={operators.map(option => ({ text: option, value: option }))}
          onChange={handleOperatorChange}
          value={operator}
        />
      </Grid.Column>
      <Grid.Column className={cs.inputFieldColumn}>
        <Input
          className={"noSpinner"}
          onChange={handleValueChange}
          type="number"
          value={value}
        />
      </Grid.Column>
      <Grid.Column className={cs.inputFieldColumn} width={1}>
        <div onClick={onRemove} className={cs.removeIcon}>
          <IconCloseSmall />
        </div>
      </Grid.Column>
    </Grid.Row>
  );
};

export default ThresholdFilter;
