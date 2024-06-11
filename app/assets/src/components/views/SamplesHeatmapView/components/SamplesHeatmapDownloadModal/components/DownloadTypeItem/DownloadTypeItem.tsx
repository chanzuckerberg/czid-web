import { InputRadio } from "@czi-sds/components";
import { cx } from "@emotion/css";
import React from "react";
import {
  HeatmapDownloadOption,
  HeatmapDownloadType,
} from "../../../../constants";
import { MetricDropdown } from "./components/MetricDropdown";
import cs from "./download_type_item.scss";

interface DownloadTypeItemProps {
  downloadOption: HeatmapDownloadOption;
  handleSelectMetric?: (downloadType, value) => void;
  isSelected: boolean;
  selectedMetricValue?: string;
  setSelectedDownloadType: (type: HeatmapDownloadType) => void;
}

export const DownloadTypeItem = ({
  downloadOption,
  handleSelectMetric,
  isSelected,
  selectedMetricValue,
  setSelectedDownloadType,
}: DownloadTypeItemProps) => {
  const {
    type: downloadType,
    displayName,
    description,
    fileTypeDisplay,
    metricOptions,
  } = downloadOption;

  const handleDownloadTypeButtonClick = () => {
    setSelectedDownloadType(downloadType);
  };

  return (
    <li className={cx(cs.downloadType, isSelected && cs.isSelected)}>
      <button
        className={cs.itemButton}
        key={downloadType}
        onClick={handleDownloadTypeButtonClick}
      >
        <InputRadio
          className={cs.radioButton}
          stage={isSelected ? "checked" : "unchecked"}
        />
        <div className={cs.content}>
          <div className={cs.name}>
            {displayName}
            {fileTypeDisplay && (
              <span className={cs.fileType}>&nbsp;({fileTypeDisplay})</span>
            )}
          </div>
          <div className={cs.description}>{description} </div>
          {metricOptions && isSelected && (
            <div className={cs.fields}>
              <MetricDropdown
                downloadType={downloadType}
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                handleSelectMetric={handleSelectMetric}
                metricOptions={metricOptions}
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                selectedMetricValue={selectedMetricValue}
              />
            </div>
          )}
        </div>
      </button>
    </li>
  );
};
