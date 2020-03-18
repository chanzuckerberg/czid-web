import React from "react";
import PropTypes from "prop-types";

const InfoSmallIcon = props => {
  return (
    <svg
      className={props.className}
      width="14px"
      height="14px"
      viewBox="0 0 14 14"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <g id="Icons" stroke="none" strokeWidth="1" fillRule="evenodd">
        <g id="icon-/-small-/-icon-s-info">
          <path
            d="M7,0 C10.8661,0 14,3.1339 14,7 C14,10.8661 10.8661,14 7,14 C3.1339,14 0,10.8661 0,7 C0,3.1339 3.1339,0 7,0 Z M7,6 C6.44771525,6 6,6.44771525 6,7 L6,7 L6,10.75 C6,11.3022847 6.44771525,11.75 7,11.75 C7.55228475,11.75 8,11.3022847 8,10.75 L8,10.75 L8,7 C8,6.44771525 7.55228475,6 7,6 Z M7,2.5 C6.67076544,2.5 6.34807913,2.6351598 6.11379505,2.87068219 C5.88605935,3.10034399 5.75,3.4318335 5.75,3.75819499 C5.75,4.09224851 5.88242143,4.41714485 6.11379505,4.65010322 C6.57617876,5.11601997 7.42418517,5.11601997 7.87711002,4.6537661 C8.11648719,4.41494714 8.25,4.09151593 8.25,3.75819499 C8.25,3.42817062 8.11685098,3.10583829 7.88438599,2.87397877 C7.64682778,2.6351598 7.32596043,2.5 7,2.5 Z"
            id="Combined-Shape"
          />
        </g>
      </g>
    </svg>
  );
};

InfoSmallIcon.propTypes = {
  className: PropTypes.string,
};

export default InfoSmallIcon;
