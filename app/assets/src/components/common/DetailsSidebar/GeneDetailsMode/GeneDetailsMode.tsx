import React, { useEffect, useState } from "react";
import { getOntology } from "~/api/amr";
import ExternalLink from "~/components/ui/controls/ExternalLink";
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
  dnaAccession?: string;
  error: string;
  geneFamily: DescriptionLabel[];
  label: string;
  proteinAccession?: string;
  synonyms: string[];
}

const GeneDetailsMode = ({ geneName }: GDMProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [wasOntologyInfoFound, setWasOntologyInfoFound] =
    useState<boolean>(false);
  const [ontology, setOntology] = useState<OntologyType>({
    accession: "",
    label: "",
    synonyms: [],
    description: "",
    geneFamily: [],
    error: "Placeholder",
  });

  useEffect(() => {
    setIsLoading(true);

    getGeneInfo(geneName);
  }, [geneName]);

  const getGeneInfo = async (geneName: string) => {
    const newOntology = await getOntology(geneName);
    const ontologyInfoFound = newOntology.error === "";

    setOntology(newOntology);
    setIsLoading(false);
    setWasOntologyInfoFound(ontologyInfoFound);
  };

  if (isLoading) {
    return (
      <div className={cs.content}>
        <div className={cs.loadingMsg}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={cs.content}>
      <div className={cs.title}>{geneName}</div>
      <div className={cs.geneContents}>
        {wasOntologyInfoFound ? (
          <Ontology geneName={geneName} ontology={ontology} />
        ) : (
          <div className={cs.cardLicense}>
            Learn more about {geneName} by searching on{" "}
            <ExternalLink href="https://card.mcmaster.ca/browse">
              CARD
            </ExternalLink>
            .
          </div>
        )}
        <div className={cs.subtitle}>Quick Links</div>
        <FooterLinks geneName={geneName} ontology={ontology} />
      </div>
    </div>
  );
};

export default GeneDetailsMode;
