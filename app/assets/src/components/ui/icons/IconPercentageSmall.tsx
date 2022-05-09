import React from "react";
import { IconProps } from "~/interface/icon";

const IconPercentageSmall = ({ className }: IconProps) => {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="none" strokeWidth="1" fillRule="evenodd">
        <path d="M10.9764 12.4764C11.8049 12.4764 12.4764 11.8049 12.4764 10.9764C12.4764 10.148 11.8049 9.47641 10.9764 9.47641C10.148 9.47641 9.47641 10.148 9.47641 10.9764C9.47641 11.8049 10.148 12.4764 10.9764 12.4764Z" />
        <rect
          x="11.2079"
          y="1.02426"
          width="2.5"
          height="14.4019"
          rx="1"
          transform="rotate(45 11.2079 1.02426)"
        />
        <path d="M3.02643 4.52638C3.85486 4.52638 4.52643 3.85481 4.52643 3.02638C4.52643 2.19795 3.85486 1.52638 3.02643 1.52638C2.198 1.52638 1.52643 2.19795 1.52643 3.02638C1.52643 3.85481 2.198 4.52638 3.02643 4.52638Z" />
      </g>
    </svg>
  );
};

export default IconPercentageSmall;
