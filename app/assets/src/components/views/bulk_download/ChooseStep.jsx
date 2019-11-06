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
} from "lodash/fp";
import cx from "classnames";
import memoize from "memoize-one";

import Dropdown from "~ui/controls/dropdowns/Dropdown";
import LoadingMessage from "~/components/common/LoadingMessage";
import RadioButton from "~ui/controls/RadioButton";
import { getBackgrounds, getTaxonWithReadsSuggestions } from "~/api";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";

import cs from "./choose_step.scss";

const AUTOCOMPLETE_DEBOUNCE_DELAY = 200;

class ChooseStep extends React.Component {
  state = {
    backgroundOptions: null,
    taxonWithReadsOptions: null,
    loadingTaxonWithReadsOptions: false,
  };

  _lastTaxonWithReadsQuery = "";

  componentDidMount() {
    this.fetchBackgrounds();
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

  isDownloadValid = () => {
    const {
      selectedDownloadTypeName,
      downloadTypes,
      selectedFields,
    } = this.props;

    if (!selectedDownloadTypeName) {
      return false;
    }

    const downloadType = find(
      ["type", selectedDownloadTypeName],
      downloadTypes
    );

    if (!downloadType) {
      return false;
    }

    if (downloadType.fields) {
      if (
        some(
          Boolean,
          map(
            field =>
              isUndefined(get([downloadType.type, field.type], selectedFields)),
            downloadType.fields
          )
        )
      ) {
        return false;
      }
    }

    return true;
  };

  handleTaxonWithReadsSelectFilterChange = query => {
    this.setState({
      loadingTaxonWithReadsOptions: true,
    });

    this.loadTaxonWithReadsOptionsForQuery(query);
  };

  // Debounce this function, so it only runs after the user has not typed for a delay.
  loadTaxonWithReadsOptionsForQuery = debounce(
    AUTOCOMPLETE_DEBOUNCE_DELAY,
    async query => {
      this._lastTaxonWithReadsQuery = query;
      const { selectedSampleIds } = this.props;

      const searchResults = await getTaxonWithReadsSuggestions(
        query,
        Array.from(selectedSampleIds)
      );

      // If the query has since changed, discard the response.
      if (query != this._lastTaxonWithReadsQuery) {
        return;
      }

      const taxonWithReadsOptions = searchResults.map(result => ({
        value: result.taxid,
        text: result.title,
        customNode: (
          <div className={cs.taxonWithReadsOption}>
            <div className={cs.taxonName}>{result.title}</div>
            <div className={cs.fill} />
            <div className={cs.sampleCount}>{result.sample_count}</div>
          </div>
        ),
        // Ignored by the dropdown, used for sorting.
        sampleCount: result.sample_count,
      }));

      this.setState({
        taxonWithReadsOptions,
        loadingTaxonWithReadsOptions: false,
      });
    }
  );

  sortTaxonWithReadsOptions = memoize(options =>
    orderBy(["sampleCount", "text"], ["desc", "asc"], options)
  );

  renderOption = (downloadType, field) => {
    const { selectedFields, onFieldSelect, selectedSampleIds } = this.props;
    const {
      backgroundOptions,
      taxonWithReadsOptions,
      loadingTaxonWithReadsOptions,
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
    let loadingSearchOptions = false;

    // Set different props for the dropdown depending on the field type.
    switch (field.type) {
      case "file_format":
        dropdownOptions = field.options.map(option => ({
          text: option,
          value: option,
        }));

        placeholder = "Select file format";
        break;
      case "taxon_with_reads":
        dropdownOptions = [
          {
            text: "All Taxon",
            value: "all",
            customNode: (
              <div className={cs.taxonWithReadsOption}>
                <div className={cs.taxonName}>All taxon</div>
                <div className={cs.fill} />
                <div className={cs.sampleCount}>{selectedSampleIds.size}</div>
              </div>
            ),
          },
          // Note: BareDropdown with search prioritizes prefix matches, so the final ordering of options
          // might not be the one provided here.
          ...(this.sortTaxonWithReadsOptions(taxonWithReadsOptions) || []),
        ];

        placeholder = "Select taxa";
        menuLabel = "Select taxa";
        showNoResultsMessage = true;
        search = true;
        onFilterChange = this.handleTaxonWithReadsSelectFilterChange;
        className = cs.taxonWithReadsDropdown;
        loadingSearchOptions = loadingTaxonWithReadsOptions;

        optionsHeader = (
          <div className={cs.taxonWithReadsOptionsHeader}>
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
          onChange={(value, displayName) =>
            onFieldSelect(downloadType.type, field.type, value, displayName)
          }
          value={selectedField}
          optionsHeader={optionsHeader}
          menuLabel={menuLabel}
          className={className}
          usePortal
          withinModal
          search={search}
          onFilterChange={onFilterChange}
          showNoResultsMessage={showNoResultsMessage}
          loadingSearchOptions={loadingSearchOptions}
        />
      </div>
    );
  };

  renderDownloadType = downloadType => {
    const { selectedDownloadTypeName, onSelect } = this.props;
    const selected = selectedDownloadTypeName === downloadType.type;
    return (
      <div
        className={cx(cs.downloadType, selected && cs.selected)}
        key={downloadType.type}
        onClick={() => onSelect(downloadType.type)}
      >
        <RadioButton className={cs.radioButton} selected={selected} />
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
