import { gql } from "@apollo/client";
import React from "react";
import { initalCache } from "~/cache";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { federationClient } from "~/index";
import cs from "./taxon_links.scss";

export const TaxonLinksWithApollo = ({
  taxonId,
  parentTaxonId,
  taxonName,
}: {
  taxonId: number;
  parentTaxonId: number;
  taxonName: string;
}) => {
  const { wikiUrl } =
    federationClient.readFragment({
      id: initalCache.identify({
        __typename: "TaxonDescription",
        taxId: taxonId,
      }),
      fragment: gql`
        fragment TaxonLinkInfo on TaxonDescription {
          wikiUrl
        }
      `,
    }) || {};

  const renderLink = (source: string, label: string) => {
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
    return (
      <ExternalLink
        href={url}
        data-testid={"taxon-link"}
        analyticsEventName="TaxonDetailsMode_external-link_clicked"
        analyticsEventData={{
          source,
          url,
          taxonId,
          taxonName: taxonName,
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
