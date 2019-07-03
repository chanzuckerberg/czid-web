import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";

import { CARD_AMR_ONTOLOGY } from "./constants";
import cs from "./gene_details_mode.scss";

const SOURCE_CARD = "card";
const SOURCE_PUBMED = "pubmed";
const SOURCE_GOOGLE_SCHOLAR = "googlescholar";
const SOURCE_NCBI_REF_GENE = "ncbirefgene";

const URL_CARD_ARO = "https://card.mcmaster.ca/aro/";
const URL_PUBMED = "https://www.ncbi.nlm.nih.gov/pubmed/?term=";
const URL_GOOGLE_SCHOLAR = "https://scholar.google.com/scholar?q=";
const URL_NCBI_REF_GENE =
  "https://www.ncbi.nlm.nih.gov/pathogens/isolates#/refgene/";

export default class GeneDetailsMode extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      geneName: "",
      cardOntology: {
        accession: "",
        description: "---",
        geneFamily: "---",
        drugClass: "---",
        resistanceMechanism: "---",
      },
    };
  }

  componentDidMount() {
    this.getGeneInfo(this.props.geneName);
  }

  componentDidUpdate(prevProps) {
    if (this.props.geneName !== prevProps.geneName) {
      this.setState({ loading: true });
      this.getGeneInfo(this.props.geneName);
    }
  }

  getGeneInfo(geneName) {
    let description = "Not found";
    let accession = "";

    const cardOntologyEntry = CARD_AMR_ONTOLOGY.find(aroEntry => {
      const lowerCaseGeneName = geneName.toLowerCase();
      const alphaNumericGeneName = lowerCaseGeneName.replace(/\W/g, "");
      const regexForGeneName = new RegExp(`\\b${alphaNumericGeneName}\\b`);

      const lowerCaseEntryName = aroEntry.name.toLowerCase();
      const seperatedEntryName = lowerCaseEntryName.replace(/\//g, " ");
      const alphaNumericEntryName = seperatedEntryName.replace(
        /[^0-9a-z_\s]/g,
        ""
      );

      const match = regexForGeneName.test(alphaNumericEntryName);
      return match;
    });
    if (cardOntologyEntry !== undefined) {
      description = cardOntologyEntry.description;
      accession = cardOntologyEntry.accession.split(":")[1];
    }
    this.setState({
      geneName: geneName,
      cardOntology: {
        description: description,
        accession: accession,
      },
      loading: false,
    });
  }

  //*** Functions depending on state ***

  generateLinkTo(source) {
    const { cardOntology, geneName } = this.state;
    let link = "";
    switch (source) {
      case SOURCE_CARD: {
        return URL_CARD_ARO + cardOntology.accession;
      }
      case SOURCE_PUBMED: {
        return URL_PUBMED + geneName;
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

  renderCARDLicense() {}

  renderHeader() {
    const { loading } = this.state;
    if (loading) {
      return <div className={cs.loadingMsg}>Loading...</div>;
    }
    return <div className={cs.title}>{this.props.geneName}</div>;
  }

  renderGeneContents() {
    const {
      loading,
      cardOntology,
      ncbiRefGeneCatalog,
      ncbiNucleotideDB,
    } = this.state;
    if (loading) {
      return;
    }
    return (
      <div className={cs.geneContents}>
        <div>
          <div className={cs.subtitle}>Details</div>
          <div className={cs.text}>
            <div className={cs.textInner}>
              <em>Description: </em>
              {cardOntology.description}
            </div>
            <div className={cs.textInner}>
              <em>Gene Family: </em>
              {cardOntology.geneFamily}
            </div>
            <div className={cs.textInner}>
              <em>Drug Class: </em>
              {cardOntology.drugClass}
            </div>
            <div className={cs.textInner}>
              <em>Resistance Mechanism: </em>
              {cardOntology.resistanceMechanism}
            </div>
          </div>
        </div>
        <div className={cs.subtitle}>Links</div>
        <div className={cs.linksSection}>
          <ul className={cs.linksList}>
            <li className={cs.link}>
              <a href={this.generateLinkTo(SOURCE_CARD)} target="_blank">
                CARD Ontology
              </a>
            </li>
            <li className={cs.link}>
              <a
                href={this.generateLinkTo(SOURCE_NCBI_REF_GENE)}
                target="_blank"
              >
                NCBI AMR Reference Gene Catalog
              </a>
            </li>
            <li className={cs.link}>NCBI Nucleotide Database</li>
          </ul>
          <ul className={cs.linksList}>
            <li className={cs.link}>
              <a href={this.generateLinkTo(SOURCE_PUBMED)} target="_blank">
                Pubmed
              </a>
            </li>
            <li className={cs.link}>
              <a
                href={this.generateLinkTo(SOURCE_GOOGLE_SCHOLAR)}
                target="_blank"
              >
                Google Scholar
              </a>
            </li>
          </ul>
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
