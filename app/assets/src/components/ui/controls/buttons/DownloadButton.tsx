import { Button, Icon } from "czifui";
import React from "react";

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
  className,
}: DownloadButtonProps) => {
  return (
    <Button
      className={className}
      sdsStyle="rounded"
      sdsType="secondary"
      disabled={disabled}
      onClick={onClick}
      startIcon={<Icon sdsIcon="download" sdsSize="l" sdsType="button" />}
    >
      {text}
    </Button>
  );
};

DownloadButton.defaultProps = {
  primary: false,
  text: "Download",
};

export default DownloadButton;
