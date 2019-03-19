// Allows picking a file and also uploading the file to a URL.
import PropTypes from "prop-types";
import React from "react";
import axios from "axios/index";
import axiosRetry from "axios-retry";
import FilePicker from "./FilePicker";

class UploadBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      uploadRan: false
    };
  }

  uploadFileToURL = (file, url) => {
    const config = {
      onUploadProgress: e => {
        const percent = Math.round(e.loaded * 100 / e.total);
        this.setState({ uploadProgress: percent });
      }
    };

    // Add up to 3 retries with retry-axios
    const client = axios.create();
    client.defaults.timeout = 10;
    axiosRetry(client, {
      retries: 5,
      retryDelay: () => 30000,
      retryCondition: () => true
    });
    client
      .put("awhefoihewaf", file, config)
      .then(() => {
        this.props.handleSuccess(file);
      })
      .catch(err => {
        this.props.handleFailure(file, err);
      });
  };

  render() {
    const fileToUpload = this.props.fileToUpload;
    const uploadProgress = this.state.uploadProgress;

    // Check and start upload
    if (fileToUpload && this.props.startUpload && !this.state.uploadRan) {
      console.log("1:44pm want to start upload");
      this.setState({ uploadRan: true }, () =>
        this.uploadFileToURL(fileToUpload, this.props.url)
      );
    }

    return (
      <FilePicker
        className={this.props.className}
        file={fileToUpload}
        onChange={this.props.onDrop}
        title={this.props.title}
        message={uploadProgress && `${uploadProgress}% uploaded...`}
      />
    );
  }
}

UploadBox.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  fileToUpload: PropTypes.object,
  url: PropTypes.string,
  startUpload: PropTypes.bool,
  onDrop: PropTypes.func,
  handleSuccess: PropTypes.func,
  handleFailure: PropTypes.func
};

export default UploadBox;
