import React from "react";
import { IconProps } from "~/interface/icon";

const IconArrowUpSmall = ({ className }: IconProps) => {
  return (
    <svg className={className} width="14px" height="14px" viewBox="0 0 14 14">
      <g stroke="none" strokeWidth="1" fillRule="evenodd">
        <polygon
          transform="translate(6.994792, 7.431327) scale(1, -1) translate(-6.994792, -7.431327) "
          points="6.973 8.975 1.78238779 3.64909743 0.643808853 4.7264284 6.97100328 11.2135557 13.3457756 4.79372708 12.4597566 3.83072953 12.2757797 3.75 12.2210034 3.75 12.0428191 3.82464223"
        />
      </g>
    </svg>
  );
};

export default IconArrowUpSmall;
