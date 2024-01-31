import { filter } from "lodash/fp";
import React from "react";
import LoadingMessage from "~/components/common/LoadingMessage";
import { WorkflowType } from "~/components/utils/workflows";
import { humanize } from "~/helpers/strings";
import { BulkDownloadType } from "~/interface/shared";
import {
  BackgroundOptionType,
  MetricsOptionType,
  SelectedFieldsType,
} from "../../types";
import cs from "./bulk_download_modal_options.scss";
import { DownloadTypeOptionWrapper } from "./components/DownloadTypeOptionWrapper";
import { BulkDownloadModalOptionsConfig } from "./workflowTypeConfig";

const CATEGORY_ORDER = ["results", "reports", "raw_data"];
interface BulkDownloadModalOptionsProps {
  areAllObjectsUploadedByCurrentUser?: boolean;
  backgroundOptions?: BackgroundOptionType[] | null;
  downloadTypes?: BulkDownloadType[] | null;
  enableMassNormalizedBackgrounds?: boolean;
  handleHeatmapLink: () => void;
  isUserCollaboratorOnAllRequestedSamples: boolean;
  metricsOptions?: MetricsOptionType[] | null;
  objectDownloaded?: string | null;
  onSelectDownloadType: (newSelectedDownloadTypeName: string) => void;
  onSelectField: (
    downloadType: string | undefined,
    fieldType: string | undefined,
    value: $TSFixMe | undefined,
    displayName: string | undefined,
  ) => void;
  selectedDownloadTypeName?: string | null;
  // The selected fields of the currently selected download type.
  selectedFields: SelectedFieldsType;
  validObjectIds: Set<string | number>;
  workflow: WorkflowType;
}

export const BulkDownloadModalOptions = ({
  areAllObjectsUploadedByCurrentUser,
  backgroundOptions,
  downloadTypes,
  enableMassNormalizedBackgrounds,
  handleHeatmapLink,
  isUserCollaboratorOnAllRequestedSamples,
  metricsOptions,
  objectDownloaded,
  onSelectDownloadType,
  onSelectField,
  selectedDownloadTypeName,
  selectedFields,
  validObjectIds,
  workflow,
}: BulkDownloadModalOptionsProps) => {
  const shouldShowCategories =
    BulkDownloadModalOptionsConfig[workflow].shouldShowCategories;

  if (!downloadTypes) {
    return (
      <div className={cs.downloadTypeContainer}>
        <LoadingMessage message="Loading download types..." />
      </div>
    );
  }

  const visibleTypes = downloadTypes.filter(
    type =>
      Object.prototype.hasOwnProperty.call(type, "category") &&
      !type.hide_in_creation_modal,
  );

  if (!shouldShowCategories) {
    visibleTypes.sort((typeA, typeB) => {
      if (!typeA.category || !typeB.category) return 0;
      return (
        CATEGORY_ORDER.indexOf(typeA.category) -
        CATEGORY_ORDER.indexOf(typeB.category)
      );
    });
  }

  const backendCategories = [
    ...new Set(visibleTypes.map(type => type.category)),
  ];
  const additionalCategories = backendCategories.filter(
    category => category && !CATEGORY_ORDER.includes(category),
  );
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
  const categories = CATEGORY_ORDER.concat(additionalCategories);

  return (
    <div className={cs.downloadTypeContainer}>
      {!shouldShowCategories && (
        <div className={cs.category}>
          {visibleTypes.map((visibleType, index) => (
            <DownloadTypeOptionWrapper
              key={visibleType.type ?? `${index}-download-type-option-wrapper`}
              areAllObjectsUploadedByCurrentUser={
                areAllObjectsUploadedByCurrentUser
              }
              backgroundOptions={backgroundOptions}
              downloadType={visibleType}
              handleHeatmapLink={handleHeatmapLink}
              isUserCollaboratorOnAllRequestedSamples={
                isUserCollaboratorOnAllRequestedSamples
              }
              metricsOptions={metricsOptions}
              objectDownloaded={objectDownloaded}
              onSelectField={onSelectField}
              onSelectDownloadType={onSelectDownloadType}
              selectedDownloadTypeName={selectedDownloadTypeName}
              selectedFields={selectedFields}
              shouldEnableMassNormalizedBackgrounds={
                enableMassNormalizedBackgrounds
              }
              validObjectIds={validObjectIds}
            />
          ))}
        </div>
      )}
      {shouldShowCategories &&
        categories.map(category => {
          const categoryTypes = filter(["category", category], visibleTypes);
          if (categoryTypes.length < 1) {
            return;
          }

          return (
            <div className={cs.category} key={category}>
              <div className={cs.title}>{humanize(category)}</div>
              {categoryTypes.map((categoryType, index) => (
                <DownloadTypeOptionWrapper
                  key={
                    categoryType.type ?? `${index}-download-type-option-wrapper`
                  }
                  areAllObjectsUploadedByCurrentUser={
                    areAllObjectsUploadedByCurrentUser
                  }
                  backgroundOptions={backgroundOptions}
                  downloadType={categoryType}
                  handleHeatmapLink={handleHeatmapLink}
                  isUserCollaboratorOnAllRequestedSamples={
                    isUserCollaboratorOnAllRequestedSamples
                  }
                  metricsOptions={metricsOptions}
                  objectDownloaded={objectDownloaded}
                  onSelectField={onSelectField}
                  onSelectDownloadType={onSelectDownloadType}
                  selectedDownloadTypeName={selectedDownloadTypeName}
                  selectedFields={selectedFields}
                  shouldEnableMassNormalizedBackgrounds={
                    enableMassNormalizedBackgrounds
                  }
                  validObjectIds={validObjectIds}
                />
              ))}
            </div>
          );
        })}
    </div>
  );
};
