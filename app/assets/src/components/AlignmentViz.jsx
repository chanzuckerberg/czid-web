import axios from "axios";
import React from "react";

class AccessionViz extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        {this.props.accession} : {this.props.reads_count}
      </div>
    );
  }
}

class AlignmentViz extends React.Component {
  constructor(props) {
    super(props);
    this.sampleId = props.sampleId
    this.alignmentQuery = props.alignmentQuery
    this.alignmentData = []

    this.fetchAlignmentData = this.fetchAlignmentData.bind(this)
  }

  componentWillMount() {
    this.fetchAlignmentData();
  }

  this.fetchAlignmentData() {
    axios
      .get(`/samples/${this.sampleId}/alignment/${this.alignmentQuery}.json`)
      .then(res => {
        this.alignmentData = res.data;
      })
      .catch(() => {});
  }

  render() {
    return (
      <div>
      {
        this.alignmentData.map(function(item, i) {
          <AccessionViz  {key=`accession_${i}` ,...item } />
        })
      }
      </div>
    );
  }
}

export default AlignmentViz;
