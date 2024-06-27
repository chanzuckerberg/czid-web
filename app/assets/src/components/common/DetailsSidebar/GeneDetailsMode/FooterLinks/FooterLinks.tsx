import React from "react";
import { OntologyType } from "../GeneDetailsMode";
import cs from "../gene_details_mode.scss";
import { Sources } from "../utils";
import { FooterLink } from "./FooterLink";

interface FooterLinkProps {
  geneName: string;
  ontology: OntologyType;
}

const FooterLinks = ({ geneName, ontology }: FooterLinkProps) => {
  const sources = [
    Sources.CARD,
    Sources.GENBANK_NUCCORE,
    Sources.GENBANK_PROTEIN,
    Sources.PUBMED,
    Sources.GOOGLE_SCHOLAR,
  ];

  // Splits up links so we have 2 per row
  const numRows = Math.ceil(sources.length / 2);

  return (
    <div className={cs.linksSection}>
      <ul className={cs.linksList}>
        {sources.slice(0, numRows).map(source => {
          return (
            <FooterLink
              key={source}
              geneName={geneName}
              ontology={ontology}
              source={source}
            />
          );
        })}
      </ul>
      <ul className={cs.linksList}>
        {sources.slice(numRows).map(source => {
          return (
            <FooterLink
              key={source}
              geneName={geneName}
              ontology={ontology}
              source={source}
            />
          );
        })}
      </ul>
    </div>
  );
};

export default FooterLinks;
