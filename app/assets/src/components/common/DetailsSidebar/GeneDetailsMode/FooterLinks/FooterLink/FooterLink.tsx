import React from "react";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import { OntologyType } from "../../GeneDetailsMode";
import { generateLinkTo } from "../../utils";
import cs from "./footer_link.scss";

interface FooterLinkProps {
  geneName: string;
  ontology: OntologyType;
  source: string;
}

export const FooterLink = ({ geneName, ontology, source }: FooterLinkProps) => {
  const trackEvent = useTrackEvent();
  const href = generateLinkTo({ geneName, ontology, source });
  if (!href) return null;
  return (
    <li className={cs.link} key={source}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent(
            ANALYTICS_EVENT_NAMES.GENE_DETAILS_MODE_FOOTER_LINK_CLICKED,
            {
              destination: source,
              geneName,
            },
          )
        }
      >
        {source}
      </a>
    </li>
  );
};
