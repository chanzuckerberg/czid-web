import Dropzone from "react-dropzone";
import PropTypes from "prop-types";
import React from "react";
import Icon from "../icons/Icon";

class UploadBox extends React.Component {
  constructor(props) {
    super(props);
  }

  // Handle dropped files being rejected
  onDropRejected = () => {
    window.alert(
      "Invalid file. File size must be under 5GB for local uploads."
    );
  };

  render() {
    let fileContent;
    let className = "idseq-ui upload-box";
    const fileToUpload = this.props.fileToUpload;
    const uploadProgress = this.props.uploadProgress;

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
        onDrop={this.props.onDrop}
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
  uploadProgress: PropTypes.number,
  onDrop: PropTypes.func
};

export default UploadBox;
