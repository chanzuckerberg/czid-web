import { get, some, map, isUndefined, reject } from "lodash/fp";
import React from "react";
import { withAnalytics } from "~/api/analytics";
import LoadingMessage from "~/components/common/LoadingMessage";
import { UserContext } from "~/components/common/UserContext";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import PropTypes from "~/components/utils/propTypes";

import AccordionNotification from "~ui/notifications/AccordionNotification";
import Notification from "~ui/notifications/Notification";

import cs from "./bulk_download_modal_footer.scss";
import { CONDITIONAL_FIELDS } from "./constants.js";

const triggersCondtionalFieldMetricList = (conditionalField, dependentField, selectedFields) =>
  {
    const thresholdMetrics = selectedFields["filter_by"].map((obj) => obj["metric"].replace("_", ".")); // Heatmap metrics use underscore as separator, bulk downloads use periods
    return thresholdMetrics.some(metric => conditionalField.triggerValues.includes(metric));
  };

const triggersConditionalField = (conditionalField, selectedFields) =>
  conditionalField.dependentFields.map( (dependentField) =>
   (selectedFields && selectedFields["filter_by"] && dependentField === "filter_by") ?
      triggersCondtionalFieldMetricList(conditionalField, dependentField, selectedFields,
      ) : (
        conditionalField.triggerValues.includes(
          get(dependentField, selectedFields),
        )),
  ).some(Boolean);

export default class BulkDownloadModalFooter extends React.Component {
  getSelectedDownloadType = () => {
    const { downloadTypes, selectedDownloadTypeName } = this.props;

    if (!selectedDownloadTypeName) {
      return null;
    }

    return downloadTypes.find(
      item => item["type"] === selectedDownloadTypeName,
    );
  };

  // Get all the fields we need to validate for the selected download type.
  getRequiredFieldsForSelectedType = () => {
    const { selectedFields, selectedDownloadTypeName } = this.props;
    const selectedFieldsForType = get(selectedDownloadTypeName, selectedFields);
    const downloadType = this.getSelectedDownloadType();

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

    return requiredFields;
  };

  isSelectedDownloadValid = () => {
    const {
      validObjectIds,
      selectedFields,
      selectedDownloadTypeName,
    } = this.props;

    const selectedFieldsForType = get(selectedDownloadTypeName, selectedFields);
    const downloadType = this.getSelectedDownloadType();

    if (!downloadType || validObjectIds.size < 1) {
      return false;
    }

    const requiredFields = this.getRequiredFieldsForSelectedType();

    if (requiredFields) {
      if (
        some(
          Boolean,
          map(
            field => isUndefined(get(field.type, selectedFieldsForType)),
            requiredFields,
          ),
        )
      ) {
        return false;
      }
    }

    return true;
  };

  renderInvalidSamplesWarning() {
    const { invalidSampleNames } = this.props;

    const header = (
      <div>
        <span className={cs.highlight}>
          {invalidSampleNames.length} sample
          {invalidSampleNames.length > 1 ? "s" : ""} won&apos;t be included in
          the bulk download
        </span>
        , because they either failed or are still processing:
      </div>
    );

    const content = (
      <span>
        {invalidSampleNames.map((name, index) => {
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
  }

  renderValidationError() {
    return (
      <div className={cs.notificationContainer}>
        <Notification type="error" displayStyle="flat">
          <div className={cs.errorMessage}>
            An error occurred when verifying your selected samples.
          </div>
        </Notification>
      </div>
    );
  }

  renderNoValidSamplesError() {
    return (
      <div className={cs.notificationContainer}>
        <Notification type="error" displayStyle="flat">
          <div className={cs.errorMessage}>
            No valid samples to download data from.
          </div>
        </Notification>
      </div>
    );
  }

  renderDownloadButton() {
    const {
      waitingForCreate,
      createStatus,
      createError,
      onDownloadRequest,
      workflow,
    } = this.props;

    if (waitingForCreate) {
      return <LoadingMessage message="Starting your download..." />;
    }

    if (createStatus === "error") {
      return <Notification type="error">{createError}</Notification>;
    }

    return (
      <PrimaryButton
        disabled={!this.isSelectedDownloadValid()}
        text="Start Generating Download"
        onClick={withAnalytics(
          onDownloadRequest,
          "BulkDownloadModalFooter_start-generating-button_clicked",
          {
            workflow,
          },
        )}
      />
    );
  }

  render() {
    const {
      validObjectIds,
      invalidSampleNames,
      validationError,
      loading,
    } = this.props;

    const numSamples = validObjectIds.size;

    return (
      <div className={cs.footer}>
        <div className={cs.notifications}>
          {invalidSampleNames.length > 0 && this.renderInvalidSamplesWarning()}
          {validationError != null && this.renderValidationError()}
          {numSamples < 1 && !loading && this.renderNoValidSamplesError()}
        </div>
        {this.renderDownloadButton()}
        <div className={cs.downloadDisclaimer}>
          Downloads for larger files can take multiple hours to generate.
        </div>
      </div>
    );
  }
}

BulkDownloadModalFooter.propTypes = {
  loading: PropTypes.bool,
  downloadTypes: PropTypes.arrayOf(PropTypes.DownloadType),
  validObjectIds: PropTypes.instanceOf(Set).isRequired,
  invalidSampleNames: PropTypes.arrayOf(PropTypes.string),
  validationError: PropTypes.string,
  selectedDownloadTypeName: PropTypes.string,
  // The selected fields of the currently selected download type.
  selectedFields: PropTypes.objectOf(PropTypes.string),
  waitingForCreate: PropTypes.bool,
  createStatus: PropTypes.string,
  createError: PropTypes.string,
  onDownloadRequest: PropTypes.func.isRequired,
  workflow: PropTypes.string.isRequired,
};

BulkDownloadModalFooter.contextType = UserContext;
