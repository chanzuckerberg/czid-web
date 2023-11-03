// Given a set of samples, allows the user to select a taxon that had hits (reads or contigs) align to it
// in at least one of the samples.
// For each taxon, provides a count of how many of the provided samples had hits align to that taxon.
import { debounce, orderBy } from "lodash/fp";
import memoize from "memoize-one";
import React from "react";
import {
  getTaxaWithContigsSuggestions,
  getTaxaWithReadsSuggestions,
} from "~/api";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import cs from "./taxon_hit_select.scss";

const AUTOCOMPLETE_DEBOUNCE_DELAY = 200;

interface TaxonHitSelectProps {
  sampleIds?: Set<$TSFixMeUnknown>;
  onChange?: $TSFixMeFunction;
  value?: number;
  usePortal?: boolean; // The currently selected taxid.;
  withinModal?: boolean;
  hitType?: "read" | "contig";
}

class TaxonHitSelect extends React.Component<TaxonHitSelectProps> {
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
    const { sampleIds, hitType } = this.props;

    const suggestionsEndpoint =
      hitType === "contig"
        ? getTaxaWithContigsSuggestions
        : getTaxaWithReadsSuggestions;

    const searchResults = await suggestionsEndpoint(
      query,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
      Array.from(sampleIds),
    );

    // If the query has since changed, discard the response.
    if (query !== this._lastQuery) {
      return;
    }

    const options = searchResults.map(result => ({
      value: result.taxid,
      text: result.title,
      customNode: (
        <div className={cs.option}>
          <div className={cs.taxonName}>{result.title}</div>
          <div className={cs.fill} />
          <div className={cs.sampleCount}>{result.sample_count}</div>
        </div>
      ),
      // Ignored by the dropdown, used for sorting.
      sampleCount: result.sample_count,
    }));

    this.setState({
      options,
      isLoadingOptions: false,
    });
  });

  sortOptions = memoize(options =>
    orderBy(["sampleCount", "text"], ["desc", "asc"], options),
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
            {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
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
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        onChange={onChange}
        value={value}
        optionsHeader={optionsHeader}
        menuLabel="Select taxon"
        className={cs.taxaWithHitsDropdown}
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

// @ts-expect-error Property 'defaultProps' does not exist on type 'typeof TaxonHitSelect'
TaxonHitSelect.defaultProps = {
  usePortal: true,
  withinModal: true,
};

export default TaxonHitSelect;
