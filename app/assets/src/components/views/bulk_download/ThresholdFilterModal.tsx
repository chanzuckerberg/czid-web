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
const ThresholdFilterModal = ({
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
            onAddThreshold={ () => {
                setThresholds([
                    ...thresholds, {
                        metric: "",
                        metricDisplay: "",
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
                addFilterList("biom_format", "filter_by", newThresholds, "filter_by");
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
