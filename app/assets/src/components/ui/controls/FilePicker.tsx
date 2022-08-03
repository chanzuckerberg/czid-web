import cx from "classnames";
import React, { useState } from "react";

import Dropzone from "react-dropzone";
import Icon from "../icons/Icon";
import IconLoading from "../icons/IconLoading";
import cs from "./file_picker.scss";
interface FilePickerProps {
  className?: string;
  accept?: string;
  file?: File;
  onChange: $TSFixMeFunction;
  message?: string;
  title?: string;
  onRejected?: $TSFixMeFunction;
  multiFile?: boolean;
  finishedValidating?: boolean;
}

const FilePicker = ({
  accept,
  onChange,
  message,
  onRejected,
  title,
  multiFile,
  className,
  file,
  finishedValidating,
}: FilePickerProps) => {
  const [selectedFile, setSelectedFile] = useState(null);

  // Default handler for dropped files being rejected
  const defaultOnRejected = () => {
    window.alert("File could not be selected for upload");
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
      minSize={1}
      onDrop={onChange || defaultOnChange}
      onDropRejected={onRejected || defaultOnRejected}
      className={cx(cs.filePicker, className, getFile() && cs.active)}
    >
      <div className={cs.inner}>
        <div className={cs.title}>
          {title && !finishedValidating && (
            <IconLoading className={cs.loadingIndicator} />
          )}
          {title}
        </div>
        {filePickerContent()}
      </div>
    </Dropzone>
  );
};

export default FilePicker;
