import React, { useEffect, useState } from "react";
import { getOntology } from "~/api/amr";
import { FooterLinks } from "./FooterLinks";
import cs from "./gene_details_mode.scss";
import { Ontology } from "./Ontology";

export interface GDMProps {
  geneName: string;
}

export interface DescriptionLabel {
  description: string;
  label: string;
}

export interface OntologyType {
  accession: string;
  description: string;
  drugClass: DescriptionLabel;
  error: string;
  geneFamily: DescriptionLabel[];
  genbankAccession?: string;
  label: string;
  publications: string[];
  synonyms: string[];
}

const GeneDetailsMode = ({ geneName }: GDMProps) => {
  const safeGeneName = geneName.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [wasCardEntryFound, setWasCardEntryFound] = useState<boolean>(false);
  const [wasOntologyInfoFound, setWasOntologyInfoFound] =
    useState<boolean>(false);
  const [ontology, setOntology] = useState<OntologyType>({
    accession: "",
    label: "",
    synonyms: [],
    description: "",
    geneFamily: [],
    drugClass: {
      description: "",
      label: "",
    },
    publications: [],
    error: "Placeholder",
  });

  useEffect(() => {
    setIsLoading(true);
    setWasCardEntryFound(false);

    getGeneInfo(safeGeneName);
  }, [safeGeneName]);

  const getGeneInfo = async (safeGeneName: string) => {
    const newOntology = await getOntology(safeGeneName);
    const ontologyInfoFound = newOntology.error === "";
    // all the CARD accessions we are interested in ar 7 in length.
    const cardEntryFound = newOntology.accession.length === 7;

    setOntology(newOntology);
    setIsLoading(false);
    setWasOntologyInfoFound(ontologyInfoFound);
    setWasCardEntryFound(cardEntryFound);
  };

  if (isLoading) {
    return (
      <div className={cs.content}>
        <div className={cs.loadingMsg}>Loading...</div>
      </div>
    );
  }

  const { error, label } = ontology;

  return (
    <div className={cs.content}>
      <div className={cs.title}>{label !== "" ? label : geneName}</div>
      <div className={cs.geneContents}>
        {wasOntologyInfoFound ? (
          <Ontology geneName={geneName} ontology={ontology} />
        ) : (
          <div className={cs.cardLicense}>{error}</div>
        )}
        <div className={cs.subtitle}>Links</div>
        <div className={cs.linksSection}>
          <ul className={cs.linksList}>
            <FooterLinks
              geneName={geneName}
              ontology={ontology}
              wasCardEntryFound={wasCardEntryFound}
            />
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GeneDetailsMode;
