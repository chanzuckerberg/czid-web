import React from "react";
import Dropzone from "react-dropzone";
import cx from "classnames";
import PropTypes from "prop-types";
import Icon from "../icons/Icon";
import cs from "./file_picker.scss";

class FilePicker extends React.Component {
  state = {
    file: null
  };

  // Default handler for dropped files being rejected
  onRejected = () => {
    window.alert(
      "Invalid file. File size must be under 5GB for local uploads."
    );
  };

  // Default handler for dropped files
  onChange = accepted => {
    if (accepted.length > 0) {
      this.setState({
        file: accepted[0]
      });
    }
  };

  render() {
    const {
      onChange,
      message,
      onRejected,
      title,
      multiFile,
      className
    } = this.props;
    const file = this.props.file || this.state.file;
    let content;
    // TODO(mark): Add UI for multiple files.
    if (file) {
      content = (
        <div>
          <div className={cx(cs.fileBox, !title && cs.noTitle)}>
            <Icon className={cs.checkmarkIcon} name="checkmark" />
            <span className={cs.fileName}>{file.name} </span>loaded
          </div>
          {message ? <div className={cs.message}>{message}</div> : null}
        </div>
      );
    } else {
      content = (
        <div className={cs.instructions}>
          <span>
            Drag and drop {multiFile ? "your files" : "a file"} here, or{" "}
          </span>
          <span className={cs.browserLink}>click to use a file browser.</span>
        </div>
      );
    }

    return (
      <Dropzone
        acceptClassName={cs.accepted}
        maxSize={5e9}
        onDrop={onChange || this.onChange}
        onDropRejected={onRejected || this.onRejected}
        className={cx(cs.filePicker, className, file && cs.active)}
      >
        <div className={cs.inner}>
          <div className={cs.title}>{title}</div>
          {content}
        </div>
      </Dropzone>
    );
  }
}

FilePicker.propTypes = {
  className: PropTypes.string,
  file: PropTypes.instanceOf(File),
  onChange: PropTypes.func.isRequired,
  message: PropTypes.string,
  title: PropTypes.string,
  onRejected: PropTypes.func,
  multiFile: PropTypes.bool
};

export default FilePicker;
