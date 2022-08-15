import React from "react";

import { getOntology } from "~/api/amr";
import { trackEvent } from "~/api/analytics";
import StringHelper from "~/helpers/StringHelper";

import cs from "./gene_details_mode.scss";

const SOURCE_CARD = "CARD Ontology";
const SOURCE_PUBMED = "PubMed Search";
const SOURCE_GOOGLE_SCHOLAR = "Google Scholar Search";
const SOURCE_NCBI_REF_GENE = "NCBI AMR Reference Gene Catalog";
const SOURCE_OWL = "CARD Ontology OWL";
const SOURCE_GENBANK_NUCCORE = "NCBI Genbank / Nucleotide Database";

const URL_CARD_ARO = "https://card.mcmaster.ca/aro/";
const URL_CARD_OWL = "https://github.com/arpcard/aro";
const URL_PUBMED = "https://www.ncbi.nlm.nih.gov/pubmed/";
const URL_GOOGLE_SCHOLAR = "https://scholar.google.com/scholar?q=";
const URL_NCBI_REF_GENE =
  "https://www.ncbi.nlm.nih.gov/pathogens/isolates#/refgene/";
const URL_GENBANK_NUCCORE = "https://www.ncbi.nlm.nih.gov/nuccore/";

const CARD_FAMILY = "AMR Gene Family";
const CARD_RESISTANCES = "Drug Resistances";
const CARD_SYNONYMS = "Synonym(s)";
const CARD_PUBLICATIONS = "Publications";

interface DescriptionLabel {
  description: string;
  label: string;
}

interface GDMProps {
  geneName: string;
}

interface GDMState {
  cardEntryFound: boolean;
  collapseOntology: boolean;
  loading: boolean;
  ontologyInfoFound?: boolean;
  ontology: {
    accession: string;
    description: string;
    drugClass: DescriptionLabel;
    error: string;
    geneFamily: DescriptionLabel[];
    genbankAccession?: string;
    label: string;
    publications: string[];
    synonyms: string[];
  };
}

export default class GeneDetailsMode extends React.Component<
  GDMProps,
  GDMState
> {
  constructor(props: GDMProps) {
    super(props);

    this.state = {
      loading: true,
      cardEntryFound: false,
      collapseOntology: true,
      ontology: {
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
      },
    };
  }

  componentDidMount() {
    const { geneName } = this.props;
    this.getGeneInfo(geneName);
  }

  componentDidUpdate(prevProps: GDMProps) {
    const { geneName } = this.props;
    if (geneName !== prevProps.geneName) {
      this.setState({
        loading: true,
        cardEntryFound: false,
        collapseOntology: true,
      });
      this.getGeneInfo(geneName);
    }
  }

  async getGeneInfo(geneName: string) {
    const ontology = await getOntology(geneName);
    const ontologyInfoFound = ontology.error === "";
    // all the CARD accessions we are interested in ar 7 in length.
    const cardEntryFound = ontology.accession.length === 7;
    this.setState({
      ontology,
      loading: false,
      ontologyInfoFound,
      cardEntryFound,
    });
  }

  // *** Callback functions ***

  expandOntology = () => {
    const { geneName } = this.props;
    this.setState({ collapseOntology: false });
    trackEvent("GeneDetailsMode_expand-ontology_clicked", {
      geneName,
    });
  };

  // *** Functions depending on state ***

  generateLinkTo(source: string) {
    const {
      ontology: { accession, genbankAccession },
    } = this.state;
    const { geneName } = this.props;
    switch (source) {
      case SOURCE_CARD: {
        return URL_CARD_ARO + accession;
      }
      case SOURCE_OWL: {
        return URL_CARD_OWL;
      }
      case SOURCE_PUBMED: {
        return URL_PUBMED + "?term=" + geneName;
      }
      case SOURCE_GOOGLE_SCHOLAR: {
        return URL_GOOGLE_SCHOLAR + geneName;
      }
      case SOURCE_NCBI_REF_GENE: {
        return URL_NCBI_REF_GENE + geneName;
      }
      case SOURCE_GENBANK_NUCCORE: {
        return URL_GENBANK_NUCCORE + genbankAccession;
      }
      default: {
        return "";
      }
    }
  }

  // *** Render methods ***

  renderCARDLicense() {
    return (
      <div className={cs.cardLicense}>
        This article uses material from the{" "}
        <a
          href={this.generateLinkTo(SOURCE_OWL)}
          className={cs.cardLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("GeneDetailsMode_card-ontology-attribution_clicked")
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
            trackEvent("GeneDetailsMode_creative-commons-license_clicked")
          }
        >
          Creative Commons CC-BY license version 4.0
        </a>{" "}
        by McMaster University.
      </div>
    );
  }

  renderPubMedLicense() {
    return (
      <div className={cs.cardLicense}>
        Publication names courtesy of the U.S. National Library of Medicine.
      </div>
    );
  }

  renderError() {
    const {
      ontology: { error },
    } = this.state;
    return <div className={cs.cardLicense}>{error}</div>;
  }

  renderHeader() {
    const {
      loading,
      ontology: { label },
    } = this.state;
    const { geneName } = this.props;
    if (loading) {
      return <div className={cs.loadingMsg}>Loading...</div>;
    }
    return <div className={cs.title}>{label !== "" ? label : geneName}</div>;
  }

  renderOntology() {
    const {
      ontology: { synonyms, description, geneFamily, drugClass, publications },
      collapseOntology,
    } = this.state;
    return (
      <div>
        {synonyms.length > 0 && (
          <div className={cs.text}>
            <div className={cs.textInner}>
              {CARD_SYNONYMS}:{" "}
              <span className={cs.textSynonym}>{synonyms.join(", ")}</span>
            </div>
          </div>
        )}
        <div className={cs.subtitle}>Description</div>
        <div className={cs.text}>
          <div className={cs.textInner}>{description}</div>
        </div>
        {drugClass && (
          <div>
            <div className={cs.subtitle}>{CARD_RESISTANCES}</div>
            <div className={cs.text}>
              {this.renderPropertyList([drugClass])}
            </div>
          </div>
        )}
        {!collapseOntology && (
          <div>
            {geneFamily.length > 0 && (
              <div>
                <div className={cs.subtitle}>{CARD_FAMILY}</div>
                <div className={cs.text}>
                  {this.renderPropertyList(geneFamily)}
                </div>
              </div>
            )}
            {publications.length > 0 && (
              <div>
                <div className={cs.subtitle}>{CARD_PUBLICATIONS}</div>
                <div className={cs.text}>{this.renderPublications()}</div>
              </div>
            )}
          </div>
        )}
        {collapseOntology &&
          (geneFamily.length > 0 || publications.length > 0) && (
            <button className={cs.expandLink} onClick={this.expandOntology}>
              Show More
            </button>
          )}
        <div className={cs.text}>
          <div className={cs.textInner}>{this.renderCARDLicense()}</div>
          <div className={cs.textInner}>{this.renderPubMedLicense()}</div>
        </div>
      </div>
    );
  }

  renderPropertyList(array: DescriptionLabel[]) {
    return array.map((property) => {
      return (
        <div key={property.label}>
          <div className={cs.textInner}>
            <em>{StringHelper.capitalizeFirstLetter(property.label)}</em>
          </div>
          <div className={cs.textInner}>{property.description}</div>
        </div>
      );
    });
  }

  renderPublications() {
    const {
      ontology: { label, publications },
    } = this.state;
    const { geneName } = this.props;
    return publications.map((publication) => {
      const citation = /.*(?=(\(PMID))/.exec(publication)[0];
      const pmidText = /(PMID)\s[0-9]*/.exec(publication)[0];
      const pubmedId = pmidText.split(" ")[1];
      return (
        <div className={cs.textInner} key={pubmedId}>
          {citation} (
          <span className={cs.link}>
            <a
              href={URL_PUBMED + pubmedId}
              className={cs.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("GeneDetailsMode_pubmed-citation-link_clicked", {
                  citation: citation,
                  pubmedId: pubmedId,
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
    });
  }

  renderFooterLinks() {
    const { cardEntryFound } = this.state;
    const { geneName } = this.props;
    const sources = [
      SOURCE_GENBANK_NUCCORE,
      SOURCE_NCBI_REF_GENE,
      SOURCE_PUBMED,
      SOURCE_GOOGLE_SCHOLAR,
    ];
    if (cardEntryFound) {
      sources.unshift(SOURCE_CARD);
    }
    const footerLinks = sources.map((source) => {
      return (
        <li className={cs.link} key={source}>
          <a
            href={this.generateLinkTo(source)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("GeneDetailsMode_footer-link_clicked", {
                destination: source,
                geneName,
              })
            }
          >
            {source}
          </a>
        </li>
      );
    });
    return footerLinks;
  }

  renderGeneContents() {
    const { loading, ontologyInfoFound } = this.state;
    if (loading) {
      return;
    }
    return (
      <div className={cs.geneContents}>
        {ontologyInfoFound ? this.renderOntology() : this.renderError()}
        <div className={cs.subtitle}>Links</div>
        <div className={cs.linksSection}>
          <ul className={cs.linksList}>{this.renderFooterLinks()}</ul>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className={cs.content}>
        {this.renderHeader()}
        {this.renderGeneContents()}
      </div>
    );
  }
}
