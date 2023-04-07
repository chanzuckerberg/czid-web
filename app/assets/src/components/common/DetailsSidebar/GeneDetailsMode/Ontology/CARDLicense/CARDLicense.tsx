import React from "react";
import { trackEvent } from "~/api/analytics";
import cs from "../../gene_details_mode.scss";
import { OntologyType } from "../../GeneDetailsMode";
import { generateLinkTo, Sources } from "../../utils";

interface CARDLicenseProps {
  geneName: string;
  ontology: OntologyType;
}

const CARDLicense = ({ geneName, ontology }: CARDLicenseProps) => (
  <div className={cs.cardLicense}>
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
        trackEvent("GeneDetailsMode_card-ontology-attribution_clicked")
      }>
      CARD Antibiotic Resistance Ontology
    </a>
    , which is released under the{" "}
    <a
      href="https://creativecommons.org/licenses/by/4.0/"
      className={cs.cardLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        trackEvent("GeneDetailsMode_creative-commons-license_clicked")
      }>
      Creative Commons CC-BY license version 4.0
    </a>{" "}
    by McMaster University.
  </div>
);

export default CARDLicense;
