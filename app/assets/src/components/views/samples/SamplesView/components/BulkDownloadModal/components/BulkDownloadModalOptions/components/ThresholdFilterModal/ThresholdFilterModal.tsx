import React, { useState } from "react";
import ThresholdFilterList from "~/components/ui/controls/dropdowns/ThresholdFilterList";
import { THRESHOLDS } from "~/components/views/compare/SamplesHeatmapView/constants";
import { ThresholdFilterData } from "~/interface/dropdown";

interface ThresholdFilterModalProps {
  addFilterList: (
    downloadType: string,
    fieldType: string,
    value: ThresholdFilterData[],
    displayName: string,
  ) => void;
}

const thresholdToString = (thresholds: ThresholdFilterData[]) => {
  return thresholds.reduce(
    (acc, threshold) =>
      acc +
      threshold["metric"] +
      threshold["operator"] +
      threshold["value"] +
      " ",
    "",
  );
};

export const ThresholdFilterModal = ({
  addFilterList,
}: ThresholdFilterModalProps) => {
  const initialThreshold: ThresholdFilterData = {
    metric: "",
    metricDisplay: "",
    operator: ">=",
    value: "",
  };
  const [thresholds, setThresholds] = useState([initialThreshold]);

  return (
    <ThresholdFilterList
      metrics={THRESHOLDS}
      operators={[">=", "<="]}
      thresholds={thresholds}
      onAddThreshold={() => {
        setThresholds([
          ...thresholds,
          {
            metric: "",
            metricDisplay: "",
            operator: ">=",
            value: "",
          },
        ]);
      }}
      onChangeThreshold={(thresholdIdx, threshold) => {
        const newThresholds = [
          ...thresholds.slice(0, thresholdIdx),
          threshold,
          ...thresholds.slice(thresholdIdx + 1, thresholds.length),
        ];
        setThresholds(newThresholds);

        addFilterList(
          "biom_format",
          "filter_by",
          newThresholds.filter(
            threshold => threshold["metric"] && threshold["value"],
          ), // only add threshold if there is a valid metric and value
          thresholdToString(newThresholds),
        );
      }}
      onRemoveThreshold={thresholdIdx => {
        const newThresholds = [
          ...thresholds.slice(0, thresholdIdx),
          ...thresholds.slice(thresholdIdx + 1, thresholds.length),
        ];
        setThresholds(newThresholds);
        addFilterList(
          "biom_format",
          "filter_by",
          newThresholds.filter(
            threshold => threshold["metric"] && threshold["value"],
          ), // only add threshold if there is a valid metric and value
          thresholdToString(newThresholds),
        );
      }}
    />
  );
};
