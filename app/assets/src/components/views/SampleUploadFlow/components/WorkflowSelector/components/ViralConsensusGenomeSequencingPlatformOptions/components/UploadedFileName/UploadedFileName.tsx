import { ButtonIcon } from "czifui";
import React from "react";
import cs from "./uploaded_file_name.scss";

interface UploadedFileNameProps {
  fileName: string;
  onFileChanged(file?: File): void;
}

const UploadedFileName = ({
  fileName,
  onFileChanged,
}: UploadedFileNameProps) => (
  <div className={cs.uploadedFileName}>
    <span>{fileName}</span>
    <ButtonIcon
      aria-label="Close"
      sdsType="tertiary"
      sdsSize="small"
      // The intention of this button is to remove the file data from state. As such, we must
      // explicitly call without arguments here, otherwise the click event will be set as the file content.
      onClick={() => onFileChanged()}
      sdsIcon="xMark"
    />
  </div>
);

export { UploadedFileName };
