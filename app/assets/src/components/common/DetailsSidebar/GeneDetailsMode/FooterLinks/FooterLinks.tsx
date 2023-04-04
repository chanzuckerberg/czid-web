import React from "react";
import { trackEvent } from "~/api/analytics";
import cs from "../gene_details_mode.scss";
import { OntologyType } from "../GeneDetailsMode";
import { generateLinkTo, Sources } from "../utils";

interface FooterLinkProps {
  geneName: string;
  ontology: OntologyType;
  wasCardEntryFound: boolean;
}

const FooterLinks = ({
  geneName,
  ontology,
  wasCardEntryFound,
}: FooterLinkProps) => {
  const sources = [
    Sources.GENBANK_NUCCORE,
    Sources.NCBI_REF_GENE,
    Sources.PUBMED,
    Sources.GOOGLE_SCHOLAR,
  ];

  if (wasCardEntryFound) {
    sources.unshift(Sources.CARD);
  }

  return (
    <>
      {sources.map(source => {
        return (
          <li className={cs.link} key={source}>
            <a
              href={generateLinkTo({ geneName, ontology, source })}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("GeneDetailsMode_footer-link_clicked", {
                  destination: source,
                  geneName,
                })
              }
            >
              {source}
            </a>
          </li>
        );
      })}
    </>
  );
};

export default FooterLinks;
