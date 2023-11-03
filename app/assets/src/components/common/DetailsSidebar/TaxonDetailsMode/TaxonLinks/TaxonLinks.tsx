import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import cs from "./taxon_links.scss";

interface TaxonLinksProps {
  taxonId: number;
  taxonName: string;
  parentTaxonId: number;
  wikiUrl: string;
}

export const TaxonLinks = ({
  taxonId,
  taxonName,
  parentTaxonId,
  wikiUrl,
}: TaxonLinksProps) => {
  const renderLink = (source: string, label: string) => {
    let url = null;

    switch (source) {
      case "ncbi":
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        url = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${taxonId}`;
        break;
      case "google":
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        url = `http://www.google.com/search?q=${taxonName}`;
        break;
      case "pubmed":
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        url = `https://www.ncbi.nlm.nih.gov/pubmed/?term=${taxonName}`;
        break;
      case "wikipedia":
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        url = wikiUrl;
        break;
      default:
        break;
    }
    return (
      <ExternalLink
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        href={url}
        data-testid={"taxon-link"}
        analyticsEventName="TaxonDetailsMode_external-link_clicked"
        analyticsEventData={{
          source,
          url,
          taxonId,
          taxonName,
          parentTaxonId,
        }}
      >
        {label}
      </ExternalLink>
    );
  };

  return (
    <>
      <div className={cs.subtitle}>Links</div>
      <div className={cs.linksSection}>
        <ul className={cs.linksList}>
          <li className={cs.link}>{renderLink("ncbi", "NCBI")}</li>
          <li className={cs.link}>{renderLink("google", "Google")}</li>
        </ul>
        <ul className={cs.linksList}>
          {wikiUrl && (
            <li className={cs.link}>{renderLink("wikipedia", "Wikipedia")}</li>
          )}
          <li className={cs.link}>{renderLink("pubmed", "Pubmed")}</li>
        </ul>
      </div>
    </>
  );
};
