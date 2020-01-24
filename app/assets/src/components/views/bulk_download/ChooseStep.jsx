import React from "react";
import PropTypes from "~/components/utils/propTypes";
import {
  unset,
  find,
  filter,
  get,
  set,
  some,
  map,
  isUndefined,
  orderBy,
  reject,
} from "lodash/fp";
import cx from "classnames";
import memoize from "memoize-one";

import StatusLabel from "~ui/labels/StatusLabel";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import LoadingMessage from "~/components/common/LoadingMessage";
import RadioButton from "~ui/controls/RadioButton";
import BasicPopup from "~/components/BasicPopup";
import { createBulkDownload } from "~/api/bulk_downloads";
import AccordionNotification from "~ui/notifications/AccordionNotification";
import Notification from "~ui/notifications/Notification";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { UserContext } from "~/components/common/UserContext";

import TaxonHitSelect from "./TaxonHitSelect";
import cs from "./choose_step.scss";

// Stores information about conditional fields for bulk downloads.
const CONDITIONAL_FIELDS = [
  // Note: This first field is referenced directly in renderOption, as
  // it needs to display a placeholder component. Be careful when modifying.
  {
    field: "file_format",
    // The download type this conditional field applies to.
    downloadType: "reads_non_host",
    // The field this conditional field depends on.
    dependentField: "taxa_with_reads",
    // The values of the dependent field that trigger the conditional field.
    triggerValues: ["all", undefined],
  },
  {
    field: "background",
    downloadType: "combined_sample_taxon_results",
    dependentField: "metric",
    triggerValues: ["NR.zscore", "NT.zscore"],
  },
];

const triggersConditionalField = (conditionalField, selectedFields) =>
  conditionalField.triggerValues.includes(
    get(conditionalField.dependentField, selectedFields)
  );

const assembleSelectedDownload = memoize(
  (
    selectedDownloadTypeName,
    allSelectedFields,
    allSelectedFieldsDisplay,
    sampleIds
  ) => {
    const fieldValues = get(selectedDownloadTypeName, allSelectedFields);
    const fieldDisplayNames = get(
      selectedDownloadTypeName,
      allSelectedFieldsDisplay
    );

    const fields = {};
    if (fieldValues) {
      for (let [fieldName, fieldValue] of Object.entries(fieldValues)) {
        fields[fieldName] = {
          value: fieldValue,
          // Use the display name for the value if it exists. Otherwise, use the value.
          displayName: fieldDisplayNames[fieldName] || fieldValue,
        };
      }
    }

    return {
      downloadType: selectedDownloadTypeName,
      fields,
      sampleIds: Array.from(sampleIds),
    };
  }
);

class ChooseStep extends React.Component {
  state = {
    selectedFields: {},
    // For each selected field, we also save a human-readable "display name" for that field.
    // While the user is in the choose step, we store a field's value and display name separately.
    // This is to be compatible with <Dropdowns>, which only accept a string or number as the value
    // (as opposed to an object).
    // However, after the selected download is "assembled", both the value and display name for each field are stored
    // in the params. This is also how the bulk download is stored in the database.
    selectedFieldsDisplay: {},
    selectedDownloadTypeName: null,
    // Whether we are waiting for the createBulkDownload call to complete.
    waitingForCreate: false,
    createStatus: null,
    createError: "",
  };

  getSelectedDownloadType = () => {
    const { downloadTypes } = this.props;
    const { selectedDownloadTypeName } = this.state;

    if (!selectedDownloadTypeName) {
      return null;
    }

    return find(["type", selectedDownloadTypeName], downloadTypes);
  };

  // Get all the fields we need to validate for the selected download type.
  getRequiredFieldsForSelectedType = () => {
    const { selectedFields } = this.state;
    const downloadType = this.getSelectedDownloadType();

    if (!downloadType) return null;

    let requiredFields = downloadType.fields;

    // Remove any conditional fields if they don't meet the criteria.
    CONDITIONAL_FIELDS.forEach(field => {
      if (
        downloadType.type === field.downloadType &&
        !triggersConditionalField(field, selectedFields)
      ) {
        requiredFields = reject(["type", field.field], requiredFields);
      }
    });

    return requiredFields;
  };

  isSelectedDownloadValid = () => {
    const { validSampleIds } = this.props;
    const { selectedFields } = this.state;

    const downloadType = this.getSelectedDownloadType();

    if (!downloadType || validSampleIds.size < 1) {
      return false;
    }

    const requiredFields = this.getRequiredFieldsForSelectedType();

    if (requiredFields) {
      if (
        some(
          Boolean,
          map(
            field => isUndefined(get(field.type, selectedFields)),
            requiredFields
          )
        )
      ) {
        return false;
      }
    }

    return true;
  };

  sortTaxaWithReadsOptions = memoize(options =>
    orderBy(["sampleCount", "text"], ["desc", "asc"], options)
  );

  // *** TBD ***

  getSelectedFields = () => {
    const { selectedDownloadTypeName, selectedFields } = this.state;

    return get(selectedDownloadTypeName, selectedFields);
  };

  // *** BULK DOWNLOAD GENERATION

  continue = () => {
    const {
      selectedDownloadTypeName,
      selectedFields,
      selectedFieldsDisplay,
    } = this.state;
    const { validSampleIds, downloadTypes } = this.props;
    const selectedDownload = assembleSelectedDownload(
      selectedDownloadTypeName,
      selectedFields,
      selectedFieldsDisplay,
      validSampleIds
    );

    const selectedDownloadType = find(
      ["type", selectedDownloadTypeName],
      downloadTypes
    );

    this.createBulkDownload(selectedDownload);
  };

  handleSelectDownloadType = selectedDownloadTypeName => {
    this.setState({
      selectedDownloadTypeName,
    });
  };

  handleFieldSelect = (downloadType, fieldType, value, displayName) => {
    this.setState(prevState => {
      // If the value is undefined, delete it from selectedFields.
      // This allows us to support cases where certain fields are conditionally required;
      // if the field becomes no longer required, we can unset it.
      const newSelectedFields =
        value !== undefined
          ? set([downloadType, fieldType], value, prevState.selectedFields)
          : unset([downloadType, fieldType], prevState.selectedFields);

      const newSelectedFieldsDisplay =
        displayName !== undefined
          ? set(
              [downloadType, fieldType],
              displayName,
              prevState.selectedFieldsDisplay
            )
          : unset([downloadType, fieldType], prevState.selectedFieldsDisplay);

      return {
        selectedFields: newSelectedFields,
        selectedFieldsDisplay: newSelectedFieldsDisplay,
      };
    });
  };

  createBulkDownload = async selectedDownload => {
    const { onGenerate } = this.props;
    this.setState({
      waitingForCreate: true,
    });

    try {
      await createBulkDownload(selectedDownload);
    } catch (e) {
      this.setState({
        waitingForCreate: false,
        createStatus: "error",
        createError: e.error,
      });
      return;
    }

    onGenerate();
  };

  // *** RENDERING FUNCTIONS ***

  renderOption = (downloadType, field) => {
    const { backgroundOptions, metricsOptions, validSampleIds } = this.props;
    const { selectedFields } = this.state;

    const selectedField = get(field.type, selectedFields);
    let dropdownOptions = null;
    let placeholder = "";
    // Handle rendering conditional fields.

    // For the file format field, render a placeholder. This is a special case.
    const fileFormatConditionalField = CONDITIONAL_FIELDS[0];
    if (
      field.type === fileFormatConditionalField.field &&
      downloadType.type === fileFormatConditionalField.downloadType &&
      !triggersConditionalField(fileFormatConditionalField, selectedFields)
    ) {
      return (
        <div className={cs.field} key={field.type}>
          <div className={cs.label}>{field.display_name}:</div>
          <div className={cs.forcedOption}>.fasta</div>
          <div className={cs.info}>
            Note: Only .fasta is available when selecting one taxon.
          </div>
        </div>
      );
      // For other conditional fields, render nothing.
    } else if (
      CONDITIONAL_FIELDS.some(
        conditionalField =>
          field.type === conditionalField.field &&
          downloadType.type === conditionalField.downloadType &&
          !triggersConditionalField(conditionalField, selectedFields)
      )
    )
      return;

    // Set different props for the dropdown depending on the field type.
    switch (field.type) {
      case "file_format":
        dropdownOptions = field.options.map(option => ({
          text: option,
          value: option,
        }));

        placeholder = "Select file format";
        break;
      case "taxa_with_reads":
        return (
          <div className={cs.field} key={field.type}>
            <div className={cs.label}>{field.display_name}:</div>
            <TaxonHitSelect
              sampleIds={validSampleIds}
              onChange={(value, displayName) => {
                this.handleFieldSelect(
                  downloadType.type,
                  field.type,
                  value,
                  displayName
                );
              }}
              value={selectedField}
              hitType="read"
            />
          </div>
        );
      case "taxa_with_contigs":
        return (
          <div className={cs.field} key={field.type}>
            <div className={cs.label}>{field.display_name}:</div>
            <TaxonHitSelect
              sampleIds={validSampleIds}
              onChange={(value, displayName) => {
                this.handleFieldSelect(
                  downloadType.type,
                  field.type,
                  value,
                  displayName
                );
              }}
              value={selectedField}
              hitType="contig"
            />
          </div>
        );
      case "background":
        dropdownOptions = backgroundOptions || [];
        placeholder = backgroundOptions ? "Select background" : "Loading...";
        break;
      case "metric":
        dropdownOptions = metricsOptions || [];
        placeholder = metricsOptions ? "Select metric" : "Loading...";
        break;
    }

    if (!dropdownOptions) {
      return null;
    }

    return (
      <div className={cs.field} key={field.type}>
        <div className={cs.label}>{field.display_name}:</div>
        <Dropdown
          fluid
          placeholder={placeholder}
          options={dropdownOptions}
          onChange={(value, displayName) => {
            this.handleFieldSelect(
              downloadType.type,
              field.type,
              value,
              displayName
            );

            // Reset conditional fields if they are no longer needed.
            CONDITIONAL_FIELDS.forEach(conditionalField => {
              if (
                field.type === conditionalField.dependentField &&
                downloadType.type === conditionalField.downloadType &&
                !conditionalField.triggerValues.includes(value)
              ) {
                this.handleFieldSelect(
                  downloadType.type,
                  conditionalField.field,
                  undefined,
                  undefined
                );
              }
            });
          }}
          value={selectedField}
          usePortal
          withinModal
        />
      </div>
    );
  };

  renderDownloadType = downloadType => {
    const { validSampleIds } = this.props;
    const {
      allSamplesUploadedByCurrentUser,
      selectedDownloadTypeName,
    } = this.state;
    const { admin, appConfig } = this.context || {};

    const selected = selectedDownloadTypeName === downloadType.type;
    let disabled = false;
    let disabledMessage = "";

    if (
      downloadType.uploader_only &&
      !allSamplesUploadedByCurrentUser &&
      !admin
    ) {
      disabled = true;
      disabledMessage = `To download ${
        downloadType.display_name
      }, you must be the original uploader of all selected samples.`;
    } else if (
      downloadType.type === "original_input_file" &&
      appConfig.maxSamplesBulkDownloadOriginalFiles &&
      validSampleIds.size > appConfig.maxSamplesBulkDownloadOriginalFiles &&
      !admin
    ) {
      disabled = true;
      disabledMessage = `No more than ${
        appConfig.maxSamplesBulkDownloadOriginalFiles
      } samples
        allowed for ${downloadType.display_name} downloads`;
    }

    const downloadTypeElement = (
      <div
        className={cx(
          cs.downloadType,
          selected && cs.selected,
          disabled && cs.disabled
        )}
        key={downloadType.type}
        onClick={() =>
          !disabled && this.handleSelectDownloadType(downloadType.type)
        }
      >
        <RadioButton
          disabled={disabled}
          className={cs.radioButton}
          selected={selected}
        />
        <div className={cs.content}>
          <div className={cs.name}>
            {downloadType.display_name}
            {downloadType.file_type_display && (
              <span className={cs.fileType}>
                &nbsp;({downloadType.file_type_display})
              </span>
            )}
            {downloadType.admin_only && (
              <StatusLabel inline status="Admin Only" />
            )}
          </div>
          <div className={cs.description}>{downloadType.description}</div>
          {downloadType.fields &&
            selected && (
              <div className={cs.fields}>
                {downloadType.fields.map(field =>
                  this.renderOption(downloadType, field)
                )}
              </div>
            )}
        </div>
      </div>
    );

    if (disabled && disabledMessage) {
      return (
        <BasicPopup
          key={downloadType.type}
          trigger={downloadTypeElement}
          content={disabledMessage}
        />
      );
    } else {
      return downloadTypeElement;
    }
  };

  renderDownloadTypes = () => {
    const { downloadTypes } = this.props;

    if (!downloadTypes) {
      return <LoadingMessage message="Loading download types..." />;
    }

    const reportTypes = filter(["category", "report"], downloadTypes);
    const rawTypes = filter(["category", "raw"], downloadTypes);

    return (
      <React.Fragment>
        <div className={cs.category}>
          <div className={cs.title}>Reports</div>
          {reportTypes.map(this.renderDownloadType)}
        </div>
        <div className={cs.category}>
          <div className={cs.title}>Raw Data</div>
          {rawTypes.map(this.renderDownloadType)}
        </div>
      </React.Fragment>
    );
  };

  renderInvalidSamplesWarning = () => {
    const { invalidSampleNames } = this.props;

    const header = (
      <div>
        <span className={cs.highlight}>
          {invalidSampleNames.length} sample
          {invalidSampleNames.length > 1 ? "s" : ""} won't be included in the
          bulk download
        </span>, because they either failed or are still processing:
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
        type={"warn"}
        displayStyle={"flat"}
      />
    );
  };

  renderValidationError = () => {
    return (
      <div className={cs.notificationContainer}>
        <Notification type="error" displayStyle="flat">
          <div className={cs.header}>
            An error occurred when verifying your selected samples.
          </div>
        </Notification>
      </div>
    );
  };

  renderNoValidSamplesError = () => {
    return (
      <div className={cs.notificationContainer}>
        <Notification type="error" displayStyle="flat">
          No valid samples to download data from.
        </Notification>
      </div>
    );
  };

  renderDownloadButton = () => {
    const { waitingForCreate, createStatus, createError } = this.state;

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
        onClick={this.continue}
      />
    );
  };

  render() {
    const {
      onContinue,
      validSampleIds,
      invalidSampleNames,
      validationError,
    } = this.props;
    const numSamples = validSampleIds.size;

    return (
      <div className={cs.chooseStep}>
        <div className={cs.header}>
          <div className={cs.title}>Select a Download Type</div>
          <div className={cs.tagline}>
            {numSamples} sample{numSamples != 1 ? "s" : ""} selected
          </div>
        </div>
        <div className={cs.downloadTypeContainer}>
          {this.renderDownloadTypes()}
        </div>
        <div className={cs.footer}>
          {invalidSampleNames.length > 0 && this.renderInvalidSamplesWarning()}
          {validationError != null && this.renderValidationError()}
          {numSamples < 1 && this.renderNoValidSamplesError()}
          {this.renderDownloadButton()}
          <div className={cs.downloadDisclaimer}>
            Downloads for larger files can take multiple hours to generate.
          </div>
        </div>
      </div>
    );
  }
}

ChooseStep.propTypes = {
  downloadTypes: PropTypes.arrayOf(PropTypes.DownloadType),
  onGenerate: PropTypes.func.isRequired,
  validSampleIds: PropTypes.instanceOf(Set).isRequired,
  invalidSampleNames: PropTypes.arrayOf(PropTypes.string),
  validationError: PropTypes.string,
  backgroundOptions: PropTypes.array,
  metricsOptions: PropTypes.array,
  allSamplesUploadedByCurrentUser: PropTypes.bool,
};

ChooseStep.contextType = UserContext;

export default ChooseStep;
