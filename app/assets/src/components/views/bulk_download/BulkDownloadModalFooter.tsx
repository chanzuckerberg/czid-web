import { filter, get, isUndefined, map, reject, size, some } from "lodash/fp";
import React from "react";
import { ANALYTICS_EVENT_NAMES, useWithAnalytics } from "~/api/analytics";
import LoadingMessage from "~/components/common/LoadingMessage";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import AccordionNotification from "~ui/notifications/AccordionNotification";
import Notification from "~ui/notifications/Notification";
import cs from "./bulk_download_modal_footer.scss";
import {
  BULK_DOWNLOAD_TYPES,
  CONDITIONAL_FIELDS,
  HOST_GENOME_NAMES,
  OPTIONAL_FIELDS,
} from "./constants";

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

type BulkDownloadType = {
  category: string;
  collaborator_only: boolean;
  description: string;
  display_name: string;
  execution_type: string;
  type: string;
  fields: unknown[];
} | null;

interface BulkDownloadModalFooterProps {
  loading?: boolean;
  downloadTypes?: $TSFixMeUnknown[];
  validObjectIds: Set<$TSFixMeUnknown>;
  invalidSampleNames?: string[];
  validationError?: string;
  selectedDownloadTypeName?: string;
  sampleHostGenomes: {
    id: number;
    name: string;
    hostGenome: string;
  }[];
  // The selected fields of the currently selected download type.
  selectedFields?: Record<string, string>;
  waitingForCreate?: boolean;
  createStatus?: string;
  createError?: string;
  onDownloadRequest: $TSFixMeFunction;
  workflow: string;
}

export default function BulkDownloadModalFooter({
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
  workflow,
}: BulkDownloadModalFooterProps) {
  const withAnalytics = useWithAnalytics();
  const samplesWithHumanHost = filter(
    { hostGenome: HOST_GENOME_NAMES.HUMAN },
    sampleHostGenomes,
  );
  const numSamplesWithHumanHost = size(samplesWithHumanHost);

  const getSelectedDownloadType = (): BulkDownloadType => {
    if (!selectedDownloadTypeName) {
      return null;
    }

    return downloadTypes.find(
      item => item["type"] === selectedDownloadTypeName,
    ) as BulkDownloadType;
  };

  // Get all the fields we need to validate for the selected download type.
  const getRequiredFieldsForSelectedType = () => {
    const selectedFieldsForType = get(selectedDownloadTypeName, selectedFields);
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
    const selectedFieldsForType = get(selectedDownloadTypeName, selectedFields);
    const downloadType: BulkDownloadType = getSelectedDownloadType();

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
          // @ts-expect-error Property 'fields' does not exist on type 'unknown'
          field => isUndefined(get(field.type, selectedFieldsForType)),
          requiredFields,
        ),
      )
    ) {
      return false;
    }

    return true;
  };

  const renderInvalidSamplesWarning = () => {
    return renderWarning({
      message: " because they either failed or are still processing:",
      sampleNames: invalidSampleNames,
    });
  };

  const renderHostGeneCountsWarning = () => {
    return renderWarning({
      message:
        " because currently we only support human hosts for this download type. Samples that will not be included are:",
      sampleNames: map(
        "name",
        filter(
          sample => sample.hostGenome !== HOST_GENOME_NAMES.HUMAN,
          sampleHostGenomes,
        ),
      ),
    });
  };

  const renderWarning = ({ message, sampleNames }) => {
    const header = (
      <div>
        <span className={cs.highlight}>
          {sampleNames.length} sample
          {sampleNames.length > 1 ? "s" : ""} won&apos;t be included in the bulk
          download
        </span>
        {message}
      </div>
    );

    const content = (
      <span>
        {sampleNames.map((name, index) => {
          return (
            <div key={index} className={cs.messageLine}>
              {name}
            </div>
          );
        })}
      </span>
    );

    return (
      <AccordionNotification
        header={header}
        content={content}
        open={false}
        type={"warning"}
        displayStyle={"flat"}
      />
    );
  };

  const renderValidationError = () => {
    return (
      <div className={cs.notificationContainer}>
        <Notification type="error" displayStyle="flat">
          <div className={cs.errorMessage}>
            An error occurred when verifying your selected samples.
          </div>
        </Notification>
      </div>
    );
  };

  const renderNoValidSamplesError = () => {
    return (
      <div className={cs.notificationContainer}>
        <Notification type="error" displayStyle="flat">
          <div className={cs.errorMessage}>
            No valid samples to download data from.
          </div>
        </Notification>
      </div>
    );
  };

  const renderDownloadButton = () => {
    if (waitingForCreate) {
      return <LoadingMessage message="Starting your download..." />;
    }

    if (createStatus === "error") {
      return <Notification type="error">{createError}</Notification>;
    }

    return (
      <PrimaryButton
        disabled={!isSelectedDownloadValid()}
        text="Start Generating Download"
        onClick={withAnalytics(
          () => onDownloadRequest(getValidSampleIds()),
          ANALYTICS_EVENT_NAMES.BULK_DOWNLOAD_MODAL_FOOTER_START_GENERATING_BUTTON_CLICKED,
          {
            workflow,
          },
        )}
      />
    );
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
        {invalidSampleNames.length > 0 && renderInvalidSamplesWarning()}
        {numNonHumanHostSamples > 0 &&
          selectedDownloadTypeName === BULK_DOWNLOAD_TYPES.HOST_GENE_COUNTS &&
          renderHostGeneCountsWarning()}
        {validationError != null && renderValidationError()}
        {numSamples < 1 && !loading && renderNoValidSamplesError()}
      </div>
      {renderDownloadButton()}
      <div className={cs.downloadDisclaimer}>
        Downloads for larger files can take multiple hours to generate.
      </div>
    </div>
  );
}
