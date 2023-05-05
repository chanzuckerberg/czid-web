import { OntologyType } from "./GeneDetailsMode";

export enum Sources {
  CARD = "CARD Ontology",
  PUBMED = "PubMed Search",
  GOOGLE_SCHOLAR = "Google Scholar Search",
  NCBI_REF_GENE = "NCBI AMR Reference Gene Catalog",
  OWL = "CARD Ontology OWL",
  GENBANK_NUCCORE = "NCBI Genbank / Nucleotide Database",
}

export enum Urls {
  CARD_ARO = "https://card.mcmaster.ca/aro/",
  CARD_OWL = "https://github.com/arpcard/aro",
  PUBMED = "https://www.ncbi.nlm.nih.gov/pubmed/",
  GOOGLE_SCHOLAR = "https://scholar.google.com/scholar?q=",
  NCBI_REF_GENE = "https://www.ncbi.nlm.nih.gov/pathogens/isolates#/refgene/",
  GENBANK_NUCCORE = "https://www.ncbi.nlm.nih.gov/nuccore/",
}

interface GenerateLinkParams {
  geneName: string;
  ontology: OntologyType;
  source: string;
}

export const generateLinkTo = ({
  geneName,
  ontology,
  source,
}: GenerateLinkParams) => {
  const { accession, genbankAccession } = ontology;

  switch (source) {
    case Sources.CARD: {
      return accession ? `${Urls.CARD_ARO}${accession}` : null;
    }
    case Sources.OWL: {
      return `${Urls.CARD_OWL}`;
    }
    case Sources.PUBMED: {
      return `${Urls.PUBMED}?term=${geneName}`;
    }
    case Sources.GOOGLE_SCHOLAR: {
      return `${Urls.GOOGLE_SCHOLAR}${geneName}`;
    }
    case Sources.NCBI_REF_GENE: {
      return `${Urls.NCBI_REF_GENE}${geneName}`;
    }
    case Sources.GENBANK_NUCCORE: {
      return genbankAccession
        ? `${Urls.GENBANK_NUCCORE}${genbankAccession}`
        : null;
    }
    default: {
      return "";
    }
  }
};
