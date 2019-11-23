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
  isNumber,
  reject,
} from "lodash/fp";
import cx from "classnames";
import memoize from "memoize-one";

import Dropdown from "~ui/controls/dropdowns/Dropdown";
import LoadingMessage from "~/components/common/LoadingMessage";
import RadioButton from "~ui/controls/RadioButton";
import BasicPopup from "~/components/BasicPopup";
import {
  getBackgrounds,
  getTaxaWithReadsSuggestions,
  uploadedByCurrentUser,
} from "~/api";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";

import cs from "./choose_step.scss";

const AUTOCOMPLETE_DEBOUNCE_DELAY = 200;
// Reads non-host download type has some special cases.
const READS_NON_HOST_DOWNLOAD_TYPE = "reads_non_host";

class ChooseStep extends React.Component {
  state = {
    backgroundOptions: null,
    taxaWithReadsOptions: null,
    isLoadingTaxaWithReadsOptionsOptions: false,
    allSamplesUploadedByCurrentUser: false,
  };

  _lastTaxaWithReadsQuery = "";

  componentDidMount() {
    this.fetchBackgrounds();
    this.checkAllSamplesUploadedByCurrentUser();
  }

  // TODO(mark): Set a reasonable default background based on the samples and the user's preferences.
  async fetchBackgrounds() {
    const backgrounds = await getBackgrounds();

    const backgroundOptions = backgrounds.map(background => ({
      text: background.name,
      value: background.id,
    }));

    this.setState({
      backgroundOptions,
    });
  }

  async checkAllSamplesUploadedByCurrentUser() {
    const { selectedSampleIds } = this.props;
    const allSamplesUploadedByCurrentUser = await uploadedByCurrentUser(
      Array.from(selectedSampleIds)
    );
    this.setState({
      allSamplesUploadedByCurrentUser,
    });
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

    // Don't require file_format field if a single taxa is selected for reads non-host download type.
    if (
      downloadType.type === READS_NON_HOST_DOWNLOAD_TYPE &&
      isNumber(get([downloadType.type, "taxa_with_reads"], selectedFields))
    ) {
      requiredFields = reject(["type", "file_format"], requiredFields);
    }

    return requiredFields;
  };

  isDownloadValid = () => {
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
            field =>
              isUndefined(get([downloadType.type, field.type], selectedFields)),
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
      const { selectedSampleIds } = this.props;

      const searchResults = await getTaxaWithReadsSuggestions(
        query,
        Array.from(selectedSampleIds)
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
    const { selectedFields, onFieldSelect, selectedSampleIds } = this.props;
    const {
      backgroundOptions,
      taxaWithReadsOptions,
      isLoadingTaxaWithReadsOptionsOptions,
    } = this.state;

    const selectedField = get([downloadType.type, field.type], selectedFields);
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

    // Set different props for the dropdown depending on the field type.
    switch (field.type) {
      case "file_format":
        if (
          downloadType.type === READS_NON_HOST_DOWNLOAD_TYPE &&
          isNumber(get([downloadType.type, "taxa_with_reads"], selectedFields))
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
        }
        dropdownOptions = field.options.map(option => ({
          text: option,
          value: option,
        }));

        placeholder = "Select file format";
        break;
      case "taxa_with_reads":
        dropdownOptions = [
          {
            text: "All Taxon",
            value: "all",
            customNode: (
              <div className={cs.taxaWithReadsOption}>
                <div className={cs.taxonName}>All taxon</div>
                <div className={cs.fill} />
                <div className={cs.sampleCount}>{selectedSampleIds.size}</div>
              </div>
            ),
          },
          // Note: BareDropdown with search prioritizes prefix matches, so the final ordering of options
          // might not be the one provided here.
          ...(this.sortTaxaWithReadsOptions(taxaWithReadsOptions) || []),
        ];

        placeholder = "Select taxa";
        menuLabel = "Select taxa";
        showNoResultsMessage = true;
        search = true;
        onFilterChange = this.handleTaxaWithReadsSelectFilterChange;
        className = cs.taxaWithReadsDropdown;
        isLoadingSearchOptions = isLoadingTaxaWithReadsOptionsOptions;

        optionsHeader = (
          <div className={cs.taxaWithReadsOptionsHeader}>
            <div className={cs.header}>Taxa</div>
            <div className={cs.fill} />
            <div className={cs.header}>Samples</div>
          </div>
        );
        break;
      case "background":
        dropdownOptions = backgroundOptions || [];
        placeholder = backgroundOptions ? "Select background" : "Loading...";
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

            // If the user has selected a single taxa, reset the file format field.
            if (
              downloadType.type === READS_NON_HOST_DOWNLOAD_TYPE &&
              field.type === "taxa_with_reads" &&
              isNumber(value)
            ) {
              onFieldSelect(
                READS_NON_HOST_DOWNLOAD_TYPE,
                "file_format",
                undefined,
                undefined
              );
            }
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
    const selected = selectedDownloadTypeName === downloadType.type;
    let disabled = false;
    let disabledMessage = "";

    if (
      downloadType.type === "host_gene_counts" &&
      !allSamplesUploadedByCurrentUser
    ) {
      disabled = true;
      disabledMessage =
        "To download host gene counts, you must be the original uploader of all selected samples.";
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
          <div className={cs.name}>{downloadType.display_name}</div>
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

  render() {
    const { onContinue } = this.props;

    return (
      <div className={cs.chooseStep}>
        <div className={cs.header}>
          <div className={cs.title}>Choose a Download</div>
          <div className={cs.tagline}>Learn More</div>
        </div>
        <div className={cs.downloadTypeContainer}>
          {this.renderDownloadTypes()}
        </div>
        <div className={cs.footer}>
          <PrimaryButton
            disabled={!this.isDownloadValid()}
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
  selectedFields: PropTypes.objectOf(PropTypes.objectOf(PropTypes.string)),
  onFieldSelect: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
  selectedSampleIds: PropTypes.instanceOf(Set),
};

export default ChooseStep;
