import React from "react";
import IconDownload from "~ui/icons/IconDownload";
import SecondaryButton from "./SecondaryButton";

import cs from "./download_button.scss";

interface DownloadButtonProps {
  disabled?: boolean;
  onClick?: $TSFixMeFunction;
  text?: string;
  className?: string;
}

const DownloadButton = ({
  disabled,
  onClick,
  text,
  ...props
}: DownloadButtonProps) => {
  return (
    <SecondaryButton
      {...props}
      text={text}
      disabled={disabled}
      onClick={onClick}
      icon={<IconDownload className={cs.iconDownload} />}
    />
  );
};

DownloadButton.defaultProps = {
  primary: false,
  text: "Download",
};

export default DownloadButton;
