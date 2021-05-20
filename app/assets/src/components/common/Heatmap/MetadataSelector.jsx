// *** Metadata selector is a component shared between the AMR
// and Taxon heatmaps that displays a dropdown checklist (with search box)
// when a user clicks on the "Add Metadata" button on the Heatmap. ***

import PropTypes from "prop-types";
import React from "react";

import { ContextPlaceholder } from "~ui/containers";
import { SearchBoxList } from "~ui/controls";

import cs from "./metadata_selector.scss";

export default class MetadataSelector extends React.Component {
  render() {
    const {
      addMetadataTrigger,
      metadataTypes,
      onMetadataSelectionChange,
      onMetadataSelectionClose,
      selectedMetadata,
    } = this.props;
    return (
      <ContextPlaceholder
        closeOnOutsideClick
        context={addMetadataTrigger}
        horizontalOffset={5}
        verticalOffset={10}
        onClose={onMetadataSelectionClose}
        position="bottom right"
      >
        <div className={cs.metadataContainer}>
          <SearchBoxList
            options={metadataTypes}
            onChange={onMetadataSelectionChange}
            selected={selectedMetadata}
            title="Select Metadata Fields"
          />
        </div>
      </ContextPlaceholder>
    );
  }
}

MetadataSelector.propTypes = {
  addMetadataTrigger: PropTypes.object,
  metadataTypes: PropTypes.array,
  selectedMetadata: PropTypes.object,
  onMetadataSelectionChange: PropTypes.func,
  onMetadataSelectionClose: PropTypes.func,
};
