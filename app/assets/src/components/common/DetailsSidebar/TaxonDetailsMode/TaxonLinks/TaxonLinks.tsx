import React from "react";
import { trackEvent } from "~/api/analytics";
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
  const linkTo = (source: string) => {
    let url = null;

    switch (source) {
      case "ncbi":
        url = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${taxonId}`;
        break;
      case "google":
        url = `http://www.google.com/search?q=${taxonName}`;
        break;
      case "pubmed":
        url = `https://www.ncbi.nlm.nih.gov/pubmed/?term=${taxonName}`;
        break;
      case "wikipedia":
        url = wikiUrl;
        break;
      default:
        break;
    }

    if (url) {
      window.open(url, "_blank", "noreferrer");
      trackEvent("TaxonDetailsMode_external-link_clicked", {
        source,
        url,
        taxonId,
        taxonName,
        parentTaxonId,
      });
    }
  };

  return (
    <>
      <div className={cs.subtitle}>Links</div>
      <div className={cs.linksSection}>
        <ul className={cs.linksList}>
          <li className={cs.link} onClick={() => linkTo("ncbi")}>
            NCBI
          </li>
          <li className={cs.link} onClick={() => linkTo("google")}>
            Google
          </li>
        </ul>
        <ul className={cs.linksList}>
          {wikiUrl && (
            <li className={cs.link} onClick={() => linkTo("wikipedia")}>
              Wikipedia
            </li>
          )}
          <li className={cs.link} onClick={() => linkTo("pubmed")}>
            Pubmed
          </li>
        </ul>
      </div>
    </>
  );
};
