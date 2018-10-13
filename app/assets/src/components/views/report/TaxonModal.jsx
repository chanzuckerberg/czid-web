import React from "react";
import Axios from "axios";
import Modal from "../../ui/containers/Modal";
import PropTypes from "prop-types";
import Histogram from "../../visualizations/Histogram";

class TaxonModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      background: this.props.background,
      showHistogram: false,
      taxonDescription: "",
      taxonParentName: "",
      taxonParentDescription: "",
      wikiUrl: null
    };

    this.linkTo = this.linkTo.bind(this);
  }

  componentDidMount() {
    this.loadTaxonInfo();
    this.loadBackgroundInfo();
  }

  loadTaxonInfo() {
    let taxonList = [this.props.taxonId];
    if (this.props.parentTaxonId) {
      taxonList.push(this.props.parentTaxonId);
    }
    Axios.get(`/taxon_descriptions.json?taxon_list=${taxonList.join(",")}`, {
      params: {
        taxon: this.props.taxonId
      }
    })
      .then(response => {
        let taxonInfo = response.data[this.props.taxonId];
        let parentTaxonInfo =
          this.props.parentTaxonId && response.data[this.props.parentTaxonId];
        if (taxonInfo) {
          this.setState({
            taxonDescription: response.data[this.props.taxonId].summary || "",
            wikiUrl: response.data[this.props.taxonId].wiki_url || ""
          });
        }
        if (parentTaxonInfo) {
          this.setState({
            taxonParentName: response.data[this.props.parentTaxonId].title,
            taxonParentDescription:
              response.data[this.props.parentTaxonId].summary
          });
        }
      })
      .catch(error => {
        // TODO: properly handle error
        // eslint-disable-next-line no-console
        console.error("Error loading taxon information: ", error);
      });
  }

  loadBackgroundInfo() {
    this.histogram = null;
    Axios.get(
      `/backgrounds/${this.state.background.id}/show_taxon_dist.json?taxid=${
        this.props.taxonId
      }`,
      {
        params: {
          taxon: this.props.taxonId
        }
      }
    )
      .then(response => {
        let data = response.data;
        if (
          Object.keys(data).length &&
          (data.NT || {}).rpm_list &&
          (data.NR || []).rpm_list
        ) {
          let rpmSeries = [data.NT.rpm_list, data.NR.rpm_list];
          this.setState({
            showHistogram: true
          });
          this.histogram = new Histogram(this.histogramContainer, rpmSeries, {
            seriesNames: ["NT", "NR"],
            labelX: "rpm",
            labelY: "count",
            refValues: [
              {
                name: "sample",
                values: [
                  this.props.taxonValues.NT.rpm,
                  this.props.taxonValues.NR.rpm
                ]
              }
            ]
          });
          this.histogram.update();
        }
      })
      .catch(error => {
        // TODO: properly handle error
        // eslint-disable-next-line no-console
        console.error("Unable to retrieve background info", error);
      });
  }

  linkTo(source) {
    let url = null;
    switch (source) {
      case "ncbi":
        url = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${
          this.props.taxonId
        }`;
        break;
      case "google":
        url = `http://www.google.com/search?q=${this.props.taxonName}`;
        break;
      case "pubmed":
        url = `https://www.ncbi.nlm.nih.gov/pubmed/?term=${
          this.props.taxonName
        }`;
        break;
      case "wikipedia":
        url = this.state.wikiUrl;
        break;
      default:
        break;
    }

    if (url) {
      window.open(url, "_blank", "noopener", "noreferrer");
    }
  }

  render() {
    // The Modal component always expects a 'trigger', even though it doesn't make sense in our use case.
    // <TaxonModal> is always open when rendered. To hide <TaxonModal>, we simply don't render it.
    return (
      <Modal
        title={this.props.taxonName}
        trigger={<span />}
        open
        onClose={this.props.handleClose}
      >
        <div className="taxon-info">
          <div className="taxon-info__label" />
          {this.state.taxonDescription && (
            <div>
              <div className="taxon-info__subtitle">Description</div>
              <div className="taxon-info__text">
                {this.state.taxonDescription}
              </div>
            </div>
          )}
          {this.state.taxonParentName && (
            <div>
              <div className="taxon-info__subtitle">
                Genus: {this.state.taxonParentName}
              </div>
              <div className="taxon-info__text">
                {this.state.taxonParentDescription}
              </div>
            </div>
          )}
          {this.state.showHistogram && (
            <div>
              <div className="taxon-info__subtitle">
                Reference Background: {this.state.background.name}
              </div>
              <div
                className="taxon-info__histogram"
                ref={histogramContainer => {
                  this.histogramContainer = histogramContainer;
                }}
              />
            </div>
          )}
          <div className="taxon-info__subtitle">Links</div>
          <div className="taxon-info__links-section">
            <ul className="taxon-info__links-list">
              <li
                className="taxon-info__link"
                onClick={() => this.linkTo("ncbi")}
              >
                NCBI
              </li>
              <li
                className="taxon-info__link"
                onClick={() => this.linkTo("google")}
              >
                Google
              </li>
            </ul>
            <ul className="taxon-info__links-list">
              {this.state.wikiUrl && (
                <li
                  className="taxon-info__link"
                  onClick={() => this.linkTo("wikipedia")}
                >
                  Wikipedia
                </li>
              )}
              <li
                className="taxon-info__link"
                onClick={() => this.linkTo("pubmed")}
              >
                Pubmed
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    );
  }
}

TaxonModal.propTypes = {
  background: PropTypes.object,
  parentTaxonId: PropTypes.number,
  taxonId: PropTypes.number,
  taxonName: PropTypes.string,
  taxonValues: PropTypes.object
};

export default TaxonModal;
