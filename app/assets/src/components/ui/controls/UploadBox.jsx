// Allows picking a file and also uploading the file to a URL.
import PropTypes from "prop-types";
import React from "react";
import FilePicker from "./FilePicker";
import { uploadFileToUrlWithRetries } from "~/api";

class UploadBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      uploadRan: false
    };
  }

  uploadFileToURL = (file, url) => {
    uploadFileToUrlWithRetries(file, url, {
      onUploadProgress: e => {
        const percent = Math.round(e.loaded * 100 / e.total);
        this.setState({ uploadProgress: percent });
      },
      onSuccess: () => this.props.handleSuccess(file),
      onError: err => this.props.handleFailure(file, err)
    });
  };

  render() {
    const fileToUpload = this.props.fileToUpload;
    const uploadProgress = this.state.uploadProgress;

    // Check and start upload
    if (fileToUpload && this.props.startUpload && !this.state.uploadRan) {
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
