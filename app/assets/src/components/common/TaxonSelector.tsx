import { debounce } from "lodash/fp";
import React from "react";
import { getTaxaWithReadsSuggestions } from "~/api";
import { ContextPlaceholder } from "~ui/containers";
import { SearchBoxList } from "~ui/controls";
import { HEATMAP_FILTERS_LEFT_FEATURE } from "../utils/features";
import cs from "./Heatmap/metadata_selector.scss";
import { UserContext } from "./UserContext";

const AUTOCOMPLETE_DEBOUNCE_DELAY = 200;

interface TaxonSelectorProps {
  addTaxonTrigger: Element;
  availableTaxa: { count: number; label: string; value: number }[];
  sampleIds: number[];
  selectedTaxa: Set<number>;
  onTaxonSelectionChange: (selected: Set<unknown>) => void;
  onTaxonSelectionClose: () => void;
  taxLevel: string;
}

export default class TaxonSelector extends React.Component<TaxonSelectorProps> {
  state = {
    options: this.props.availableTaxa,
  };

  _lastQuery = "";

  handleFilterChange = (query: string) => {
    this.loadOptionsForQuery(query);
  };

  // Debounce this function, so it only runs after the user has not typed for a delay.
  loadOptionsForQuery = debounce(
    AUTOCOMPLETE_DEBOUNCE_DELAY,
    async (query: string) => {
      this._lastQuery = query;
      const { sampleIds, availableTaxa, taxLevel } = this.props;

      const searchResults = await getTaxaWithReadsSuggestions(
        query,
        Array.from(sampleIds),
        taxLevel,
      );

      // If the query has since changed, discard the response.
      if (query !== this._lastQuery) {
        return;
      }

      const options = searchResults.map(result => ({
        value: result.taxid,
        label: result.title,
        count: result.sample_count,
      }));

      if (query.length > 0) {
        this.setState({ options });
      } else {
        // If there is currently no search query, then default to the selected and available taxa.
        this.setState({ options: availableTaxa });
      }
    },
  );

  render() {
    const {
      addTaxonTrigger,
      onTaxonSelectionChange,
      onTaxonSelectionClose,
      selectedTaxa,
    } = this.props;
    const { options } = this.state;

    const { allowedFeatures = [] } = this.context || {};
    const useNewFilters = allowedFeatures.includes(
      HEATMAP_FILTERS_LEFT_FEATURE,
    );

    return (
      <ContextPlaceholder
        closeOnOutsideClick
        context={addTaxonTrigger}
        horizontalOffset={5}
        verticalOffset={10}
        onClose={onTaxonSelectionClose}
        position="top left"
      >
        <div
          className={
            useNewFilters ? cs.newMetadataContainer : cs.metadataContainer
          }
        >
          <SearchBoxList
            options={options}
            onChange={onTaxonSelectionChange}
            selected={selectedTaxa}
            onFilterChange={this.handleFilterChange}
            title="Select Taxon"
            labelTitle="Taxa"
            countTitle="Samples"
          />
        </div>
      </ContextPlaceholder>
    );
  }
}
TaxonSelector.contextType = UserContext;
