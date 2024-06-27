import React from "react";
import { OntologyType } from "../GeneDetailsMode";
import gcs from "../gene_details_mode.scss";
import { CARDFooter } from "./CARDLicense";
import cs from "./ontology.scss";
import { PropertyList } from "./PropertyList";

interface OntologyProps {
  geneName: string;
  ontology: OntologyType;
}

const Ontology = ({ geneName, ontology }: OntologyProps) => {
  const { synonyms, description, geneFamily } = ontology;

  return (
    <div>
      {synonyms.length > 0 && (
        <div className={cs.textSynonym}>
          Synonym(s): <span>{synonyms.join(", ")}</span>
        </div>
      )}
      <div className={gcs.subtitle}>Description</div>
      <div className={cs.text}>{description}</div>
      <div>
        {geneFamily.length > 0 && (
          <section>
            <div className={gcs.subtitle}>AMR Gene Family</div>
            <div className={cs.text}>
              <PropertyList array={geneFamily} />
            </div>
          </section>
        )}
      </div>
      <CARDFooter geneName={geneName} ontology={ontology} />
    </div>
  );
};

export default Ontology;
