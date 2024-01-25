import { filter, get, isUndefined, map, reject, size, some } from "lodash/fp";
import React from "react";
import LoadingMessage from "~/components/common/LoadingMessage";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { BulkDownloadType } from "~/interface/shared";
import Notification from "~ui/notifications/Notification";
import {
  BULK_DOWNLOAD_TYPES,
  CONDITIONAL_FIELDS,
  HOST_GENOME_NAMES,
  OPTIONAL_FIELDS,
} from "../../../../../../BulkDownloadListView/constants";
import cs from "./bulk_download_modal_footer.scss";
import { BulkDownloadWarning } from "./components/BulkDownloadWarning";

const triggersCondtionalFieldMetricList = (
  conditionalField,
  // @ts-expect-error 'dependentField' is declared but its value is never read.
  dependentField,
  selectedFields,
) => {
  const thresholdMetrics = selectedFields["filter_by"].map(obj =>
    obj["metric"].replace("_", "."),
  ); // Heatmap metrics use underscore as separator, bulk downloads use periods
  return thresholdMetrics.some(metric =>
    conditionalField.triggerValues.includes(metric),
  );
};

const triggersConditionalField = (conditionalField, selectedFields) =>
  conditionalField.dependentFields
    .map(dependentField =>
      selectedFields &&
      selectedFields["filter_by"] &&
      dependentField === "filter_by"
        ? triggersCondtionalFieldMetricList(
            conditionalField,
            dependentField,
            selectedFields,
          )
        : conditionalField.triggerValues.includes(
            get(dependentField, selectedFields),
          ),
    )
    .some(Boolean);

interface BulkDownloadModalFooterProps {
  loading?: boolean;
  downloadTypes: BulkDownloadType[] | null;
  validObjectIds: Set<$TSFixMeUnknown>;
  invalidSampleNames?: string[];
  validationError?: string | null;
  selectedDownloadTypeName?: string | null;
  sampleHostGenomes: {
    id: number;
    name: string;
    hostGenome: string;
  }[];
  // The selected fields of the currently selected download type.
  selectedFields?: Record<string, string>;
  waitingForCreate?: boolean;
  createStatus?: string | null;
  createError?: string | null;
  onDownloadRequest: $TSFixMeFunction;
  workflow: string;
}

export function BulkDownloadModalFooter({
  loading,
  downloadTypes,
  validObjectIds,
  invalidSampleNames,
  validationError,
  selectedDownloadTypeName,
  selectedFields,
  waitingForCreate,
  createStatus,
  createError,
  onDownloadRequest,
  sampleHostGenomes,
}: BulkDownloadModalFooterProps) {
  const samplesWithHumanHost = filter(
    { hostGenome: HOST_GENOME_NAMES.HUMAN },
    sampleHostGenomes,
  );
  const numSamplesWithHumanHost = size(samplesWithHumanHost);

  const getSelectedDownloadType = (): BulkDownloadType | null => {
    if (!selectedDownloadTypeName) {
      return null;
    }

    return (
      downloadTypes?.find(item => item["type"] === selectedDownloadTypeName) ||
      null
    );
  };

  // Get all the fields we need to validate for the selected download type.
  const getRequiredFieldsForSelectedType = () => {
    const selectedFieldsForType = selectedFields?.selectedDownloadTypeName;
    const downloadType = getSelectedDownloadType();

    if (!downloadType) return null;
    let requiredFields = downloadType.fields;

    // Remove any conditional fields if they don't meet the criteria.
    CONDITIONAL_FIELDS.forEach(field => {
      if (
        downloadType.type === field.downloadType &&
        !triggersConditionalField(field, selectedFieldsForType)
      ) {
        requiredFields = reject(["type", field.field], requiredFields);
      }
    });

    OPTIONAL_FIELDS.forEach(field => {
      if (downloadType.type === field.downloadType) {
        requiredFields = reject(["type", field.field], requiredFields);
      }
    });

    return requiredFields;
  };

  const isSelectedDownloadValid = () => {
    const selectedFieldsForType = selectedFields?.selectedDownloadTypeName;
    const downloadType: BulkDownloadType | null = getSelectedDownloadType();

    if (!downloadType || validObjectIds.size < 1) {
      return false;
    } else if (downloadType.type === BULK_DOWNLOAD_TYPES.HOST_GENE_COUNTS) {
      return numSamplesWithHumanHost > 0;
    }

    const requiredFields = getRequiredFieldsForSelectedType();

    if (
      requiredFields &&
      some(
        Boolean,
        map(
          field =>
            !field ||
            isUndefined(field.type) ||
            isUndefined(selectedFieldsForType?.[field.type]),
          requiredFields,
        ),
      )
    ) {
      return false;
    }

    return true;
  };

  const getValidSampleIds = () => {
    if (selectedDownloadTypeName === BULK_DOWNLOAD_TYPES.HOST_GENE_COUNTS) {
      return map("id", samplesWithHumanHost);
    } else {
      return validObjectIds;
    }
  };

  const validSampleIds = getValidSampleIds();
  const numSamples = size(validSampleIds);
  const numNonHumanHostSamples =
    size(validObjectIds) - size(samplesWithHumanHost);

  return (
    <div className={cs.footer}>
      <div className={cs.notifications}>
        {invalidSampleNames && invalidSampleNames.length > 0 && (
          <BulkDownloadWarning
            message=" because they either failed or are still processing:"
            sampleNames={invalidSampleNames}
          />
        )}
        {numNonHumanHostSamples > 0 &&
          selectedDownloadTypeName === BULK_DOWNLOAD_TYPES.HOST_GENE_COUNTS && (
            <BulkDownloadWarning
              message=" because currently we only support human hosts for this download type. Samples that will not be included are:"
              sampleNames={map(
                "name",
                filter(
                  sample => sample.hostGenome !== HOST_GENOME_NAMES.HUMAN,
                  sampleHostGenomes,
                ),
              )}
            />
          )}
        {validationError != null && (
          <div className={cs.notificationContainer}>
            <Notification type="error" displayStyle="flat">
              <div className={cs.errorMessage}>
                An error occurred when verifying your selected samples.
              </div>
            </Notification>
          </div>
        )}
        {numSamples < 1 && !loading && (
          <div className={cs.notificationContainer}>
            <Notification type="error" displayStyle="flat">
              <div className={cs.errorMessage}>
                No valid samples to download data from.
              </div>
            </Notification>
          </div>
        )}
      </div>
      {waitingForCreate && (
        <LoadingMessage message="Starting your download..." />
      )}
      {createStatus === "error" && (
        <Notification type="error">{createError}</Notification>
      )}
      {!waitingForCreate && createStatus !== "error" && (
        <PrimaryButton
          disabled={!isSelectedDownloadValid()}
          text="Start Generating Download"
          onClick={() => onDownloadRequest(getValidSampleIds())}
        />
      )}
      <div className={cs.downloadDisclaimer}>
        Downloads for larger files can take multiple hours to generate.
      </div>
    </div>
  );
}
