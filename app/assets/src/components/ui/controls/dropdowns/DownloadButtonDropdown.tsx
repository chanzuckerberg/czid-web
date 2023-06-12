import { Icon } from "@czi-sds/components";
import React from "react";
import ButtonDropdown from "./ButtonDropdown";

interface OptionType {
  text: string | JSX.Element;
  value: string | number;
  suboptions?: OptionType[];
  disabled?: boolean;
}

interface DownloadButtonDropdown {
  className?: string;
  disabled?: boolean;
  items?: React.ReactNode[];
  options?: OptionType[];
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
