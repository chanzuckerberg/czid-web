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
  render() {
    return (
      <div>
        <Samples {...this.props} />
      </div>
    );
  }
}

export default AlignmentViz;
