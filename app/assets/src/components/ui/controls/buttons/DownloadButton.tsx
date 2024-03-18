import { Button, Icon, IconNameToSizes } from "@czi-sds/components";
import React from "react";

interface DownloadButtonProps {
  disabled?: boolean;
  onClick?: $TSFixMeFunction;
  text?: string;
  className?: string;
  primary?: boolean;
  startIcon?: keyof IconNameToSizes;
}

const DownloadButton = ({
  disabled,
  onClick,
  text = "Download",
  className,
  primary = false,
  startIcon,
}: DownloadButtonProps) => {
  const iconName = startIcon ?? "download";
  return (
    <Button
      className={className}
      sdsStyle="rounded"
      sdsType={primary ? "primary" : "secondary"}
      disabled={disabled}
      onClick={onClick}
      startIcon={<Icon sdsIcon={iconName} sdsSize="l" sdsType="button" />}
    >
      {text}
    </Button>
  );
};

export default DownloadButton;
