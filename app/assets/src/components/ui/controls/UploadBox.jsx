import Dropzone from "react-dropzone";
import PropTypes from "prop-types";
import React from "react";
import Icon from "../icons/Icon";
import axios from "axios/index";

class UploadBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      uploadRan: false
    };
  }

  // Handle dropped files being rejected
  onDropRejected = () => {
    window.alert(
      "Invalid file. File size must be under 5GB for local uploads."
    );
  };

  // Overridden by props.onDrop
  onDrop = accepted => {
    if (accepted.length > 0) {
      this.setState({
        fileToUpload: accepted[0] // Overridden by props.fileToUpload
      });
    }
  };

  uploadFileToURL = (file, url) => {
    const config = {
      onUploadProgress: e => {
        const percent = Math.round(e.loaded * 100 / e.total);
        this.setState({ uploadProgress: percent });
      }
    };
    axios
      .put(url, file, config)
      .then(() => {
        this.props.handleSuccess(file);
      })
      .catch(err => {
        this.props.handleFailure(file, err);
      });
  };

  render() {
    let fileContent;
    let className = "idseq-ui upload-box";
    const fileToUpload = this.props.fileToUpload || this.state.fileToUpload;
    const uploadProgress = this.state.uploadProgress;

    // Check and start upload
    if (fileToUpload && this.props.startUpload && !this.state.uploadRan) {
      this.setState({ uploadRan: true }, () =>
        this.uploadFileToURL(fileToUpload, this.props.url)
      );
    }

    if (fileToUpload) {
      fileContent = (
        <div className="upload-box-file">
          <div>
            <Icon name="checkmark" />
            {fileToUpload.name}
          </div>
          {uploadProgress ? (
            <div className="upload-box-progress">
              {`${uploadProgress}% uploaded...`}
            </div>
          ) : null}
        </div>
      );
      className += " active";
    } else {
      fileContent = (
        <div>
          <span>Drag and drop a file here, or </span>
          <span className="upload-box-link">click to use a file browser.</span>
        </div>
      );
    }

    return (
      <Dropzone
        acceptClassName="active"
        maxSize={5e9}
        onDrop={this.props.onDrop || this.onDrop}
        onDropRejected={this.onDropRejected}
        className={className}
      >
        <div className="upload-box-inside">
          <div className="upload-box-file-title">{this.props.title}</div>
          {fileContent}
        </div>
      </Dropzone>
    );
  }
}

UploadBox.propTypes = {
  title: PropTypes.string,
  fileToUpload: PropTypes.object,
  url: PropTypes.string,
  startUpload: PropTypes.bool,
  onDrop: PropTypes.func,
  handleSuccess: PropTypes.func,
  handleFailure: PropTypes.func
};

export default UploadBox;
