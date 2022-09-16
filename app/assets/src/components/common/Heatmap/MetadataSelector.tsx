// *** Metadata selector is a component shared between the AMR
// and Taxon heatmaps that displays a dropdown checklist (with search box)
// when a user clicks on the "Add Metadata" button on the Heatmap. ***

import React from "react";
import { LabelVal } from "~/interface/shared";

import { ContextPlaceholder } from "~ui/containers";
import { SearchBoxList } from "~ui/controls";

import cs from "./metadata_selector.scss";

interface MetadataSelectorProps {
  addMetadataTrigger: Element;
  metadataTypes: LabelVal[];
  selectedMetadata: Set<string>;
  onMetadataSelectionChange: (selected: Set<unknown>) => void;
  onMetadataSelectionClose: () => void;
}

const MetadataSelector = ({
  addMetadataTrigger,
  metadataTypes,
  onMetadataSelectionChange,
  onMetadataSelectionClose,
  selectedMetadata,
}: MetadataSelectorProps) => {
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
};

export default MetadataSelector;
