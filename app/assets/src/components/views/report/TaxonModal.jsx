import React from "react";
import Axios from "axios";
import Modal from "../../ui/containers/Modal";
import PropTypes from "prop-types";
import Histogram from "../../visualizations/Histogram";

class TaxonModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      firstOpen: true,
      taxonDescription: "",
      taxonParentName: "",
      taxonParentDescription: ""
    };

    this.histogram = null;

    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = () => this.setState({ open: false });
  }

  handleOpen() {
    if (!this.firstOpen) {
      this.loadTaxonInfo();
      this.loadTaxonData();
    }
    this.firstOpen = false;
    this.setState({ open: true });
  }

  loadTaxonInfo() {
    Axios.get("/taxon/description.json", {
      params: {
        taxon: this.props.taxonId
      }
    })
      .then(response => {
        this.setState({
          taxonDescription: response.data.description,
          taxonParentName: "Fake genus parent",
          taxonParentDescription: response.data.parentDescription
        });
      })
      .catch(error => {
        // // TODO: properly handle error
        // // eslint-disable-next-line no-console
        // console.error("Error loading existing phylo trees: ", error);
        let taxonDescription = `This is a sample description for
                    test purposes to be replaced by proper information once backend
                    part is implements.
                    This sentence should appear in a new line.
                    This one too.
                    I guess this already long enough of a description for test 
                    purposes.`;
        let taxonParentName = "Fake genus parent";
        let taxonParentDescription = `This is the same as the normal 
                    description but for a potential parent of the taxon being 
                    visualized.`;
        this.setState({
          taxonDescription,
          taxonParentName,
          taxonParentDescription
        });
      });
  }

  loadTaxonData() {
    Axios.get("/taxon/data.json", {
      params: {
        taxon: this.props.taxonId
      }
    })
      .then(response => {
        this.histogram = new Histogram(this.histogramContainer, response.data);
        this.histogram.update();
      })
      .catch(error => {
        this.histogram = new Histogram(this.histogramContainer, [
          2,
          3,
          3.1,
          4,
          5,
          7,
          8,
          9,
          8.2,
          8.3,
          8.6,
          5.4,
          5.3,
          5.8,
          5.7,
          4.3,
          4.9
        ]);
        this.histogram.update();
      });
  }

  render() {
    return (
      <Modal
        title={this.props.taxonName}
        trigger={<span onClick={this.handleOpen}>{this.props.trigger}</span>}
        open={this.state.open}
        onClose={this.handleClose}
      >
        {this.state.open && (
          <div className="taxon-info">
            <div className="taxon-info__label" />
            {this.state.taxonDescription && (
              <div>
                <div className="taxon-info__subtitle">Description</div>
                <div>{this.state.taxonDescription}</div>
              </div>
            )}
            {this.state.taxonParentName && (
              <div>
                <div className="taxon-info__subtitle">
                  Genus: {this.state.parentName}
                </div>
                <div>{this.state.taxonParentDescription}</div>
              </div>
            )}
            <div className="taxon-info__subtitle">
              Distribution in Project Samples
            </div>
            <div
              className="taxon-info__histogram"
              ref={histogramContainer => {
                this.histogramContainer = histogramContainer;
              }}
            />
          </div>
        )}
      </Modal>
    );
  }
}

TaxonModal.propTypes = {
  taxonName: PropTypes.string,
  trigger: PropTypes.node
};

export default TaxonModal;
