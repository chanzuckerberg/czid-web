import cx from "classnames";
import React, { useContext, useState } from "react";
import Dropzone, { FileWithPreview } from "react-dropzone";
import { UserContext } from "~/components/common/UserContext";
import { PRE_UPLOAD_CHECK_FEATURE } from "~/components/utils/features";
import { MAX_FILE_SIZE } from "~/components/views/SampleUploadFlow/constants";
import Icon from "../icons/Icon";
import cs from "./file_picker.scss";

interface FilePickerProps {
  className?: string;
  accept?: string;
  file?: File;
  onChange: $TSFixMeFunction;
  message?: string;
  title?: string;
  onRejected?: (rejectedFiles: FileWithPreview[]) => void;
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
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

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
        <span className={cs.browserLink} data-testid="select-sample-files">
          click to use a file browser.
        </span>
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
      data-testid="drop-sample-files"
    >
      <div className={cs.inner}>
        <div className={cs.title}>
          {title &&
            finishedValidating === false &&
            allowedFeatures.includes(PRE_UPLOAD_CHECK_FEATURE) && (
              <i className="fa fa-spinner fa-pulse fa-fw" />
            )}
          {title}
        </div>
        {filePickerContent()}
      </div>
    </Dropzone>
  );
};

export default FilePicker;
