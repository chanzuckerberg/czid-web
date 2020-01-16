import React from "react";
import PropTypes from "~/components/utils/propTypes";
import {
  debounce,
  find,
  filter,
  get,
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
import {
  getBackgrounds,
  getTaxaWithReadsSuggestions,
  uploadedByCurrentUser,
  getHeatmapMetrics,
} from "~/api";
import Notification from "~ui/notifications/Notification";
import ListNotification from "~ui/notifications/ListNotification";
import Accordion from "~/components/layout/Accordion";
import Divider from "~/components/layout/Divider";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { UserContext } from "~/components/common/UserContext";

import TaxonContigSelect from "./TaxonContigSelect";
import cs from "./choose_step.scss";

const AUTOCOMPLETE_DEBOUNCE_DELAY = 200;

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

class ChooseStep extends React.Component {
  state = {
    backgroundOptions: null,
    metricsOptions: null,
    taxaWithReadsOptions: null,
    isLoadingTaxaWithReadsOptionsOptions: false,
    allSamplesUploadedByCurrentUser: false,
  };

  _lastTaxaWithReadsQuery = "";

  componentDidMount() {
    this.fetchUserData();
  }

  // make async requests in parallel
  async fetchUserData() {
    const backgroundOptionsRequest = this.fetchBackgrounds();
    const metricsOptionsRequest = this.fetchHeatmapMetrics();
    const allSamplesUploadedByCurrentUserRequest = this.checkAllSamplesUploadedByCurrentUser();

    await Promise.all([
      backgroundOptionsRequest,
      metricsOptionsRequest,
      allSamplesUploadedByCurrentUserRequest,
    ]).then(
      ([
        backgroundOptions,
        metricsOptions,
        allSamplesUploadedByCurrentUser,
      ]) => {
        this.setState({
          backgroundOptions,
          metricsOptions,
          allSamplesUploadedByCurrentUser,
        });
      }
    );
  }

  // TODO(mark): Set a reasonable default background based on the samples and the user's preferences.
  async fetchBackgrounds() {
    const backgrounds = await getBackgrounds();

    const backgroundOptions = backgrounds.map(background => ({
      text: background.name,
      value: background.id,
    }));

    return backgroundOptions;
  }

  // We use the heatmap metrics as the valid metrics for bulk downloads.
  async fetchHeatmapMetrics() {
    const heatmapMetrics = await getHeatmapMetrics();

    return heatmapMetrics;
  }

  async checkAllSamplesUploadedByCurrentUser() {
    const { validSampleIds } = this.props;
    const allSamplesUploadedByCurrentUser = await uploadedByCurrentUser(
      Array.from(validSampleIds)
    );

    return allSamplesUploadedByCurrentUser;
  }

  getSelectedDownloadType = () => {
    const { selectedDownloadTypeName, downloadTypes } = this.props;

    if (!selectedDownloadTypeName) {
      return null;
    }

    return find(["type", selectedDownloadTypeName], downloadTypes);
  };

  // Get all the fields we need to validate for the selected download type.
  getRequiredFieldsForSelectedType = () => {
    const { selectedFields } = this.props;
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
    const { selectedFields } = this.props;

    const downloadType = this.getSelectedDownloadType();

    if (!downloadType) {
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

  handleTaxaWithReadsSelectFilterChange = query => {
    this.setState({
      isLoadingTaxaWithReadsOptionsOptions: true,
    });

    this.loadTaxaWithReadsOptionsForQuery(query);
  };

  // Debounce this function, so it only runs after the user has not typed for a delay.
  loadTaxaWithReadsOptionsForQuery = debounce(
    AUTOCOMPLETE_DEBOUNCE_DELAY,
    async query => {
      this._lastTaxaWithReadsQuery = query;
      const { validSampleIds } = this.props;

      const searchResults = await getTaxaWithReadsSuggestions(
        query,
        Array.from(validSampleIds)
      );

      // If the query has since changed, discard the response.
      if (query != this._lastTaxaWithReadsQuery) {
        return;
      }

      const taxaWithReadsOptions = searchResults.map(result => ({
        value: result.taxid,
        text: result.title,
        customNode: (
          <div className={cs.taxaWithReadsOption}>
            <div className={cs.taxonName}>{result.title}</div>
            <div className={cs.fill} />
            <div className={cs.sampleCount}>{result.sample_count}</div>
          </div>
        ),
        // Ignored by the dropdown, used for sorting.
        sampleCount: result.sample_count,
      }));

      this.setState({
        taxaWithReadsOptions,
        isLoadingTaxaWithReadsOptionsOptions: false,
      });
    }
  );

  sortTaxaWithReadsOptions = memoize(options =>
    orderBy(["sampleCount", "text"], ["desc", "asc"], options)
  );

  renderOption = (downloadType, field) => {
    const { selectedFields, onFieldSelect, validSampleIds } = this.props;
    const {
      backgroundOptions,
      taxaWithReadsOptions,
      isLoadingTaxaWithReadsOptionsOptions,
      metricsOptions,
    } = this.state;

    const selectedField = get(field.type, selectedFields);
    let dropdownOptions = null;
    let loadingOptions = false;
    let optionsHeader = null;
    let placeholder = "";
    let menuLabel = "";
    let className = "";
    let search = false;
    let onFilterChange = null;
    let showNoResultsMessage = false;
    let isLoadingSearchOptions = false;

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
        dropdownOptions = [
          {
            text: "All Taxa",
            value: "all",
            customNode: (
              <div className={cs.taxaWithReadsOption}>
                <div className={cs.taxonName}>All taxa</div>
                <div className={cs.fill} />
                <div className={cs.sampleCount}>{validSampleIds.size}</div>
              </div>
            ),
          },
          // Note: BareDropdown with search prioritizes prefix matches, so the final ordering of options
          // might not be the one provided here.
          ...(this.sortTaxaWithReadsOptions(taxaWithReadsOptions) || []),
        ];

        placeholder = "Select taxon";
        menuLabel = "Select taxon";
        showNoResultsMessage = true;
        search = true;
        onFilterChange = this.handleTaxaWithReadsSelectFilterChange;
        className = cs.taxaWithReadsDropdown;
        isLoadingSearchOptions = isLoadingTaxaWithReadsOptionsOptions;

        optionsHeader = (
          <div className={cs.taxaWithReadsOptionsHeader}>
            <div className={cs.header}>Taxon</div>
            <div className={cs.fill} />
            <div className={cs.header}>Samples</div>
          </div>
        );
        break;
      case "taxa_with_contigs":
        return (
          <div className={cs.field} key={field.type}>
            <div className={cs.label}>{field.display_name}:</div>
            <TaxonContigSelect
              sampleIds={validSampleIds}
              onChange={(value, displayName) => {
                onFieldSelect(
                  downloadType.type,
                  field.type,
                  value,
                  displayName
                );
              }}
              value={selectedField}
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
          disabled={loadingOptions}
          placeholder={loadingOptions ? "Loading..." : placeholder}
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
          optionsHeader={optionsHeader}
          menuLabel={menuLabel}
          className={className}
          usePortal
          withinModal
          search={search}
          onFilterChange={onFilterChange}
          showNoResultsMessage={showNoResultsMessage}
          isLoadingSearchOptions={isLoadingSearchOptions}
        />
      </div>
    );
  };

  renderDownloadType = downloadType => {
    const { selectedDownloadTypeName, onSelect } = this.props;
    const { allSamplesUploadedByCurrentUser } = this.state;
    const { admin } = this.context || {};

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

  renderFilteredSamplesWarning = () => {
    const { filteredSampleNames } = this.props;

    const label = (
      <div className={cs.warningLabel}>
        <span className={cs.highlight}>
          {filteredSampleNames.length}{" "}
          {filteredSampleNames.length > 1 ? "samples " : "sample "}
          won't be included in this bulk download
        </span>, because they are in progress or failed samples:
      </div>
    );

    const content = (
      <div className={cs.accordionContent}>
        {filteredSampleNames.map((name, index) => (
          <div key={index} className={cs.listItem}>
            {name}
          </div>
        ))}
      </div>
    );

    return (
      <div className={cs.warning}>
        <Notification type="warn" displayStyle="flat">
          {label}
          <Accordion
            className={cs.accordion}
            header={<div className={cs.accordionHeader}>Hide Samples</div>}
            open={true}
            toggleable={true}
          >
            {content}
          </Accordion>
        </Notification>
      </div>
    );
  };

  render() {
    const { onContinue, validSampleIds, filteredSampleNames } = this.props;
    const numSamples = validSampleIds.size;

    return (
      <div className={cs.chooseStep}>
        <div className={cs.header}>
          <div className={cs.title}>Choose a Download</div>
          <div className={cs.tagline}>
            {numSamples} sample{numSamples != 1 ? "s" : ""} selected
          </div>
        </div>
        <div className={cs.downloadTypeContainer}>
          {this.renderDownloadTypes()}
        </div>
        <div className={cs.footer}>
          {filteredSampleNames.length > 0 &&
            this.renderFilteredSamplesWarning()}
          <PrimaryButton
            disabled={!this.isSelectedDownloadValid()}
            text="Continue"
            onClick={onContinue}
          />
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
  selectedDownloadTypeName: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  // The selected fields of the currently selected download type.
  selectedFields: PropTypes.objectOf(PropTypes.string),
  onFieldSelect: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
  validSampleIds: PropTypes.instanceOf(Set),
  filteredSampleNames: PropTypes.arrayOf(PropTypes.string),
};

ChooseStep.contextType = UserContext;

export default ChooseStep;
