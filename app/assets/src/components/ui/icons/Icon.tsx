import React from "react";
import { Icon as BaseIcon, IconProps } from "semantic-ui-react";

const Icon = ({ name, size, className, onClick }: IconProps) => {
  return (
    <BaseIcon className={className} name={name} size={size} onClick={onClick} />
  );
};

export default Icon;
