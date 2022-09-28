import React from "react";

import { IconDownload } from "~ui/icons";

import ButtonDropdown from "./ButtonDropdown";

import cs from "./download_button_dropdown.scss";

const DownloadButtonDropdown = (props: $TSFixMe) => {
  return (
    <ButtonDropdown
      {...props}
      secondary
      fluid
      text="Download"
      icon={<IconDownload className={cs.iconDownload} />}
    />
  );
};

export default DownloadButtonDropdown;
