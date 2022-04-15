import cx from "classnames";
import PropTypes from "prop-types";
import React, { useContext, useState } from "react";

import Dropzone from "react-dropzone";
import { UserContext } from "~/components/common/UserContext";
import { LOCAL_MULTIPART_UPLOADS_FEATURE } from "~/components/utils/features";
import Icon from "../icons/Icon";
import cs from "./file_picker.scss";

const FilePicker = ({
  accept,
  onChange,
  message,
  onRejected,
  title,
  multiFile,
  className,
  file,
}) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures = [] } = userContext || {};

  const [selectedFile, setSelectedFile] = useState(null);

  const MAX_FILE_SIZE = allowedFeatures.includes(
    LOCAL_MULTIPART_UPLOADS_FEATURE,
  )
    ? Infinity
    : 5e9;

  // Default handler for dropped files being rejected
  const defaultOnRejected = () => {
    if (allowedFeatures.includes(LOCAL_MULTIPART_UPLOADS_FEATURE)) {
      window.alert("File could not be selected for upload");
    } else {
      window.alert(
        "Invalid file. File size must be under 5GB for local uploads.",
      );
    }
  };

  // Default handler for dropped files
  const defaultOnChange = accepted => {
    if (accepted.length > 0) {
      setSelectedFile(accepted[0]);
    }
  };

  const getFile = () => file || selectedFile;

  const filePickerContent = () => {
    // TODO(mark): Add UI for multiple files.
    const contentFile = getFile();
    return contentFile ? (
      <div>
        <div className={cx(cs.fileBox, !title && cs.noTitle)}>
          <Icon className={cs.checkmarkIcon} name="checkmark" />
          <span className={cs.fileName}>{contentFile.name} </span>loaded
        </div>
        {message ? <div className={cs.message}>{message}</div> : null}
      </div>
    ) : (
      <div className={cs.instructions}>
        <span>
          Drag and drop {multiFile ? "your files" : "a file"} here, or{" "}
        </span>
        <span className={cs.browserLink}>click to use a file browser.</span>
      </div>
    );
  };

  return (
    <Dropzone
      acceptClassName={cs.accepted}
      accept={accept}
      maxSize={MAX_FILE_SIZE}
      minSize={1}
      onDrop={onChange || defaultOnChange}
      onDropRejected={onRejected || defaultOnRejected}
      className={cx(cs.filePicker, className, getFile() && cs.active)}
    >
      <div className={cs.inner}>
        <div className={cs.title}>{title}</div>
        {filePickerContent()}
      </div>
    </Dropzone>
  );
};

FilePicker.propTypes = {
  className: PropTypes.string,
  accept: PropTypes.string,
  file: PropTypes.instanceOf(File),
  onChange: PropTypes.func.isRequired,
  message: PropTypes.string,
  title: PropTypes.string,
  onRejected: PropTypes.func,
  multiFile: PropTypes.bool,
};

export default FilePicker;
