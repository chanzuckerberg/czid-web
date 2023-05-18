import React from "react";
import { Background } from "~/interface/shared/specific";
import cs from "./taxon_details_mode.scss";
import { TaxonDescriptionWithApollo } from "./TaxonDescriptionWithApollo";
import { TaxonHistogramWithApollo } from "./TaxonHistogramWithApollo";
import { TaxonLinksWithApollo } from "./TaxonLinksWithApollo";

export type TaxonValuesType = {
  NT: { rpm: number | string };
  NR: { rpm: number | string };
};
export interface TaxonDetailsModeProps {
  background?: Background;
  parentTaxonId?: number;
  taxonId: number;
  taxonValues?: TaxonValuesType;
  taxonName: string;
}

export const TaxonDetailsModeWithApollo = ({
  background,
  parentTaxonId,
  taxonId,
  taxonValues,
  taxonName,
}: TaxonDetailsModeProps) => {
  const taxonIdList = [taxonId];

  if (parentTaxonId) {
    taxonIdList.push(parentTaxonId);
  }

  return (
    <div className={cs.content}>
      <div className={cs.title} data-testid={"taxon-name"}>
        {taxonName}
      </div>
      {taxonId > 0 && (
        <div className={cs.subtitle} data-testid={"taxon-id"}>
          Taxonomy ID: {taxonId}
        </div>
      )}
      <div className={cs.taxonContents}>
        {/* For each item in the taxonId list, render a Taxon description
        // If this is the second item it is the parent taxon */}
        {taxonIdList.map(taxonId => {
          return (
            <TaxonDescriptionWithApollo
              key={taxonId}
              taxonId={taxonId}
              taxonIdList={taxonIdList}
            />
          );
        })}
        <TaxonHistogramWithApollo
          background={background}
          taxonId={taxonId}
          taxonValues={taxonValues}
        />
        <TaxonLinksWithApollo
          taxonId={taxonId}
          parentTaxonId={parentTaxonId}
          taxonName={taxonName}
        />
      </div>
    </div>
  );
};
