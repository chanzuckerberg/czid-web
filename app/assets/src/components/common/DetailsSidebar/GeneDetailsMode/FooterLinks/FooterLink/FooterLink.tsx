import React from "react";
import { OntologyType } from "../../GeneDetailsMode";
import { generateLinkTo } from "../../utils";
import cs from "./footer_link.scss";

interface FooterLinkProps {
  geneName: string;
  ontology: OntologyType;
  source: string;
}

export const FooterLink = ({ geneName, ontology, source }: FooterLinkProps) => {
  const href = generateLinkTo({ geneName, ontology, source });
  if (!href) return null;
  return (
    <li className={cs.link} key={source}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        // this is broken, but alldoami found it while working on something unrelated
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onClick={() => {}}
      >
        {source}
      </a>
    </li>
  );
};
