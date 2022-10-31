import cx from "classnames";
import { filter, get, set, unset, isEmpty } from "lodash/fp";
import React, { useState } from "react";

import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { createBulkDownload } from "~/api/bulk_downloads";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { triggerFileDownload } from "~/components/utils/clientDownload";
import { humanize } from "~/helpers/strings";
import { SelectedOptions } from "~/interface/shared";
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
  onGenerateBulkDownload: () => void;
  open: boolean;
  sampleIds: number[];
  heatmapParams: HeatmapParamType;
  onDownloadSvg: () => void;
  onDownloadPng: () => void;
  onDownloadAllHeatmapMetricsCsv: () => void;
  onDownloadCurrentHeatmapViewCsv: () => string;
}

type HeatmapParamType = SelectedOptions;

interface SelectedDownloadSubmissionType {
  downloadType: string;
  fields: object;
  validObjectIds: number[];
  workflow: string;
  workflowEntity: string;
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
  onGenerateBulkDownload,
  sampleIds,
  heatmapParams,
  onDownloadSvg,
  onDownloadPng,
  onDownloadAllHeatmapMetricsCsv,
  onDownloadCurrentHeatmapViewCsv,
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
              onChange={(value: string, displayName: string) => {
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

  const submitBulkDownload = async (
    selectedDownloadSubmission: SelectedDownloadSubmissionType,
  ) => {
    // The bulk download modal has some error handling around this, but not sure if it actually does anything for the end user
    try {
      await createBulkDownload(selectedDownloadSubmission);
      trackEvent(
        ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESS,
        {
          workflow: selectedDownloadSubmission["workflow"],
          downloadType: selectedDownloadSubmission["downloadType"],
          ...selectedDownloadSubmission["validObjectIds"],
        },
      );
    } catch (e) {
      trackEvent(
        ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_FAILED,
        {
          workflow: selectedDownloadSubmission["workflow"],
          downloadType: selectedDownloadSubmission["downloadType"],
          error: e.error,
          ...selectedDownloadSubmission["validObjectIds"],
        },
      );
    }
  };

  const handleBulkDownload = (
    workflow = "short-read-mngs",
    workflowEntity = "Samples",
  ) => {
    trackEvent(
      ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_DOWNLOAD_MODAL_DOWNLOAD_CLICKED,
    );
    const metric = selectedFields["biom_format"]["metric"];
    const selectedDownloadSubmission = {
      downloadType: selectedDownloadType,
      fields: {
        metric: {
          value: metric,
        },
        filter_by: {
          value: heatmapParams["thresholdFilters"],
        },
        categories: {
          value: heatmapParams["categories"],
        },
        background: {
          value: heatmapParams["background"],
        },
      },
      validObjectIds: sampleIds,
      workflow: workflow,
      workflowEntity: workflowEntity,
    };

    submitBulkDownload(selectedDownloadSubmission);
    // close modal when download is created
    onGenerateBulkDownload();
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
          {/* @ts-expect-error Argument of type '({ description, display_name: displayName, fields, file_type_display: fileTypeDisplay, type, }: DownloadType) => JSX.Element' is not assignable to parameter of type  */}
          {categoryTypes.map(renderDownloadType)}
        </div>
      );
    });

    return <React.Fragment>{computedDownloadTypes}</React.Fragment>;
  };
  const runCurrentHeatmapViewDownload = () => {
    triggerFileDownload({
      downloadUrl: onDownloadCurrentHeatmapViewCsv(),
      fileName: "current_heatmap_view.csv",
    });
  };

  const renderDownloadButton = () => {
    const microbiomeSelected = selectedDownloadType === "biom_format";
    const text = microbiomeSelected ? "Start Generating Download" : "Download";
    const disabled =
      !selectedDownloadType || (microbiomeSelected && isEmpty(selectedFields));

    let runDownload: () => void;

    switch (selectedDownloadType) {
      case "svg":
        runDownload = onDownloadSvg;
        break;
      case "png":
        runDownload = onDownloadPng;
        break;
      case "all_metrics":
        runDownload = onDownloadAllHeatmapMetricsCsv;
        break;
      case "current_metrics":
        runDownload = runCurrentHeatmapViewDownload;
        break;
      case "biom_format":
        runDownload = handleBulkDownload;
        break;
    }
    return (
      <PrimaryButton
        disabled={disabled}
        text={text}
        onClick={() => runDownload()}
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
