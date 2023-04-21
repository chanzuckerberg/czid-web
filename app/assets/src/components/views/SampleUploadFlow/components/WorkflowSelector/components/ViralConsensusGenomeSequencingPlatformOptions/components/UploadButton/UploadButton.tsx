import { Button, Icon } from "czifui";
import React, { useRef } from "react";
import cs from "./upload_button.scss";

interface UploadButtonProps {
  fileTypes: string[];
  onFileChanged(file?: File): void;
}

const UploadButton = ({
  fileTypes,
  onFileChanged,
  ...props
}: UploadButtonProps) => {
  const inputRef = useRef(null);

  const openFileChooser = () => {
    inputRef.current.click();
  };

  const handleFileChange = e => onFileChanged(e?.target?.files?.[0]);

  return (
    <>
      <Button
        className={cs.button}
        sdsType="primary"
        sdsStyle="minimal"
        isAllCaps
        onClick={openFileChooser}
        {...props}
      >
        <Icon
          className={cs.icon}
          sdsIcon="download"
          sdsSize="xs"
          sdsType="button"
        />{" "}
        {/* // TODO (mlila): upload icon instead of download */}
        <div>Select file</div>
      </Button>
      <input
        ref={inputRef}
        className={cs.input}
        type="file"
        accept={fileTypes.join(",")}
        onChange={handleFileChange}
      ></input>
    </>
  );
};

export { UploadButton };
