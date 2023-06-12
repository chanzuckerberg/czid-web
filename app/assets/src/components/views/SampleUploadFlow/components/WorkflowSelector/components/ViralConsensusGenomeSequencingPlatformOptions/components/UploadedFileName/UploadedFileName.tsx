import { TagFilter } from "@czi-sds/components";
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
    <TagFilter
      aria-label="Close"
      // The intention of this button is to remove the file data from state. As such, we must
      // explicitly call without arguments here, otherwise the click event will be set as the file content.

      data-testid="clear-uploaded-file-button"
      onDelete={() => onFileChanged()}
      label={fileName}
    />
  </div>
);

export { UploadedFileName };
