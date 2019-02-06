import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";
import { getTaxonDescriptions, getTaxonDistributionForBackground } from "~/api";
import Histogram from "~/components/visualizations/Histogram";
import cs from "./taxon_details_mode.scss";

const COLLAPSED_HEIGHT = 120;

export default class TaxonDetailsMode extends React.Component {
  state = {
    loading: false,
    showHistogram: false,
    taxonDescription: "",
    taxonParentName: "",
    taxonParentDescription: "",
    wikiUrl: null,
    collapseTaxonDescription: true,
    collapseParentDescription: true,
    taxonDescriptionTall: false,
    parentDescriptionTall: false
  };

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.taxonId !== this.props.taxonId ||
      prevProps.background !== this.props.background
    ) {
      this.loadData();
    }

    // Need the histogramContainer to be visible first.
    if (prevState.loading && !this.state.loading && this.state.showHistogram) {
      this.renderHistogram();
    }

    if (
      this._taxonDescription &&
      this._taxonDescription.clientHeight > COLLAPSED_HEIGHT &&
      !this.state.taxonDescriptionTall
    ) {
      this.setState({
        taxonDescriptionTall: true
      });
    }

    if (
      this._taxonParentDescription &&
      this._taxonParentDescription.clientHeight > COLLAPSED_HEIGHT &&
      !this.state.parentDescriptionTall
    ) {
      this.setState({
        parentDescriptionTall: true
      });
    }
  }

  loadData = async () => {
    this.setState({
      loading: true,
      showHistogram: false,
      taxonDescription: "",
      taxonParentName: "",
      taxonParentDescription: "",
      wikiUrl: null,
      collapseTaxonDescription: true,
      collapseParentDescription: true,
      taxonDescriptionTall: false,
      parentDescriptionTall: false
    });

    await Promise.all([this.loadTaxonInfo(), this.loadBackgroundInfo()]);

    this.setState({
      loading: false
    });
  };

  loadTaxonInfo() {
    let taxonList = [this.props.taxonId];
    if (this.props.parentTaxonId) {
      taxonList.push(this.props.parentTaxonId);
    }
    return getTaxonDescriptions(taxonList)
      .then(response => {
        let taxonInfo = response[this.props.taxonId];
        let parentTaxonInfo =
          this.props.parentTaxonId && response[this.props.parentTaxonId];

        if (taxonInfo) {
          this.setState({
            taxonDescription: response[this.props.taxonId].summary || "",
            wikiUrl: response[this.props.taxonId].wiki_url || ""
          });
        }

        if (parentTaxonInfo) {
          this.setState({
            taxonParentName: response[this.props.parentTaxonId].title,
            taxonParentDescription: response[this.props.parentTaxonId].summary
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
    if (
      !this.props.background ||
      !this.props.taxonId ||
      !this.props.taxonValues
    ) {
      return Promise.resolve();
    }
    this.histogram = null;
    return getTaxonDistributionForBackground(
      this.props.background.id,
      this.props.taxonId
    )
      .then(data => {
        if (
          Object.keys(data).length &&
          (data.NT || {}).rpm_list &&
          (data.NR || []).rpm_list
        ) {
          let rpmSeries = [data.NT.rpm_list, data.NR.rpm_list];
          this.setState({
            histogramRpmSeries: rpmSeries,
            showHistogram: true
          });
        }
      })
      .catch(error => {
        // TODO: properly handle error
        // eslint-disable-next-line no-console
        console.error("Unable to retrieve background info", error);
      });
  }

  expandTaxonDescription = () => {
    this.setState({
      collapseTaxonDescription: false
    });
  };

  expandParentDescription = () => {
    this.setState({
      collapseParentDescription: false
    });
  };

  renderHistogram = () => {
    this.histogram = new Histogram(
      this.histogramContainer,
      this.state.histogramRpmSeries,
      {
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
      }
    );
    this.histogram.update();
  };

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

  renderTaxonContents = () => {
    return (
      <div className={cs.taxonContents}>
        {this.state.taxonDescription && (
          <div>
            <div className={cs.subtitle}>Description</div>
            <div
              className={cx(
                cs.text,
                this.state.collapseTaxonDescription && cs.collapsed
              )}
            >
              <div
                className={cs.textInner}
                ref={c => (this._taxonDescription = c)}
              >
                {this.state.taxonDescription}
              </div>
            </div>
            {this.state.collapseTaxonDescription &&
              this.state.taxonDescriptionTall && (
                <div
                  className={cs.expandLink}
                  onClick={this.expandTaxonDescription}
                >
                  Show More
                </div>
              )}
          </div>
        )}
        {this.state.taxonParentName && (
          <div>
            <div className={cs.subtitle}>
              Genus: {this.state.taxonParentName}
            </div>
            <div
              className={cx(
                cs.text,
                this.state.collapseParentDescription && cs.collapsed
              )}
            >
              <div
                className={cs.textInner}
                ref={c => (this._taxonParentDescription = c)}
              >
                {this.state.taxonParentDescription}
              </div>
            </div>
            {this.state.collapseParentDescription &&
              this.state.parentDescriptionTall && (
                <div
                  className={cs.expandLink}
                  onClick={this.expandParentDescription}
                >
                  Show More
                </div>
              )}
          </div>
        )}
        {this.state.showHistogram && (
          <div>
            <div className={cs.subtitle}>
              Reference Background: {this.props.background.name}
            </div>
            <div
              className={cs.histogram}
              ref={histogramContainer => {
                this.histogramContainer = histogramContainer;
              }}
            />
          </div>
        )}
        <div className={cs.subtitle}>Links</div>
        <div className={cs.linksSection}>
          <ul className={cs.linksList}>
            <li className={cs.link} onClick={() => this.linkTo("ncbi")}>
              NCBI
            </li>
            <li className={cs.link} onClick={() => this.linkTo("google")}>
              Google
            </li>
          </ul>
          <ul className={cs.linksList}>
            {this.state.wikiUrl && (
              <li className={cs.link} onClick={() => this.linkTo("wikipedia")}>
                Wikipedia
              </li>
            )}
            <li className={cs.link} onClick={() => this.linkTo("pubmed")}>
              Pubmed
            </li>
          </ul>
        </div>
      </div>
    );
  };

  render() {
    const { loading } = this.state;

    return (
      <div className={cs.content}>
        {loading ? (
          <div className={cs.loadingMsg}>Loading...</div>
        ) : (
          <div className={cs.title}>{this.props.taxonName}</div>
        )}
        {!loading && this.renderTaxonContents()}
      </div>
    );
  }
}

TaxonDetailsMode.propTypes = {
  taxonId: PropTypes.number.isRequired,
  taxonName: PropTypes.string.isRequired,
  parentTaxonId: PropTypes.number,
  taxonValues: PropTypes.object,
  background: PropTypes.object
};
