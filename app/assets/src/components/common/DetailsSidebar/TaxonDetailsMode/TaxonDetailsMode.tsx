import React, { useEffect, useState } from "react";
import { getTaxonDescriptions } from "~/api";
import { Background } from "~/interface/shared/specific";
import { TaxonDescription } from "./TaxonDescription";
import { TaxonHistogram } from "./TaxonHistogram";
import { TaxonLinks } from "./TaxonLinks";
import cs from "./taxon_details_mode.scss";

export type TaxonValuesType = {
  NT: { rpm: number | string };
  NR: { rpm: number | string };
};
export interface TaxonDetailsModeProps {
  background: Background | null;
  parentTaxonId?: number;
  taxonId: number;
  taxonName: string;
  taxonValues?: TaxonValuesType;
}

export const TaxonDetailsMode = ({
  background,
  parentTaxonId,
  taxonId,
  taxonName,
  taxonValues,
}: TaxonDetailsModeProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [taxonDescription, setTaxonDescription] = useState<string>("");
  const [taxonParentName, setTaxonParentName] = useState<string>("");
  const [taxonParentDescription, setTaxonParentDescription] =
    useState<string>("");
  const [wikiUrl, setWikiUrl] = useState<string>("");
  const [parentWikiUrl, setParentWikiUrl] = useState<string>("");

  const resetState = () => {
    setIsLoading(true);
    setTaxonDescription("");
    setTaxonParentName("");
    setTaxonParentDescription("");
    setWikiUrl("");
    setParentWikiUrl("");
  };

  useEffect(() => {
    const loadTaxonInfo = async () => {
      const taxonList = [taxonId];

      if (parentTaxonId) {
        taxonList.push(parentTaxonId);
      }

      try {
        const response = await getTaxonDescriptions(taxonList);
        const taxonInfo = response[taxonId];
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
        const parentTaxonInfo = response[parentTaxonId];

        if (taxonInfo) {
          setTaxonDescription(taxonInfo.summary ?? "");
          setWikiUrl(taxonInfo.wiki_url ?? "");
        }

        if (parentTaxonInfo) {
          setTaxonParentName(parentTaxonInfo.title);
          setTaxonParentDescription(parentTaxonInfo.summary);
          setParentWikiUrl(parentTaxonInfo.wiki_url);
        }
      } catch (error) {
        // TODO: properly handle error
        // eslint-disable-next-line no-console
        console.error("Error loading taxon information: ", error);
      }

      setIsLoading(false);
    };
    resetState();
    loadTaxonInfo();
  }, [taxonId, background, parentTaxonId]);

  const onExpandAnalyticsParams = {
    taxonId,
    taxonName,
    parentTaxonId,
  };

  if (isLoading) {
    return <div className={cs.loadingMsg}>Loading...</div>;
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
        {/* Describe taxon first */}
        <TaxonDescription
          subtitle="Description"
          description={taxonDescription}
          name={taxonName}
          wikiUrl={wikiUrl}
          onExpandAnalyticsId="TaxonDetailsMode_show-more-description-link_clicked"
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          onExpandAnalyticsParams={onExpandAnalyticsParams}
        />
        {/* Then describe parent second */}
        <TaxonDescription
          subtitle={`Genus: ${taxonParentName}`}
          description={taxonParentDescription}
          name={taxonParentName}
          wikiUrl={parentWikiUrl}
          onExpandAnalyticsId="TaxonDetailsMode_show-more-parent-description-link_clicked"
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          onExpandAnalyticsParams={onExpandAnalyticsParams}
        />
        <TaxonHistogram
          background={background}
          taxonId={taxonId}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          taxonValues={taxonValues}
        />
        <TaxonLinks
          taxonId={taxonId}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          parentTaxonId={parentTaxonId}
          taxonName={taxonName}
          wikiUrl={wikiUrl}
        />
      </div>
    </div>
  );
};
