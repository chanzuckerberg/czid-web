import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import { MULTITAG_PATHOGENS_FEATURE } from "~/components/utils/features";
import { Taxon } from "~/interface/shared";
import { TaxonTreePathogenLabel } from "../TaxonTreePathogenLabel/TaxonTreePathogenLabel";

interface TaxonTreePathogenLabelsProps {
  taxa: Taxon[];
}

// TODO: This should be a ul with li inside for accessibility
export const TaxonTreePathogenLabels = ({
  taxa,
}: TaxonTreePathogenLabelsProps) => {
  const { allowedFeatures = [] } = useContext(UserContext) || {};
  const labels: JSX.Element[] = [];

  taxa.forEach(genusData => {
    if (allowedFeatures.includes(MULTITAG_PATHOGENS_FEATURE)) {
      if (genusData.pathogenFlags) {
        genusData.pathogenFlags.forEach(pathogenFlag => {
          labels.push(
            <TaxonTreePathogenLabel
              taxId={genusData.taxId}
              tagType={pathogenFlag}
            />,
          );
        });
      }
      genusData.filteredSpecies.forEach(speciesData => {
        if (speciesData.pathogenFlags) {
          speciesData.pathogenFlags.forEach(pathogenFlag => {
            labels.push(
              <TaxonTreePathogenLabel
                taxId={genusData.taxId}
                tagType={pathogenFlag}
              />,
            );
          });
        }
      });
    } else {
      if (genusData.pathogenFlag) {
        labels.push(
          <TaxonTreePathogenLabel
            taxId={genusData.taxId}
            tagType={genusData.pathogenFlag}
          />,
        );
      }
      genusData.filteredSpecies.forEach(speciesData => {
        if (speciesData.pathogenFlag) {
          labels.push(
            <TaxonTreePathogenLabel
              taxId={speciesData.taxId}
              tagType={speciesData.pathogenFlag}
            />,
          );
        }
      });
    }
  });

  return <div className="pathogen-labels">{labels}</div>;
};
