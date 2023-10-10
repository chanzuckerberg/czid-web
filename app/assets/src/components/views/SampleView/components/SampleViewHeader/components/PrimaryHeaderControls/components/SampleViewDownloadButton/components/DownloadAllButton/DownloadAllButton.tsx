import React from "react";
import { DownloadButton } from "~/components/ui/controls/buttons";

export interface DownloadAllButtonProps {
  readyToDownload?: boolean;
  className?: string;
  handleDownloadAllClick?: () => void;
}

export const DownloadAllButton = ({
  readyToDownload,
  handleDownloadAllClick,
  className,
}: DownloadAllButtonProps) => {
  if (!readyToDownload || !handleDownloadAllClick) return null;
  return (
    <DownloadButton
      className={className}
      text="Download All"
      onClick={handleDownloadAllClick}
    />
  );
};
