import React from "react";
import { trackEvent } from "~/api/analytics";

import { OntologyType } from "../../GeneDetailsMode";
import cs from "../../gene_details_mode.scss";
import { Urls } from "../../utils";

interface PublicationsProps {
  geneName: string;
  ontology: OntologyType;
}

const Publications = ({ geneName, ontology }: PublicationsProps) => {
  const { label, publications } = ontology;

  return (
    <>
      {publications.map(publication => {
        const citation = /.*(?=(\(PMID))/.exec(publication)[0];
        const pmidText = /(PMID)\s[0-9]*/.exec(publication)[0];
        const pubmedId = pmidText.split(" ")[1];

        return (
          <div key={pubmedId}>
            {citation} (
            <span className={cs.link}>
              <a
                href={`${Urls.PUBMED}${pubmedId}`}
                className={cs.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent("GeneDetailsMode_pubmed-citation-link_clicked", {
                    citation,
                    pubmedId,
                    ontologyLabel: label,
                    geneName,
                  })
                }
              >
                {pmidText}
              </a>
            </span>
            )
          </div>
        );
      })}
    </>
  );
};

export default Publications;
