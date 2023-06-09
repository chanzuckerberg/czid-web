import { LoadingIndicator } from "czifui";
import React, { useState } from "react";
import { Background } from "~/interface/shared/specific";
import { DESCRIPTION_PREFIX, HISTOGRAM_PREFIX } from "./constants";
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
  const [childrenAreLoading, setChildrenAreLoading] = useState(false);

  if (parentTaxonId) {
    taxonIdList.push(parentTaxonId);
  }

  // create object to track loading status of child components
  const childComponents = {};
  taxonIdList.forEach(id => {
    childComponents[`${DESCRIPTION_PREFIX}${id}`] = false;
  });
  childComponents[`${HISTOGRAM_PREFIX}${taxonId}`] = false;

  const recordLoadingStatus = (loading: boolean, id: string) => {
    childComponents[id] = loading;
    // if any of the children are loading, the parent is loading
    setChildrenAreLoading(Object.values(childComponents).includes(true));
  };

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
        {childrenAreLoading && <LoadingIndicator sdsStyle={"minimal"} />}
        {/* For each item in the taxonId list, render a Taxon description
        // If this is the second item it is the parent taxon */}
        {taxonIdList.map(taxonId => {
          return (
            <TaxonDescriptionWithApollo
              key={taxonId}
              taxonId={taxonId}
              taxonIdList={taxonIdList}
              reportLoadingStatus={recordLoadingStatus}
            />
          );
        })}
        <TaxonHistogramWithApollo
          background={background}
          taxonId={taxonId}
          taxonValues={taxonValues}
          reportLoadingStatus={recordLoadingStatus}
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
