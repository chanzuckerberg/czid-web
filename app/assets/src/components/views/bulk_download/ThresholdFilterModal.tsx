import React, { useState } from "react";
import ThresholdFilterList from "~/components/ui/controls/dropdowns/ThresholdFilterList";
import { THRESHOLDS } from "~/components/views/compare/SamplesHeatmapView/constants";
import { BackgroundOption, ThresholdFilterData } from "~/interface/dropdown";

interface ThresholdFilterModalProps {
    addFilterList: (
        downloadType: string,
        fieldType: string,
        value: ThresholdFilterData[],
        displayName: string,
    ) => void;
    backgroundOptions: BackgroundOption[];

}
const ThresholdFilterModal = ({
    addFilterList,
    backgroundOptions,
}: ThresholdFilterModalProps) => {
    const initialThreshold: ThresholdFilterData = {
        metric: THRESHOLDS[0].value,
        metricDisplay: THRESHOLDS[0].text,
        operator: ">=",
        value: "",
    };
    const [thresholds, setThresholds] = useState([initialThreshold]);

    return (
        <ThresholdFilterList
            metrics={THRESHOLDS}
            operators={[">=", "<="]}
            thresholds={thresholds}
            backgroundOptions={backgroundOptions}
            onAddThreshold={ () => {
                const firstMetric = THRESHOLDS[0];
                setThresholds([
                    ...thresholds, {
                        metric: firstMetric.value,
                        metricDisplay: firstMetric.text,
                        operator: ">=",
                        value: "",
                    },
                ]);
            }}
            onChangeThreshold={ (thresholdIdx, threshold) => {
                const newThresholds = [
                    ...thresholds.slice(0, thresholdIdx),
                    threshold,
                    ...thresholds.slice(thresholdIdx + 1, thresholds.length),
                ];
                setThresholds(newThresholds);
                addFilterList("biom_format", "metric_list", newThresholds, "metric_list");
            }}
            onRemoveThreshold={ (thresholdIdx) => {
                setThresholds([
                        ...thresholds.slice(0, thresholdIdx),
                        ...thresholds.slice(thresholdIdx + 1, thresholds.length),
                ]);
            }}
        />
    );
};

export default ThresholdFilterModal;
