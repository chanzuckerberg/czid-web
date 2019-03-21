import React from "react";
import PropTypes from "prop-types";
import { updateUploadHeartbeat } from "~/api/upload";

class SampleUploadHeartbeat extends React.Component {
  componentDidMount() {
    console.log("I mounted 3:26pm");
    updateUploadHeartbeat(this.props.sampleId).catch(() =>
      console.log("Can't connect to IDseq server.")
    );
  }

  render() {
    return null;
  }
}

SampleUploadHeartbeat.propTypes = {
  sampleId: PropTypes.number.isRequired
};

export default SampleUploadHeartbeat;
