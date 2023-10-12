import React from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import cs from "../../gene_details_mode.scss";
import { OntologyType } from "../../GeneDetailsMode";
import { generateLinkTo, Sources } from "../../utils";

interface CARDFooterProps {
  geneName: string;
  ontology: OntologyType;
}

const CARDFooter = ({ geneName, ontology }: CARDFooterProps) => (
  <div className={cs.cardFooter}>
    <div>
      This article uses material from the{" "}
      <a
        href={generateLinkTo({
          geneName,
          ontology,
          source: Sources.OWL,
        })}
        className={cs.cardLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent(
            ANALYTICS_EVENT_NAMES.GENE_DETAILS_MODE_CARD_ONTOLOGY_ATTRIBUTION_CLICKED,
          )
        }
      >
        CARD Antibiotic Resistance Ontology
      </a>
      , which is released under the{" "}
      <a
        href="https://creativecommons.org/licenses/by/4.0/"
        className={cs.cardLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent(
            ANALYTICS_EVENT_NAMES.GENE_DETAILS_MODE_CREATIVE_COMMONS_LICENSE_CLICKED,
          )
        }
      >
        Creative Commons CC-BY license version 4.0
      </a>{" "}
      by McMaster University.
    </div>
    <div className={cs.disclaimer}>
      Disclaimer: This uses the most recent CARD database, it may differ from
      your AMR results.
    </div>
  </div>
);

export default CARDFooter;
