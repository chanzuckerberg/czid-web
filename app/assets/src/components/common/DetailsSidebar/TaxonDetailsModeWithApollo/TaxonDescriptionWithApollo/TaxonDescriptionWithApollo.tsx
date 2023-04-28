import { gql } from "@apollo/client";
import cx from "classnames";
import React, { LegacyRef, useEffect, useRef, useState } from "react";
import { withAnalytics } from "~/api/analytics";
import { initalCache } from "~/cache";
import { federationClient } from "~/index";
import { WikipediaLicenseWithApollo } from "../WikipediaLicenseWithApollo";
import cs from "./taxon_description.scss";

const COLLAPSED_HEIGHT = 120;

interface TaxonDescriptionProps {
  taxonId: number;
  taxonList: number[];
}

export const TaxonDescriptionWithApollo = ({
  taxonId,
  taxonList,
}: TaxonDescriptionProps) => {
  const taxonDescriptionRef: LegacyRef<HTMLDivElement> = useRef(null);

  const [isTall, setIsTall] = useState<boolean>(false);
  const [shouldCollapse, setShouldCollapse] = useState<boolean>(true);
  const isParent = taxonList[1] === taxonId;

  useEffect(() => {
    if (
      taxonDescriptionRef?.current?.clientHeight > COLLAPSED_HEIGHT &&
      !isTall
    ) {
      setIsTall(true);
    }
  }, [taxonDescriptionRef?.current?.clientHeight, isTall]);

  const { summary, title, wikiUrl } = federationClient.readFragment({
    id: initalCache.identify({
      __typename: "TaxonDescription",
      taxId: taxonId,
    }),
    fragment: gql`
      fragment SingleTaxonDescription on TaxonDescription {
        summary
        title
        wikiUrl
      }
    `,
  });

  const { title: nonParentTitle } = federationClient.readFragment({
    id: initalCache.identify({
      __typename: "TaxonDescription",
      taxId: taxonList[0],
    }),
    fragment: gql`
      fragment TaxonName on TaxonDescription {
        title
      }
    `,
  });

  const handleShowMore = withAnalytics(
    () => setShouldCollapse(false),
    `TaxonDetailsMode_show-more${
      isParent && "-parent"
    }-description-link_clicked`,
    {
      taxonId: taxonList[0],
      parentTaxonId: taxonList[1],
      taxonName: isParent ? title : nonParentTitle,
    },
  );

  if (!summary) return null;

  return (
    <section>
      <div className={cs.subtitle}>
        {!isParent ? "Description" : `Genus: ${title}`}
      </div>
      <div className={cx(cs.text, shouldCollapse && cs.collapsed)}>
        <div ref={taxonDescriptionRef} data-testid={"taxon-description"}>
          {summary}
          <WikipediaLicenseWithApollo taxonName={title} wikiUrl={wikiUrl} />
        </div>
      </div>
      {shouldCollapse && isTall && (
        <button className={cs.expandLink} onClick={handleShowMore}>
          Show More
        </button>
      )}
    </section>
  );
};
