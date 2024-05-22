import React from "react";
import { Taxon } from "~/interface/shared";
import { TaxonTreePathogenLabel } from "../TaxonTreePathogenLabel";

interface TaxonTreePathogenLabelsProps {
  taxa: Taxon[];
}

// TODO: This should be a ul with li inside for accessibility
export const TaxonTreePathogenLabels = ({
  taxa,
}: TaxonTreePathogenLabelsProps) => {
  const labels: JSX.Element[] = [];

  taxa.forEach(genusData => {
    if (genusData.pathogenFlag) {
      labels.push(
        <TaxonTreePathogenLabel
          key={`label-${genusData.taxId}-${genusData.pathogenFlag}`}
          taxId={genusData.taxId}
          tagType={genusData.pathogenFlag}
        />,
      );
    }
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    genusData.filteredSpecies.forEach(speciesData => {
      if (speciesData.pathogenFlag) {
        labels.push(
          <TaxonTreePathogenLabel
            key={`label-${speciesData.taxId}-${speciesData.pathogenFlag}`}
            taxId={speciesData.taxId}
            tagType={speciesData.pathogenFlag}
          />,
        );
      }
    });
  });

  return <div className="pathogen-labels">{labels}</div>;
};
