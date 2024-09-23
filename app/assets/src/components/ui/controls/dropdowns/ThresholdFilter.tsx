import { Dropdown, InputText } from "@czi-sds/components";
import { cx } from "@emotion/css";
import { find, get } from "lodash/fp";
import React from "react";
import { MenuOptionWithDisabledTooltip } from "~/components/common/MenuOptionWithDisabledTooltip";
import IconCloseSmall from "~/components/ui/icons/IconCloseSmall";
import { BACKGROUND_MODELS_LINK } from "~/components/utils/documentationLinks";
import { SDSFormattedOption } from "~/components/views/SamplesHeatmapView/components/SamplesHeatmapFilters/SamplesHeatmapFilters";
import {
  optionsToSDSFormat,
  valueToSDSFormatOption,
} from "~/components/views/SamplesHeatmapView/components/SamplesHeatmapFilters/samplesHeatmapFilterUtils";
import {
  MetricOption,
  ThresholdFilterData,
  ThresholdFilterOperator,
} from "~/interface/dropdown";
import ExternalLink from "../ExternalLink";
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
  const options = optionsToSDSFormat(metrics);
  const getOptionIsDisabled = (option: SDSFormattedOption) => option.disabled;

  const handleMetricChange = (newMetric: string) => {
    const newMetricDisplay = get("text", find(["value", newMetric], metrics));
    onChange({
      metric: newMetric,
      value,
      operator,
      metricDisplay: newMetricDisplay,
    });
  };

  const handleOperatorChange = (newOperator: ThresholdFilterOperator) => {
    onChange({ metric, value, operator: newOperator, metricDisplay });
  };

  const handleValueChange = (newValue: string) => {
    onChange({ metric, value: newValue, operator, metricDisplay });
  };

  const operatorOptions = operators.map((option: ThresholdFilterOperator) => ({
    text: option,
    value: option,
    name: option,
  }));

  // The SDS InputText component is currently styled incorrectly.
  // This is a workaround to fix the styling until the component is updated.
  const inputTextStyle = {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#999999",
    },
  };

  return (
    <div className={cx(cs.thresholdFilter, cs.row)}>
      <div className={cx(cs.inputFieldColumn, cs.metricColumn)}>
        <Dropdown
          className={cs.metricDropdown}
          value={valueToSDSFormatOption(metric, options)}
          onChange={(newValue: SDSFormattedOption) =>
            handleMetricChange(newValue.value as string)
          }
          label={<div className={cs.label}>{metricDisplay}</div>}
          options={options}
          DropdownMenuProps={{
            getOptionDisabled: getOptionIsDisabled,
            isOptionEqualToValue: (
              option: SDSFormattedOption,
              value: SDSFormattedOption,
            ) => {
              return option.value === value.value;
            },
            renderOption: function Option(
              optionProps: any,
              option: SDSFormattedOption,
            ) {
              return (
                <MenuOptionWithDisabledTooltip
                  key={option.value}
                  option={option}
                  optionProps={optionProps}
                  tooltipDisplay={
                    <>
                      To see the Z Score, first choose a background model above.{" "}
                      <ExternalLink href={BACKGROUND_MODELS_LINK}>
                        Learn more.
                      </ExternalLink>
                    </>
                  }
                />
              );
            },
            PopperBaseProps: {
              sx: { width: 230 },
            },
          }}
          InputDropdownProps={{
            sdsStyle: "square",
            sdsType: "label",
            sdsStage: "userInput",
            label: metricDisplay,
          }}
          data-testid="threshold-metric-dropdown"
        />
      </div>
      <div className={cs.inputFieldColumn}>
        <Dropdown
          options={operatorOptions}
          className={cs.operatorDropdown}
          label={<div className={cs.label}>{operator}</div>}
          onChange={(option: SDSFormattedOption) => {
            option?.name &&
              handleOperatorChange(option?.name as ThresholdFilterOperator);
          }}
          DropdownMenuProps={{
            isOptionEqualToValue: (
              option: SDSFormattedOption,
              value: SDSFormattedOption,
            ) => {
              return option.value === value.value;
            },
            PopperBaseProps: {
              sx: { width: 75 },
            },
          }}
          InputDropdownProps={{
            sdsStyle: "square",
            sdsType: "label",
            sdsStage: "userInput",
            label: operator,
          }}
        />
      </div>
      <div className={cs.inputFieldColumn}>
        <InputText
          className={cs.inputText}
          id="threshold-value"
          label="threshold-value"
          onChange={e => handleValueChange(e.target.value)}
          value={value}
          hideLabel={true}
          sdsType="textField"
          type="number"
          sx={inputTextStyle}
        />
      </div>
      <div className={cs.inputFieldColumn}>
        <div
          role="button"
          onClick={onRemove}
          className={cs.removeIcon}
          onKeyDown={e => {
            if (e.key === "Enter") {
              onRemove();
            }
          }}
          tabIndex={0}
        >
          <IconCloseSmall />
        </div>
      </div>
    </div>
  );
};

export default ThresholdFilter;
