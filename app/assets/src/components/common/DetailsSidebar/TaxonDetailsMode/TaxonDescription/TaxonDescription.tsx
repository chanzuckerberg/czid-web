import cx from "classnames";
import React, { LegacyRef, useEffect, useRef, useState } from "react";
import { withAnalytics } from "~/api/analytics";
import { WikipediaLicense } from "../WikipediaLicense";

import cs from "./taxon_description.scss";

const COLLAPSED_HEIGHT = 120;

interface TaxonDescriptionProps {
  subtitle: string;
  description: string;
  name: string;
  wikiUrl: string;
  onExpandAnalyticsId: string;
  onExpandAnalyticsParams: {
    taxonId: number;
    taxonName: string;
    parentTaxonId: number;
  };
}

export const TaxonDescription = ({
  subtitle,
  description,
  name,
  wikiUrl,
  onExpandAnalyticsId,
  onExpandAnalyticsParams,
}: TaxonDescriptionProps) => {
  const taxonDescriptionRef: LegacyRef<HTMLDivElement> = useRef(null);

  const [isTall, setIsTall] = useState<boolean>(false);
  const [shouldCollapse, setShouldCollapse] = useState<boolean>(true);

  useEffect(() => {
    if (
      taxonDescriptionRef?.current?.clientHeight > COLLAPSED_HEIGHT &&
      !isTall
    ) {
      setIsTall(true);
    }
  }, [taxonDescriptionRef?.current?.clientHeight, isTall]);

  const handleShowMore = withAnalytics(
    () => setShouldCollapse(false),
    onExpandAnalyticsId,
    onExpandAnalyticsParams,
  );

  if (!description) return null;

  return (
    <div>
      <div className={cs.subtitle}>{subtitle}</div>
      <div className={cx(cs.text, shouldCollapse && cs.collapsed)}>
        <div ref={taxonDescriptionRef}>
          {description}
          <WikipediaLicense taxonName={name} wikiUrl={wikiUrl} />
        </div>
      </div>
      {shouldCollapse && isTall && (
        <div className={cs.expandLink} onClick={handleShowMore}>
          Show More
        </div>
      )}
    </div>
  );
};
