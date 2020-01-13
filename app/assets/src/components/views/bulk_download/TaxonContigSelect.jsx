// Given a set of samples, allows the user to select a taxon that had contigs align to it
// in at least one of the samples.
// For each taxon, provides a count of how many of the provided samples had contigs align to that taxon.
import React from "react";
import { debounce, orderBy } from "lodash/fp";
import memoize from "memoize-one";

import { getTaxaWithContigsSuggestions } from "~/api";
import PropTypes from "~/components/utils/propTypes";
import Dropdown from "~ui/controls/dropdowns/Dropdown";

import cs from "./taxon_contig_select.scss";

const AUTOCOMPLETE_DEBOUNCE_DELAY = 200;

class TaxonContigSelect extends React.Component {
  state = {
    options: null,
    isLoadingOptions: false,
  };

  _lastQuery = "";

  handleFilterChange = query => {
    this.setState({
      isLoadingOptions: true,
    });

    this.loadOptionsForQuery(query);
  };

  // Debounce this function, so it only runs after the user has not typed for a delay.
  loadOptionsForQuery = debounce(AUTOCOMPLETE_DEBOUNCE_DELAY, async query => {
    this._lastQuery = query;
    const { sampleIds } = this.props;

    const searchResults = await getTaxaWithContigsSuggestions(
      query,
      Array.from(sampleIds)
    );

    // If the query has since changed, discard the response.
    if (query != this._lastQuery) {
      return;
    }

    const options = searchResults.map(result => ({
      value: result.taxid,
      text: result.title,
      customNode: (
        <div className={cs.option}>
          <div className={cs.taxonName}>{result.title}</div>
          <div className={cs.fill} />
          <div className={cs.sampleCount}>{result.sample_count_contigs}</div>
        </div>
      ),
      // Ignored by the dropdown, used for sorting.
      sampleCount: result.sample_count_contigs,
    }));

    this.setState({
      options,
      isLoadingOptions: false,
    });
  });

  sortOptions = memoize(options =>
    orderBy(["sampleCount", "text"], ["desc", "asc"], options)
  );

  render() {
    const { sampleIds, onChange, value, usePortal, withinModal } = this.props;
    const { options, isLoadingOptions } = this.state;

    const dropdownOptions = [
      {
        text: "All Taxa",
        value: "all",
        customNode: (
          <div className={cs.option}>
            <div className={cs.taxonName}>All taxa</div>
            <div className={cs.fill} />
            <div className={cs.sampleCount}>{sampleIds.size}</div>
          </div>
        ),
      },
      // Note: BareDropdown with search prioritizes prefix matches, so the final ordering of options
      // might not be the one provided here.
      ...(this.sortOptions(options) || []),
    ];

    const optionsHeader = (
      <div className={cs.optionsHeader}>
        <div className={cs.header}>Taxon</div>
        <div className={cs.fill} />
        <div className={cs.header}>Samples</div>
      </div>
    );

    return (
      <Dropdown
        fluid
        placeholder="Select taxon"
        options={dropdownOptions}
        onChange={onChange}
        value={value}
        optionsHeader={optionsHeader}
        menuLabel="Select taxon"
        className={cs.taxaWithContigsDropdown}
        search
        onFilterChange={this.handleFilterChange}
        showNoResultsMessage
        isLoadingSearchOptions={isLoadingOptions}
        usePortal={usePortal}
        withinModal={withinModal}
      />
    );
  }
}

TaxonContigSelect.propTypes = {
  sampleIds: PropTypes.instanceOf(Set),
  onChange: PropTypes.func,
  value: PropTypes.number, // The currently selected taxid.
  usePortal: PropTypes.bool,
  withinModal: PropTypes.bool,
};

TaxonContigSelect.defaultProps = {
  usePortal: true,
  withinModal: true,
};

export default TaxonContigSelect;
