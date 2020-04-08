import React from "react";
import PropTypes from "prop-types";

import { ContextPlaceholder } from "~ui/containers";
import { SearchBoxList } from "~ui/controls";

import cs from "./metadata_selector.scss";

export default class TaxonSelector extends React.Component {
  render() {
    const {
      addTaxonTrigger,
      availableTaxa,
      onTaxonSelectionChange,
      onTaxonSelectionClose,
      selectedTaxa,
    } = this.props;
    return (
      <ContextPlaceholder
        closeOnOutsideClick
        context={addTaxonTrigger}
        horizontalOffset={5}
        verticalOffset={10}
        onClose={onTaxonSelectionClose}
        position="bottom left"
      >
        <div className={cs.metadataContainer}>
          <SearchBoxList
            options={availableTaxa}
            onChange={onTaxonSelectionChange}
            selected={selectedTaxa}
            title="Select Taxon"
            labelTitle="Taxa"
            countTitle="Samples"
            minWidth={240}
          />
        </div>
      </ContextPlaceholder>
    );
  }
}

TaxonSelector.propTypes = {
  addTaxonTrigger: PropTypes.object,
  availableTaxa: PropTypes.array,
  selectedTaxa: PropTypes.object,
  onTaxonSelectionChange: PropTypes.func,
  onTaxonSelectionClose: PropTypes.func,
};
