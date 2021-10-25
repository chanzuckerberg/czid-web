import cx from "classnames";
import { filter, get, orderBy } from "lodash/fp";
import memoize from "memoize-one";
import React from "react";

import { ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import LoadingMessage from "~/components/common/LoadingMessage";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import PropTypes from "~/components/utils/propTypes";
import { WORKFLOWS } from "~/components/utils/workflows";
import BackgroundModelFilter from "~/components/views/report/filters/BackgroundModelFilter";
import { humanize } from "~/helpers/strings";
import Checkbox from "~ui/controls/Checkbox";
import RadioButton from "~ui/controls/RadioButton";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import StatusLabel from "~ui/labels/StatusLabel";

import TaxonHitSelect from "./TaxonHitSelect";
import cs from "./bulk_download_modal_options.scss";
import {
  BULK_DOWNLOAD_DOCUMENTATION_LINKS,
  CONDITIONAL_FIELDS,
} from "./constants.js";

const triggersConditionalField = (conditionalField, selectedFields) =>
  conditionalField.triggerValues.includes(
    get(conditionalField.dependentField, selectedFields)
  );

class BulkDownloadModalOptions extends React.Component {
  sortTaxaWithReadsOptions = memoize(options =>
    orderBy(["sampleCount", "text"], ["desc", "asc"], options)
  );

  renderOption = (downloadType, field) => {
    const {
      backgroundOptions,
      metricsOptions,
      validObjectIds,
      onFieldSelect,
      selectedFields,
      selectedDownloadTypeName,
      enableMassNormalizedBackgrounds,
    } = this.props;

    const selectedFieldsForType = get(selectedDownloadTypeName, selectedFields);
    const selectedField = get(field.type, selectedFieldsForType);
    let dropdownOptions = null;
    let placeholder = "";
    // Handle rendering conditional fields.

    // For the file format field, render a placeholder. This is a special case.
    const fileFormatConditionalField = CONDITIONAL_FIELDS[0];
    if (
      field.type === fileFormatConditionalField.field &&
      downloadType.type === fileFormatConditionalField.downloadType &&
      !triggersConditionalField(
        fileFormatConditionalField,
        selectedFieldsForType
      )
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
          !triggersConditionalField(conditionalField, selectedFieldsForType)
      )
    ) {
      return;
    }

    // Set different props for the dropdown depending on the field type.
    switch (field.type) {
      case "include_metadata":
        return (
          <Checkbox
            className={cs.checkboxField}
            label="Include sample metadata in this table"
            onChange={(_, isChecked) =>
              onFieldSelect(
                downloadType.type,
                field.type,
                isChecked /* value */,
                isChecked ? "Yes" : "No" /* display name */
              )
            }
            checked={selectedField}
          />
        );
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
              sampleIds={validObjectIds}
              onChange={(value, displayName) => {
                onFieldSelect(
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
              sampleIds={validObjectIds}
              onChange={(value, displayName) => {
                onFieldSelect(
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
      case "download_format":
        dropdownOptions = field.options.map(option => ({
          text: option,
          value: option,
        }));

        placeholder = "Select format";
        break;
    }

    if (!dropdownOptions) {
      return null;
    }

    return (
      <div className={cs.field} key={field.type}>
        <div className={cs.label}>{field.display_name}:</div>
        {field.type === "background" ? (
          <BackgroundModelFilter
            fluid
            placeholder={placeholder}
            allBackgrounds={dropdownOptions}
            onChange={(value, displayName) => {
              onFieldSelect(downloadType.type, field.type, value, displayName);

              // Reset conditional fields if they are no longer needed.
              CONDITIONAL_FIELDS.forEach(conditionalField => {
                if (
                  field.type === conditionalField.dependentField &&
                  downloadType.type === conditionalField.downloadType &&
                  !conditionalField.triggerValues.includes(value)
                ) {
                  onFieldSelect(
                    downloadType.type,
                    conditionalField.field,
                    undefined,
                    undefined
                  );
                }
              });
            }}
            enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
            value={selectedField}
            usePortal
            withinModal
            rounded={false}
            label={""}
          />
        ) : (
          <Dropdown
            fluid
            placeholder={placeholder}
            options={dropdownOptions}
            onChange={(value, displayName) => {
              onFieldSelect(downloadType.type, field.type, value, displayName);

              // Reset conditional fields if they are no longer needed.
              CONDITIONAL_FIELDS.forEach(conditionalField => {
                if (
                  field.type === conditionalField.dependentField &&
                  downloadType.type === conditionalField.downloadType &&
                  !conditionalField.triggerValues.includes(value)
                ) {
                  onFieldSelect(
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
        )}
      </div>
    );
  };

  renderDownloadType = downloadType => {
    const {
      validObjectIds,
      onSelect,
      allObjectsUploadedByCurrentUser,
      selectedDownloadTypeName,
      objectDownloaded,
    } = this.props;
    const { admin, appConfig } = this.context || {};

    const selected = selectedDownloadTypeName === downloadType.type;
    let disabled = false;
    let disabledMessage = "";

    if (
      downloadType.uploader_only &&
      !allObjectsUploadedByCurrentUser &&
      !admin
    ) {
      disabled = true;
      disabledMessage = `To download ${
        downloadType.display_name
      }, you must be the original uploader of all selected ${objectDownloaded}${
        validObjectIds.size !== 1 ? "s" : ""
      }.`;
    } else if (
      downloadType.type === "original_input_file" &&
      appConfig.maxSamplesBulkDownloadOriginalFiles &&
      validObjectIds.size > appConfig.maxSamplesBulkDownloadOriginalFiles &&
      !admin
    ) {
      disabled = true;
      disabledMessage = `No more than ${appConfig.maxSamplesBulkDownloadOriginalFiles} samples
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
        onClick={() => !disabled && onSelect(downloadType.type)}
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
            {downloadType.required_allowed_feature && (
              <StatusLabel inline status="Beta" />
            )}
          </div>
          <div className={cs.description}>
            {downloadType.description}{" "}
            {downloadType.type in BULK_DOWNLOAD_DOCUMENTATION_LINKS ? (
              <ExternalLink
                href={BULK_DOWNLOAD_DOCUMENTATION_LINKS[downloadType.type]}
                analyticsEventName={
                  ANALYTICS_EVENT_NAMES.CG_INTERMEDIATE_OUTPUT_FILES_BULK_DOWNLOAD_HELP_LINK_CLICKED
                }
              >
                Learn more
              </ExternalLink>
            ) : (
              ""
            )}
          </div>
          {downloadType.fields && selected && (
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

    const visibleTypes = downloadTypes.filter(
      type =>
        Object.prototype.hasOwnProperty.call(type, "category") &&
        !type.hide_in_creation_modal
    );

    const designatedOrder = ["results", "reports", "raw_data"];

    // for CG bulk downloads v0, just don't display any categories
    if (
      visibleTypes.some(
        type => type.display_name === WORKFLOWS.CONSENSUS_GENOME.label
      )
    ) {
      visibleTypes.sort(
        (typeA, typeB) =>
          designatedOrder.indexOf(typeA.category) -
          designatedOrder.indexOf(typeB.category)
      );
      return (
        <div className={cs.category}>
          {visibleTypes.map(this.renderDownloadType)}
        </div>
      );
    }

    const backendCategories = [
      ...new Set(visibleTypes.map(type => type.category)),
    ];
    const additionalCategories = backendCategories.filter(
      category => !designatedOrder.includes(category)
    );
    const categories = designatedOrder.concat(additionalCategories);

    const computedDownloadTypes = categories.map(category => {
      const categoryTypes = filter(["category", category], visibleTypes);
      if (categoryTypes.length < 1) {
        return;
      }
      return (
        <div className={cs.category} key={category}>
          <div className={cs.title}>{humanize(category)}</div>
          {categoryTypes.map(this.renderDownloadType)}
        </div>
      );
    });

    return <React.Fragment>{computedDownloadTypes}</React.Fragment>;
  };

  render() {
    return (
      <div className={cs.downloadTypeContainer}>
        {this.renderDownloadTypes()}
      </div>
    );
  }
}

BulkDownloadModalOptions.propTypes = {
  downloadTypes: PropTypes.arrayOf(PropTypes.DownloadType),
  selectedDownloadTypeName: PropTypes.string,
  // The selected fields of the currently selected download type.
  selectedFields: PropTypes.objectOf(PropTypes.string),
  onFieldSelect: PropTypes.func.isRequired,
  validObjectIds: PropTypes.instanceOf(Set).isRequired,
  backgroundOptions: PropTypes.array,
  metricsOptions: PropTypes.array,
  allObjectsUploadedByCurrentUser: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  enableMassNormalizedBackgrounds: PropTypes.bool,
  objectDownloaded: PropTypes.string,
};

BulkDownloadModalOptions.contextType = UserContext;

export default BulkDownloadModalOptions;
