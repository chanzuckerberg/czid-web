import React from "react";

import { IconDownload } from "~ui/icons";

import ButtonDropdown from "./ButtonDropdown";

import cs from "./download_button_dropdown.scss";

interface DownloadButtonDropdown {
  className: string;
  disabled: boolean;
  items?: React.ReactNode[];
  options: $TSFixMe[];
  onClick: $TSFixMeFunction;
  direction?: "left" | "right";
}

const DownloadButtonDropdown = (props: DownloadButtonDropdown) => {
  return (
    <ButtonDropdown
      {...props}
      secondary
      // @ts-expect-error Property 'fluid' does not exist
      fluid
      text="Download"
      icon={<IconDownload className={cs.iconDownload} />}
    />
  );
};

export default DownloadButtonDropdown;
