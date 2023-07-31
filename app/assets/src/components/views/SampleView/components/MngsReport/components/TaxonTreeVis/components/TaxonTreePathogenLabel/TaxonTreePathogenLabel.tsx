import React from "react";
import PathogenLabel from "~/components/ui/labels/PathogenLabel";

interface TaxonTreePathogenLabelProps {
  taxId: number;
  tagType: string;
}

export const TaxonTreePathogenLabel = ({
  taxId,
  tagType,
}: TaxonTreePathogenLabelProps) => {
  return (
    <div
      className={`node-overlay node-overlay__${taxId}`} // node-overlay__${taxId} used by TidyTree to select nodes
      key={`label-${taxId}-${tagType}`}
    >
      <PathogenLabel type={tagType} />
    </div>
  );
};
