import { OntologyType } from "./GeneDetailsMode";

export enum Sources {
  CARD = "CARD",
  PUBMED = "PubMed",
  GOOGLE_SCHOLAR = "Google Scholar",
  OWL = "CARD Ontology OWL",
  GENBANK_NUCCORE = "NCBI Nucleotide",
  GENBANK_PROTEIN = "NCBI Protein",
}

export enum Urls {
  CARD_ARO = "https://card.mcmaster.ca/aro/",
  CARD_OWL = "https://github.com/arpcard/aro",
  PUBMED = "https://www.ncbi.nlm.nih.gov/pubmed/",
  GOOGLE_SCHOLAR = "https://scholar.google.com/scholar?q=",
  NCBI_REF_GENE = "https://www.ncbi.nlm.nih.gov/pathogens/isolates#/refgene/",
  GENBANK_NUCCORE = "https://www.ncbi.nlm.nih.gov/nuccore/",
  GENBANK_PROTEIN = "https://www.ncbi.nlm.nih.gov/protein/",
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
  const { accession, dnaAccession, proteinAccession } = ontology;

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
    case Sources.GENBANK_NUCCORE: {
      return dnaAccession ? `${Urls.GENBANK_NUCCORE}${dnaAccession}` : null;
    }
    case Sources.GENBANK_PROTEIN: {
      return proteinAccession
        ? `${Urls.GENBANK_PROTEIN}${proteinAccession}`
        : null;
    }
    default: {
      return "";
    }
  }
};
