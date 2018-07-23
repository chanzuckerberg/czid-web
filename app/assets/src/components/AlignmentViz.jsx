import axios from "axios";
import React from "react";
import AccessionViz from "./AccessionViz";

class AlignmentViz extends React.Component {
  constructor(props) {
    super();
    this.sampleId = props.sampleId;
    this.alignmentQuery = props.alignmentQuery;
    this.taxId = props.taxId;
    this.taxLevel = props.taxLevel;
    this.taxName = props.taxName;
    this.pipelineVersion = props.pipelineVersion;
    this.readsPerPage = props.readsPerPage || 20;
    this.fetchAlignmentData = this.fetchAlignmentData.bind(this);
    this.state = {
      alignmentData: [],
      loading: true
    };
  }

  componentWillMount() {
    this.fetchAlignmentData();
  }

  fetchAlignmentData() {
    axios
      .get(
        `/samples/${this.sampleId}/alignment_viz/${
          this.alignmentQuery
        }.json?pipeline_version=${this.pipelineVersion}`
      )
      .then(res => {
        this.setState({
          alignmentData: res.data,
          loading: false
        });
      });
  }

  render() {
    return this.state.loading ? (
      <div>
        {" "}
        <h2>
          Loading alignment data for {this.taxName} ({this.taxLevel}) ...{" "}
        </h2>
      </div>
    ) : (
      <div>
        <h2>
          {" "}
          {this.taxName ? this.taxName + " (" + this.taxLevel + ")" : ""}{" "}
          Alignment ({this.state.alignmentData.length} unique accessions)
        </h2>
        <div style={{ margin: "15px" }}>
          {this.state.alignmentData.map(function(item, i) {
            return (
              <AccessionViz
                key={`accession_${i}`}
                readsPerPage={this.readsPerPage}
                {...item}
              />
            );
          }, this)}
        </div>
      </div>
    );
  }
}

export default AlignmentViz;
