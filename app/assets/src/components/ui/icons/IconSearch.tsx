import React from "react";
import { IconProps } from "~/interface/icon";

const IconSearch = ({ className }: IconProps) => {
  return (
    <svg className={className} width="14px" height="14px" viewBox="0 0 14 14">
      <path d="M5.37797313,0 C8.34826504,0 10.7559463,2.40768122 10.7559463,5.37797313 C10.7559463,6.59049159 10.3500122,7.74442023 9.61861402,8.6807374 L9.561,8.749 L9.618,8.805 L10.1807176,8.80503145 L10.304585,8.85641169 L13.7166717,12.2753362 C14.1065288,12.6659745 14.1062121,13.2985937 13.7159642,13.6888416 L13.6888416,13.7159642 C13.2985937,14.1062121 12.6659745,14.1065288 12.2753362,13.7166717 L8.85641169,10.304585 L8.85641169,10.304585 L8.80503145,10.1807176 L8.805,9.618 L8.749,9.561 L8.6807374,9.61861402 C7.88375314,10.2411732 6.92910388,10.6279254 5.9148597,10.7292441 L5.63684378,10.7497623 L5.37797313,10.7559463 C2.40768122,10.7559463 0,8.34826504 0,5.37797313 C0,2.40768122 2.40768122,0 5.37797313,0 Z M5.37797313,1.95091481 C3.48148402,1.95091481 1.95091481,3.48148402 1.95091481,5.37797313 C1.95091481,7.27446223 3.48148402,8.80503145 5.37797313,8.80503145 C7.27446223,8.80503145 8.80503145,7.27446223 8.80503145,5.37797313 C8.80503145,3.48148402 7.27446223,1.95091481 5.37797313,1.95091481 Z" />
    </svg>
  );
};

export default IconSearch;