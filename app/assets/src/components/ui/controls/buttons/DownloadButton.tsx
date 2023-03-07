import { Button, Icon } from "czifui";
import React from "react";

interface DownloadButtonProps {
  disabled?: boolean;
  onClick?: $TSFixMeFunction;
  text?: string;
  className?: string;
  primary?: boolean;
}

const DownloadButton = ({
  disabled,
  onClick,
  text = "Download",
  className,
  primary = false,
}: DownloadButtonProps) => {
  return (
    <Button
      className={className}
      sdsStyle="rounded"
      sdsType={primary ? "primary" : "secondary"}
      disabled={disabled}
      onClick={onClick}
      startIcon={<Icon sdsIcon="download" sdsSize="l" sdsType="button" />}
    >
      {text}
    </Button>
  );
};

export default DownloadButton;
