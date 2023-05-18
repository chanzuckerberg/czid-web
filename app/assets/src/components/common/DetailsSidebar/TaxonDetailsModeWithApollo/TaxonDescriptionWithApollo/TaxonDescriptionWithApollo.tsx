import { useQuery } from "@apollo/client";
import cx from "classnames";
import React, { LegacyRef, useEffect, useRef, useState } from "react";
import { withAnalytics } from "~/api/analytics";
import { QueryResult } from "~/components/common/QueryResult";
import { federationClient } from "~/index";
import { GET_TAXON_DESCRIPTION } from "../queries";
import { WikipediaLicenseWithApollo } from "../WikipediaLicenseWithApollo";
import cs from "./taxon_description.scss";

const COLLAPSED_HEIGHT = 120;

interface TaxonDescriptionProps {
  taxonId: number;
  taxonIdList: number[];
}

export const TaxonDescriptionWithApollo = ({
  taxonId,
  taxonIdList,
}: TaxonDescriptionProps) => {
  const taxonDescriptionRef: LegacyRef<HTMLDivElement> = useRef(null);

  const [isTall, setIsTall] = useState<boolean>(false);
  const [shouldCollapse, setShouldCollapse] = useState<boolean>(true);
  const isParent = taxonIdList[1] === taxonId;

  const { loading, error, data } = useQuery(GET_TAXON_DESCRIPTION, {
    variables: { taxonIdList },
    // TODO: (smccanny): delete this once rails and graphql are integrated under a single client
    client: federationClient,
  });

  useEffect(() => {
    if (
      taxonDescriptionRef?.current?.clientHeight > COLLAPSED_HEIGHT &&
      !isTall
    ) {
      setIsTall(true);
    }
  }, [taxonDescriptionRef?.current?.clientHeight, isTall, data]);

  const index = isParent || taxonIdList.length === 1 ? 0 : 1;
  const { title, summary, wikiUrl } = data?.taxonDescription[index] || {};
  const handleShowMore = withAnalytics(
    () => setShouldCollapse(false),
    `TaxonDetailsMode_show-more${
      isParent && "-parent"
    }-description-link_clicked`,
    {
      taxonId: taxonIdList[0],
      parentTaxonId: taxonIdList[1],
      taxonName: isParent ? title : data?.taxonDescription[1]?.title,
    },
  );

  if (!summary) return null;

  return (
    <QueryResult
      loading={loading}
      loadingType={"none"}
      error={error}
      data={data}
    >
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
    </QueryResult>
  );
};
