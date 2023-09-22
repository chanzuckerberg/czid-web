import React from "react";
import { DownloadButton } from "~/components/ui/controls/buttons";

export interface DownloadAllButtonProps {
  readyToDownload: boolean;
  className?: string;
  handleDownloadAllClick: () => void;
}

export const DownloadAllButton = ({
  readyToDownload,
  handleDownloadAllClick,
  className,
}: DownloadAllButtonProps) => {
  return (
    readyToDownload && (
      <DownloadButton
        className={className}
        text="Download All"
        onClick={handleDownloadAllClick}
      />
    )
  );
};
