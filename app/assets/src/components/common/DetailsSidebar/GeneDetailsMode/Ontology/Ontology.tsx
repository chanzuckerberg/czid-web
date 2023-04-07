import React, { useEffect, useState } from "react";
import { trackEvent } from "~/api/analytics";
import gcs from "../gene_details_mode.scss";
import { OntologyType } from "../GeneDetailsMode";
import { CARDLicense } from "./CARDLicense";
import cs from "./ontology.scss";
import { PropertyList } from "./PropertyList";
import { Publications } from "./Publications";

interface OntologyProps {
  geneName: string;
  ontology: OntologyType;
}

const Ontology = ({ geneName, ontology }: OntologyProps) => {
  const { synonyms, description, geneFamily, drugClass, publications } =
    ontology;

  const [shouldCollapseOntology, setShouldCollapseOntology] =
    useState<boolean>(true);

  useEffect(() => {
    setShouldCollapseOntology(true);
  }, [geneName]);

  const onExpandOntology = () => {
    setShouldCollapseOntology(false);
    trackEvent("GeneDetailsMode_expand-ontology_clicked", {
      geneName,
    });
  };

  return (
    <div>
      {synonyms.length > 0 && (
        <div className={cs.text}>
          Synonym(s):{" "}
          <span className={cs.textSynonym}>{synonyms.join(", ")}</span>
        </div>
      )}
      <div className={gcs.subtitle}>Description</div>
      <div className={cs.text}>{description}</div>
      {drugClass && (
        <section>
          <div className={gcs.subtitle}>Drug Resistances</div>
          <div className={cs.text}>
            <PropertyList array={[drugClass]} />
          </div>
        </section>
      )}
      {!shouldCollapseOntology && (
        <div>
          {geneFamily.length > 0 && (
            <section>
              <div className={gcs.subtitle}>AMR Gene Family</div>
              <div className={cs.text}>
                <PropertyList array={geneFamily} />
              </div>
            </section>
          )}
          {publications.length > 0 && (
            <section>
              <div className={gcs.subtitle}>Publications</div>
              <div className={cs.text}>
                <Publications geneName={geneName} ontology={ontology} />
              </div>
            </section>
          )}
        </div>
      )}
      {shouldCollapseOntology &&
        (geneFamily.length > 0 || publications.length > 0) && (
          <button className={cs.expandLink} onClick={onExpandOntology}>
            Show More
          </button>
        )}
      <div className={cs.text}>
        <CARDLicense geneName={geneName} ontology={ontology} />
        <div className={gcs.cardLicense}>
          Publication names courtesy of the U.S. National Library of Medicine.
        </div>
      </div>
    </div>
  );
};

export default Ontology;
