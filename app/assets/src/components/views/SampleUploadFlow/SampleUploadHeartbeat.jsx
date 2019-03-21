import React from "react";
import PropTypes from "prop-types";
import { updateUploadHeartbeat } from "~/api/upload";

class SampleUploadHeartbeat extends React.Component {
  componentDidMount() {
    console.log("I mounted 3:55pm");
    console.log(this.props.sampleIds);
    setInterval(() => {
      console.log("let's call shit");

      this.props.sampleIds.forEach(id => {
        if (id !== "") {
          id = parseInt(id);
          updateUploadHeartbeat(id)
            .then(() => console.log("called"))
            .catch(() => console.log("Can't connect to IDseq server."));
        }
      });
    }, 10000);
  }

  render() {
    return null;
  }
}

SampleUploadHeartbeat.propTypes = {
  sampleIds: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default SampleUploadHeartbeat;
