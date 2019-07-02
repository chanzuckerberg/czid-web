import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";

import cs from "./gene_details_mode.scss";

const SOURCE_NCBI = "ncbi";
const SOURCE_PUBMED = "pubmed";
const SOURCE_GOOGLE_SCHOLAR = "googlescholar";
const SOURCE_CARD = "card";

export default class GeneDetailsMode extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      geneName: "",
      geneDescription: "",
      NCBILink: "",
      googleScholarLink: "",
      pubMedLink: "",
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
    const geneInfo =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum nisi tortor, maximus porta euismod at, euismod non lacus. Ut ac justo congue, pharetra urna ut, malesuada elit. Nulla vel rutrum neque. Quisque posuere auctor ligula, et ultrices ligula dictum vel. Donec sagittis felis nulla. Curabitur varius aliquet varius. Nullam massa nisi, euismod nec nibh eget, lobortis commodo arcu. Duis interdum, neque nec malesuada porttitor, lacus turpis rhoncus mi, sed tempor libero sapien sit amet orci. Vivamus odio lacus, maximus a pellentesque non, sodales ac massa. Sed non lorem ut lectus scelerisque ullamcorper quis pellentesque nisl. Suspendisse nec vehicula sem.";
    this.setState({
      geneName: geneName,
      geneDescription: geneInfo,
      loading: false,
    });
  }

  generateLinkTo(source) {
    return "";
  }

  renderHeader() {
    const { loading } = this.state;
    if (loading) {
      return <div className={cs.loadingMsg}>Loading...</div>;
    }
    return <div className={cs.title}>{this.props.geneName}</div>;
  }

  renderGeneContents() {
    const { loading, geneDescription } = this.state;
    if (loading) {
      return;
    }
    return (
      <div className={cs.geneContents}>
        <div>
          <div className={cs.subtitle}>Description</div>
          <div className={cs.text}>
            <div className={cs.textInner}>{geneDescription}</div>
          </div>
        </div>
        <div className={cs.subtitle}>Links</div>
        <div className={cs.linksSection}>
          <ul className={cs.linksList}>
            <li className={cs.link}>NCBI Gene</li>
            <li className={cs.link}>Google Scholar</li>
          </ul>
          <ul className={cs.linksList}>
            <li className={cs.link}>CARD</li>
            <li className={cs.link}>Pubmed</li>
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
