import React from "react";

class AccessionViz extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <div>
        <Samples {...this.props} />
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
  }

  componentWillMount() {
    this.fetchAlignmentData();
  }

  render() {
    return (
      <div>
        <Samples {...this.props} />
      </div>
    );
  }
}

export default AlignmentViz;
