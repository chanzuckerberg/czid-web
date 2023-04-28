import React from "react";
import { useSimpleQuery } from "~/customHooks/useSimpleQuery";
import { Background } from "~/interface/shared/specific";
import { QueryResult } from "../../QueryResult";
import { GET_TAXON_DESCRIPTION } from "./queries";
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
}

export const TaxonDetailsModeWithApollo = ({
  background,
  parentTaxonId,
  taxonId,
  taxonValues,
}: TaxonDetailsModeProps) => {
  const taxonIdList = [taxonId];

  if (parentTaxonId) {
    taxonIdList.push(parentTaxonId);
  }

  const { loading, error, data } = useSimpleQuery(GET_TAXON_DESCRIPTION, {
    taxonIdList,
  });

  return (
    <QueryResult error={error} loading={loading} data={data}>
      <div className={cs.content}>
        <div className={cs.title} data-testid={"taxon-name"}>
          {data?.taxonDescription[0]?.title}
        </div>
        {taxonId > 0 && (
          <div className={cs.subtitle} data-testid={"taxon-id"}>
            Taxonomy ID: {taxonId}
          </div>
        )}
        <div className={cs.taxonContents}>
          {/* For each item in the taxonId list, render a Taxon description
          // If this is the second item it is the parent taxon */}
          {taxonIdList.map((taxonId, index) => {
            return (
              <TaxonDescriptionWithApollo
                key={index}
                taxonId={taxonId}
                taxonList={taxonIdList}
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
          />
        </div>
      </div>
    </QueryResult>
  );
};
