import cx from "classnames";
import { filter, get, set, unset, isEmpty } from "lodash/fp";
import React, { useState } from "react";

import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { humanize } from "~/helpers/strings";
import Modal from "~ui/containers/Modal";
import RadioButton from "~ui/controls/RadioButton";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import {
  HEATMAP_DOWNLOAD_CATEGORIES,
  HEATMAP_DOWNLOAD_OPTIONS,
  MICROBIOME_DOWNLOAD_METRIC_OPTIONS,
} from "./constants";

import cs from "./heatmap_download_modal.scss";

interface SamplesHeatmapDownloadModalProps {
  onClose: () => void;
  open: boolean;
  sampleIds: [number];
}

interface DownloadType {
  admin_only: boolean;
  category: string;
  description: string | JSX.Element;
  display_name: string;
  fields: [Field];
  file_type_display: string;
  type: string;
  required_allowed_feature?: string;
}

interface Field {
  display_name: string;
  type: string;
}

const SamplesHeatmapDownloadModal = ({
  onClose,
  open,
  sampleIds,
}: SamplesHeatmapDownloadModalProps) => {
  const [selectedDownloadType, setSelectedDownloadType] = useState("");
  const [selectedFields, setSelectedFields] = useState({});
  const [selectedFieldsDisplay, setSelectedFieldsDisplay] = useState({});

  const handleFieldSelect = (
    downloadType: string,
    fieldType: string,
    value: string,
    displayName: string,
  ) => {
    const newSelectedFields =
      value !== undefined
        ? set([downloadType, fieldType], value, selectedFields)
        : unset([downloadType, fieldType], selectedFields);

    const newSelectedFieldsDisplay =
      displayName !== undefined
        ? set([downloadType, fieldType], displayName, selectedFieldsDisplay)
        : unset([downloadType, fieldType], selectedFieldsDisplay);

    setSelectedFields(newSelectedFields);
    setSelectedFieldsDisplay(newSelectedFieldsDisplay);
  };

  const renderOption = (
    downloadType: string,
    { display_name: fieldDisplay, type: fieldType }: Field,
  ) => {
    const selectedFieldsForType = get(selectedDownloadType, selectedFields);
    const selectedField = get(fieldType, selectedFieldsForType);
    let dropdownOptions = null;
    let placeholder = "";

    switch (fieldType) {
      case "metric":
        dropdownOptions = MICROBIOME_DOWNLOAD_METRIC_OPTIONS;
        placeholder = "Select metric";
        return (
          <div className={cs.field} key={fieldType}>
            <div className={cs.label}>{fieldDisplay}:</div>
            <Dropdown
              fluid
              placeholder={placeholder}
              options={dropdownOptions}
              onChange={(value, displayName) => {
                handleFieldSelect(downloadType, fieldType, value, displayName);
              }}
              value={selectedField}
              usePortal
              withinModal
            />
          </div>
        );
    }
  };

  const renderDownloadType = ({
    description,
    display_name: displayName,
    fields,
    file_type_display: fileTypeDisplay,
    type,
  }: DownloadType) => {
    const selected = selectedDownloadType === type;

    const downloadTypeElement = (
      <div
        role="none" // silences linter error
        className={cx(cs.downloadType, selected && cs.selected)}
        key={type}
        onClick={() => setSelectedDownloadType(type)}
      >
        <RadioButton className={cs.radioButton} selected={selected} />
        <div className={cs.content}>
          <div className={cs.name}>
            {displayName}
            {fileTypeDisplay && (
              <span className={cs.fileType}>&nbsp;({fileTypeDisplay})</span>
            )}
          </div>
          <div className={cs.description}>{description} </div>
          {fields && selected && (
            <div className={cs.fields}>
              {fields.map(field => renderOption(type, field))}
            </div>
          )}
        </div>
      </div>
    );

    return downloadTypeElement;
  };

  const renderDownloadTypes = () => {
    const computedDownloadTypes = HEATMAP_DOWNLOAD_CATEGORIES.map(category => {
      const categoryTypes = filter(
        ["category", category],
        HEATMAP_DOWNLOAD_OPTIONS,
      );
      return (
        <div className={cs.category} key={category}>
          <div className={cs.title}>{humanize(category)}</div>
          {categoryTypes.map(renderDownloadType)}
        </div>
      );
    });

    return <React.Fragment>{computedDownloadTypes}</React.Fragment>;
  };

  const renderDownloadButton = () => {
    const microbiomeSelected = selectedDownloadType === "biom_format";
    const text = microbiomeSelected ? "Start Generating Download" : "Download";
    const disabled =
      !selectedDownloadType || (microbiomeSelected && isEmpty(selectedFields));
    return (
      <PrimaryButton
        disabled={disabled}
        text={text}
        onClick={trackEvent(
          ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_DOWNLOAD_MODAL_DOWNLOAD_CLICKED,
        )}
      />
    );
  };

  return (
    <Modal narrow open={open} tall onClose={onClose}>
      <div className={cs.modal}>
        <div className={cs.header}>
          <div className={cs.title}>Select a Download Type</div>
          <div className={cs.tagline}>
            {sampleIds.length} sample
            {sampleIds.length !== 1 ? "s" : ""} selected
          </div>
        </div>
        <div className={cs.options}>
          <div className={cs.downloadTypeContainer}>
            {renderDownloadTypes()}
          </div>
        </div>
        <div className={cs.footer}>
          {renderDownloadButton()}
          {selectedDownloadType === "biom_format" && (
            <div className={cs.subtext}>
              Downloads for larger files can take multiple hours to generate.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SamplesHeatmapDownloadModal;
