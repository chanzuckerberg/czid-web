import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";

import { getCARDInfo } from "~/api/amr";

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

const CARD_FAMILY = "AMR Gene Family";
const CARD_CLASS = "Drug Class";
const CARD_MECHANISM = "Resistance Mechanism";

export default class GeneDetailsMode extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      cardEntryFound: false,
      collapseOntology: true,
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
    const updatedOntology = {
      accession: undefined,
      description: "---",
      geneFamily: "---",
      drugClass: "---",
      resistanceMechanism: "---",
    };

    const cardOntologyEntry = CARD_AMR_ONTOLOGY.find(aroEntry => {
      const alphaNumericGeneName = geneName.toLowerCase().replace(/\W/g, "");
      const regexForGeneName = new RegExp(`\\b${alphaNumericGeneName}\\b`);

      const seperatedEntryName = aroEntry.name
        .toLowerCase()
        .replace(/\//g, " ");
      const alphaNumericEntryName = seperatedEntryName.replace(
        /[^0-9a-z_\s]/g,
        ""
      );

      const match = regexForGeneName.test(alphaNumericEntryName);
      return match;
    });

    if (cardOntologyEntry === undefined) {
      this.setState({
        loading: false,
        ontology: updatedOntology,
        cardEntryFound: false,
      });
      return;
    }

    updatedOntology.description = cardOntologyEntry.description;
    updatedOntology.accession = cardOntologyEntry.accession.split(":")[1];
    try {
      const cardRequest = await getCARDInfo(updatedOntology.accession);
      const cardInfo = this.parseCARDEntry(cardRequest.html);
      updatedOntology.geneFamily = cardInfo.geneFamily;
      updatedOntology.drugClass = cardInfo.drugClass;
      updatedOntology.resistanceMechanism = cardInfo.resistanceMechanism;
    } catch (err) {
      console.error(err);
    }

    this.setState({
      geneName: geneName,
      ontology: updatedOntology,
      loading: false,
      cardEntryFound: true,
    });
  }

  parseCARDEntry(html) {
    const domParser = new DOMParser();
    const entry = domParser.parseFromString(html, "text/html");
    const tableBody = entry.querySelector(
      "table[vocab='http://dev.arpcard.mcmaster.ca/browse/data'] tbody"
    );

    const geneInfo = {};
    tableBody.childNodes.forEach(row => {
      const columns = [];
      row.childNodes.forEach(column => columns.push(column.innerText));
      const [key, value] = columns;

      switch (key) {
        case CARD_FAMILY: {
          geneInfo.geneFamily = value;
          break;
        }
        case CARD_CLASS: {
          geneInfo.drugClass = value;
          break;
        }
        case CARD_MECHANISM: {
          geneInfo.resistanceMechanism = value;
          break;
        }
        default: {
          break;
        }
      }
    });

    return geneInfo;
  }

  //*** Callback functions ***

  expandOntology = () => {
    this.setState({ collapseOntology: false });
  };

  //*** Functions depending on state ***

  generateLinkTo(source) {
    const { ontology, geneName } = this.state;
    let link = "";
    switch (source) {
      case SOURCE_CARD: {
        return URL_CARD_ARO + ontology.accession;
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

  renderCARDLicense() {
    const { geneName } = this.props;
    return (
      <div className={cs.cardLicense}>
        This article uses material from the CARD Antibiotic Resistance Ontology
        entry for{" "}
        <a
          href={this.generateLinkTo(SOURCE_CARD)}
          className={cs.cardLink}
          target="_blank"
        >
          {geneName}
        </a>, which is released under the{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          className={cs.cardLink}
          target="_blank"
        >
          Creative Commons CC-BY license version 4.0
        </a>{" "}
        by McMaster University.
      </div>
    );
  }

  renderNotFound() {
    const { geneName } = this.props;
    return <div className={cs.cardLicense}>No data found for {geneName}</div>;
  }

  renderHeader() {
    const { loading } = this.state;
    if (loading) {
      return <div className={cs.loadingMsg}>Loading...</div>;
    }
    return <div className={cs.title}>{this.props.geneName}</div>;
  }

  renderOntology() {
    const { ontology, collapseOntology } = this.state;
    return (
      <div>
        <div className={cs.subtitle}>Description</div>
        <div className={cs.text}>
          <div className={cs.textInner}>{ontology.description}</div>
        </div>
        {!collapseOntology && (
          <div>
            <div className={cs.subtitle}>AMR Gene Family</div>
            <div className={cs.text}>
              <div className={cs.textInner}>{ontology.geneFamily}</div>
            </div>
            <div className={cs.subtitle}>Drug Class</div>
            <div className={cs.text}>
              <div className={cs.textInner}>{ontology.drugClass}</div>
            </div>
            <div className={cs.subtitle}>Resistance Mechanism</div>
            <div className={cs.text}>
              <div className={cs.textInner}>{ontology.resistanceMechanism}</div>
            </div>
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

  renderGeneContents() {
    const { loading, cardEntryFound } = this.state;
    if (loading) {
      return;
    }
    return (
      <div className={cs.geneContents}>
        {cardEntryFound ? this.renderOntology() : this.renderNotFound()}
        <div className={cs.subtitle}>Links</div>
        <div className={cs.linksSection}>
          <ul className={cs.linksList}>
            {cardEntryFound && (
              <li className={cs.link}>
                <a href={this.generateLinkTo(SOURCE_CARD)} target="_blank">
                  CARD Ontology
                </a>
              </li>
            )}
            <li className={cs.link}>
              <a
                href={this.generateLinkTo(SOURCE_NCBI_REF_GENE)}
                target="_blank"
              >
                NCBI AMR Reference Gene Catalog
              </a>
            </li>
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
