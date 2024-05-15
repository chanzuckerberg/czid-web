import React, { useContext } from "react";
import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import { BULK_DOWNLOAD_TYPES } from "~/components/views/BulkDownloadListView/constants";
import {
  BackgroundOptionType,
  MetricsOptionType,
  SelectedFieldsType,
  SelectedFieldValueType,
} from "~/components/views/SamplesView/components/BulkDownloadModal/types";
import { BulkDownloadType } from "~/interface/shared";
import { DownloadTypeOption } from "../DownloadTypeOption/DownloadTypeOption";

interface DownloadTypeOptionWrapperProps {
  areAllObjectsUploadedByCurrentUser?: boolean;
  backgroundOptions?: BackgroundOptionType[] | null;
  downloadType: BulkDownloadType;
  handleHeatmapLink: () => void;
  isUserCollaboratorOnAllRequestedSamples: boolean;
  metricsOptions?: MetricsOptionType[] | null;
  objectDownloaded?: string | null;
  onSelectDownloadType: (newSelectedDownloadTypeName: string) => void;
  onSelectField: (
    downloadType?: string,
    fieldType?: string,
    value?: SelectedFieldValueType,
    displayName?: string,
  ) => void;
  selectedDownloadTypeName?: string | null;
  selectedFields: SelectedFieldsType;
  shouldEnableMassNormalizedBackgrounds?: boolean;
  validObjectIds: Set<number | string>;
}

export const DownloadTypeOptionWrapper = ({
  areAllObjectsUploadedByCurrentUser,
  backgroundOptions,
  downloadType,
  handleHeatmapLink,
  isUserCollaboratorOnAllRequestedSamples,
  metricsOptions,
  objectDownloaded,
  onSelectDownloadType,
  onSelectField,
  selectedDownloadTypeName,
  selectedFields,
  shouldEnableMassNormalizedBackgrounds,
  validObjectIds,
}: DownloadTypeOptionWrapperProps) => {
  // Return a message to display to the user if the download option should be disabled.
  const getDisabledMessageForDownload = (downloadType: BulkDownloadType) => {
    const { admin, appConfig } = useContext(UserContext) || {};

    let disabledMessage = "";

    switch (downloadType.type) {
      case BULK_DOWNLOAD_TYPES.ORIGINAL_INPUT_FILES:
        if (!admin && !areAllObjectsUploadedByCurrentUser) {
          disabledMessage = `To download Original Input Files, you must be the original 
            uploader of all selected ${objectDownloaded}s.`;
        } else if (
          appConfig.maxSamplesBulkDownloadOriginalFiles &&
          validObjectIds.size > appConfig.maxSamplesBulkDownloadOriginalFiles &&
          !admin
        ) {
          disabledMessage = `No more than ${appConfig.maxSamplesBulkDownloadOriginalFiles} samples
            allowed for Original Input Files downloads`;
        }
        break;
      case BULK_DOWNLOAD_TYPES.HOST_GENE_COUNTS:
        if (!admin && !isUserCollaboratorOnAllRequestedSamples) {
          disabledMessage = `To download host count data, you must be a collaborator on the respective project for all samples.`;
        }
        break;
      default:
        break;
    }
    return disabledMessage;
  };

  const selected = selectedDownloadTypeName === downloadType.type;
  const disabledMessage = getDisabledMessageForDownload(downloadType);
  const disabled = disabledMessage !== "";
  if (disabled && disabledMessage) {
    return (
      <BasicPopup
        key={downloadType.type}
        trigger={
          <span>
            <DownloadTypeOption
              backgroundOptions={backgroundOptions}
              downloadType={downloadType}
              handleHeatmapLink={handleHeatmapLink}
              isDisabled={disabled}
              isSelected={selected}
              metricsOptions={metricsOptions}
              onSelectField={onSelectField}
              onSelectDownloadType={onSelectDownloadType}
              selectedDownloadTypeName={selectedDownloadTypeName}
              selectedFields={selectedFields}
              shouldEnableMassNormalizedBackgrounds={
                shouldEnableMassNormalizedBackgrounds
              }
              validObjectIds={validObjectIds}
            />
          </span>
        }
        content={disabledMessage}
      />
    );
  } else {
    return (
      <DownloadTypeOption
        backgroundOptions={backgroundOptions}
        downloadType={downloadType}
        handleHeatmapLink={handleHeatmapLink}
        isDisabled={disabled}
        isSelected={selected}
        metricsOptions={metricsOptions}
        onSelectField={onSelectField}
        onSelectDownloadType={onSelectDownloadType}
        selectedDownloadTypeName={selectedDownloadTypeName}
        selectedFields={selectedFields}
        shouldEnableMassNormalizedBackgrounds={
          shouldEnableMassNormalizedBackgrounds
        }
        validObjectIds={validObjectIds}
      />
    );
  }
};
