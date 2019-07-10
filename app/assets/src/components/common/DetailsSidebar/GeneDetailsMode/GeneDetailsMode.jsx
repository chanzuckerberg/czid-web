import React from "react";
import PropTypes from "prop-types";

import { getCARDInfo } from "~/api/amr";

import cs from "./gene_details_mode.scss";

const SOURCE_CARD = "CARD Ontology";
const SOURCE_PUBMED = "PubMed Search";
const SOURCE_GOOGLE_SCHOLAR = "Google Scholar Search";
const SOURCE_NCBI_REF_GENE = "NCBI AMR Reference Gene Catalog";

const URL_CARD_ARO = "https://card.mcmaster.ca/aro/";
const URL_PUBMED = "https://www.ncbi.nlm.nih.gov/pubmed/";
const URL_GOOGLE_SCHOLAR = "https://scholar.google.com/scholar?q=";
const URL_NCBI_REF_GENE =
  "https://www.ncbi.nlm.nih.gov/pathogens/isolates#/refgene/";

const CARD_FAMILY = "AMR Gene Family";
const CARD_CLASS = "Drug Class";
const CARD_MECHANISM = "Resistance Mechanism";
const CARD_SYNONYMS = "Synonym(s)";
const CARD_PUBLICATIONS = "Publications";

export default class GeneDetailsMode extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      cardEntryFound: false,
      collapseOntology: true,
      ontology: null,
    };
  }

  componentDidMount() {
    this.getGeneInfo(this.props.geneName);
  }

  componentDidUpdate(prevProps) {
    if (this.props.geneName !== prevProps.geneName) {
      this.setState({
        loading: true,
        cardEntryFound: false,
        collapseOntology: true,
      });
      this.getGeneInfo(this.props.geneName);
    }
  }

  async getGeneInfo(geneName) {
    let cardEntryFound;
    const ontology = await getCARDInfo(geneName);

    if (ontology.error !== "") {
      cardEntryFound = false;
    } else {
      cardEntryFound = true;
    }

    this.setState({
      ontology,
      loading: false,
      cardEntryFound,
    });
  }

  //*** Callback functions ***

  expandOntology = () => {
    this.setState({ collapseOntology: false });
  };

  //*** Functions depending on state ***

  generateLinkTo(source) {
    const { ontology } = this.state;
    const { geneName } = this.props;
    switch (source) {
      case SOURCE_CARD: {
        return URL_CARD_ARO + ontology.accession;
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
      default: {
        return "";
      }
    }
  }

  //*** Render methods ***

  renderCARDLicense() {
    const { ontology } = this.state;
    return (
      <div className={cs.cardLicense}>
        This article uses material from the CARD Antibiotic Resistance Ontology
        entry for{" "}
        <a
          href={this.generateLinkTo(SOURCE_CARD)}
          className={cs.cardLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {ontology.label}
        </a>, which is released under the{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          className={cs.cardLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Creative Commons CC-BY license version 4.0
        </a>{" "}
        by McMaster University.
      </div>
    );
  }

  renderError() {
    const { ontology } = this.state;
    return <div className={cs.cardLicense}>{ontology.error}</div>;
  }

  renderHeader() {
    const { loading, ontology } = this.state;
    const { geneName } = this.props;
    if (loading) {
      return <div className={cs.loadingMsg}>Loading...</div>;
    }
    return (
      <div className={cs.title}>
        {ontology.label !== "" ? ontology.label : geneName}
      </div>
    );
  }

  renderOntology() {
    const { ontology, collapseOntology } = this.state;
    console.log(ontology);
    return (
      <div>
        {ontology.synonyms !== "" && (
          <div className={cs.text}>
            <div className={cs.textInner}>
              {CARD_SYNONYMS}: <em>{ontology.synonyms}</em>
            </div>
          </div>
        )}
        <div className={cs.subtitle}>Description</div>
        <div className={cs.text}>
          <div className={cs.textInner}>{ontology.description}</div>
        </div>
        {!collapseOntology && (
          <div>
            {ontology.geneFamily !== "" && (
              <div>
                <div className={cs.subtitle}>{CARD_FAMILY}</div>
                <div className={cs.text}>
                  <div className={cs.textInner}>{ontology.geneFamily}</div>
                </div>
              </div>
            )}
            <div className={cs.subtitle}>{CARD_CLASS}</div>
            <div className={cs.text}>
              <div className={cs.textInner}>{ontology.drugClass}</div>
            </div>
            <div className={cs.subtitle}>{CARD_MECHANISM}</div>
            <div className={cs.text}>
              <div className={cs.textInner}>{ontology.resistanceMechanism}</div>
            </div>
            {ontology.publications !== [] && (
              <div>
                <div className={cs.subtitle}>{CARD_PUBLICATIONS}</div>
                <div className={cs.text}>{this.renderPublications()}</div>
              </div>
            )}
          </div>
        )}
        {collapseOntology && (
          <div className={cs.expandLink} onClick={this.expandOntology}>
            Show More
          </div>
        )}
        <div className={cs.text}>
          <div className={cs.textInner}>{this.renderCARDLicense()}</div>
        </div>
      </div>
    );
  }

  renderPublications() {
    const { ontology } = this.state;
    const publications = ontology.publications.map(publication => {
      const citation = /.*(?=(\(PMID))/.exec(publication)[0];
      const pmidText = /(PMID)\s[0-9]*/.exec(publication)[0];
      const pubmedId = pmidText.split(" ")[1];
      return (
        <div className={cs.textInner} key={pubmedId}>
          {citation}
          <div className={cs.link}>
            (<a
              href={URL_PUBMED + pubmedId}
              className={cs.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {pmidText}
            </a>)
          </div>
        </div>
      );
    });
    return publications;
  }

  renderFooterLinks() {
    const { cardEntryFound } = this.state;
    const sources = [
      SOURCE_PUBMED,
      SOURCE_GOOGLE_SCHOLAR,
      SOURCE_NCBI_REF_GENE,
    ];
    if (cardEntryFound) {
      sources.push(SOURCE_CARD);
    }
    const footerLinks = sources.map(source => {
      return (
        <li className={cs.link} key={source}>
          <a
            href={this.generateLinkTo(source)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {source}
          </a>
        </li>
      );
    });
    return footerLinks;
  }

  renderGeneContents() {
    const { loading, cardEntryFound } = this.state;
    if (loading) {
      return;
    }
    return (
      <div className={cs.geneContents}>
        {cardEntryFound ? this.renderOntology() : this.renderError()}
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

GeneDetailsMode.propTypes = {
  geneName: PropTypes.string.isRequired,
};
