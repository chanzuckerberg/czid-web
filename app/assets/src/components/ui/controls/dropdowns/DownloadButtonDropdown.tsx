import { Icon } from "czifui";
import React from "react";

import ButtonDropdown from "./ButtonDropdown";

interface DownloadButtonDropdown {
  className?: string;
  disabled?: boolean;
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
      fluid
      text="Download"
      icon={<Icon sdsIcon="download" sdsSize="l" sdsType="button" />}
    />
  );
};

export default DownloadButtonDropdown;
