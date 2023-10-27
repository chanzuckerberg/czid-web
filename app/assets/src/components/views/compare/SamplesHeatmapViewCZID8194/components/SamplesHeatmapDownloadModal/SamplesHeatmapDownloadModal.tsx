import { Button } from "@czi-sds/components";
import React, { useState } from "react";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import { createBulkDownload } from "~/api/bulk_downloads";
import { triggerFileDownload } from "~/components/utils/clientDownload";
import { WorkflowType } from "~/components/utils/workflows";
import { humanize } from "~/helpers/strings";
import { SelectedOptions } from "~/interface/shared";
import Modal from "~ui/containers/Modal";
import {
  HeatmapDownloadType,
  HEATMAP_DOWNLOAD_IMAGE_OPTIONS,
  HEATMAP_DOWNLOAD_REPORT_OPTIONS,
} from "../../constants";
import { DownloadTypeItem } from "./components/DownloadTypeItem";
import cs from "./samples_heatmap_download_modal.scss";

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

export const SamplesHeatmapDownloadModal = ({
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
  const trackEvent = useTrackEvent();
  const [selectedDownloadType, setSelectedDownloadType] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState({});

  const handleSelectMetric = (
    downloadType: HeatmapDownloadType,
    value: string,
  ) => {
    setSelectedMetrics({ ...selectedMetrics, [downloadType]: value });
  };

  const submitBulkDownload = async (
    selectedDownloadSubmission: SelectedDownloadSubmissionType,
  ) => {
    // The bulk download modal has some error handling around this, but not sure if it actually does anything for the end user
    try {
      await createBulkDownload(selectedDownloadSubmission);
      trackEvent(
        ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESS,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        {
          workflow: selectedDownloadSubmission["workflow"],
          downloadType: selectedDownloadSubmission["downloadType"],
          ...selectedDownloadSubmission["validObjectIds"],
        },
      );
      trackEvent(
        ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESS_ALLISON_TESTING,
        {
          workflow: JSON.stringify(selectedDownloadSubmission["workflow"]),
          downloadType: JSON.stringify(
            selectedDownloadSubmission["downloadType"],
          ),
          validObjectIds: JSON.stringify(
            selectedDownloadSubmission["validObjectIds"],
          ),
        },
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Samples heatmap bulk download creation failed! error:", e);
    }
  };

  const handleBulkDownload = (
    workflow = WorkflowType.SHORT_READ_MNGS,
    workflowEntity = "Samples",
  ) => {
    const metric = selectedMetrics[HeatmapDownloadType.BIOM_FORMAT];
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

  const runCurrentHeatmapViewDownload = () => {
    triggerFileDownload({
      downloadUrl: onDownloadCurrentHeatmapViewCsv(),
      fileName: "current_heatmap_view.csv",
    });
  };

  const onDownloadClick = () => {
    switch (selectedDownloadType) {
      case "svg":
        onDownloadSvg();
        break;
      case "png":
        onDownloadPng();
        break;
      case "all_metrics":
        onDownloadAllHeatmapMetricsCsv();
        break;
      case "current_metrics":
        runCurrentHeatmapViewDownload();
        break;
      case "biom_format":
        handleBulkDownload();
        break;
    }
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
            <div className={cs.category} key={"reports"}>
              <div className={cs.title}>{humanize("reports")}</div>
              <ul className={cs.optionList}>
                {HEATMAP_DOWNLOAD_REPORT_OPTIONS.map(downloadOption => {
                  return (
                    <DownloadTypeItem
                      downloadOption={downloadOption}
                      key={downloadOption.type}
                      handleSelectMetric={handleSelectMetric}
                      isSelected={selectedDownloadType === downloadOption.type}
                      selectedMetricValue={selectedMetrics[downloadOption.type]}
                      setSelectedDownloadType={setSelectedDownloadType}
                    />
                  );
                })}
              </ul>
            </div>
            <div className={cs.category} key={"images"}>
              <div className={cs.title}>{humanize("images")}</div>
              <p className={cs.imageDownloadTip}>
                Tip: Ensure the first taxon row is visible to avoid cutoffs in
                the heatmap image.
              </p>
              <ul className={cs.optionList}>
                {HEATMAP_DOWNLOAD_IMAGE_OPTIONS.map(downloadOption => {
                  return (
                    <DownloadTypeItem
                      downloadOption={downloadOption}
                      key={downloadOption.type}
                      isSelected={selectedDownloadType === downloadOption.type}
                      setSelectedDownloadType={setSelectedDownloadType}
                    />
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
        <div className={cs.footer}>
          <Button
            sdsType="primary"
            sdsStyle="rounded"
            disabled={
              !selectedDownloadType ||
              (selectedDownloadType === "biom_format" &&
                !selectedMetrics[HeatmapDownloadType.BIOM_FORMAT])
            }
            onClick={onDownloadClick}
          >
            {selectedDownloadType === "biom_format"
              ? "Start Generating Download"
              : "Download"}
          </Button>
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
