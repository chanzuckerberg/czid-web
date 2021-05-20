import PropTypes from "prop-types";
import React from "react";

// Use for external tool branding.
// Use the prop "text" to update the label; default is "Tool Name"
const LogoLockupColor = props => {
  return (
    <svg
      className={props.className}
      width="136px"
      height="25px"
      viewBox="0 0 136 25"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <g
        id="Logo-/-Lockups-/-LogoLockupColor"
        stroke="none"
        strokeWidth="1"
        fillRule="evenodd"
      >
        <text
          id="Tool-Name"
          fontFamily="OpenSans-SemiBold, Open Sans"
          fontSize="16"
          fontWeight="500"
          linespacing="24"
          letterSpacing="0.0888888889"
          fill="#000000"
        >
          <tspan x="51" y="17.5">
            {props.text}
          </tspan>
        </text>
        <line
          x1="36.5"
          y1="0.520833333"
          x2="36.5"
          y2="25.0208333"
          id="Line-2"
          stroke="#999999"
          strokeLinecap="square"
          fillRule="nonzero"
        ></line>
        <g id="IDseq_logomark" fillRule="nonzero">
          <path
            d="M2.86444931,0.25 C1.28226121,0.25 0,1.55584795 0,3.16680312 C0,4.77775828 1.28226121,6.08333333 2.86444931,6.08333333 C4.44690545,6.08333333 5.72916667,4.77775828 5.72916667,3.16680312 C5.72916667,1.55584795 4.44690545,0.25 2.86444931,0.25"
            id="Fill-7"
            fill="#93C151"
          ></path>
          <path
            d="M10.450272,0.253476718 L10.4500021,0.253476718 L6.48845057,0.25 C7.0523821,1.02022675 7.38885225,1.96455684 7.38885225,2.98911889 C7.38885225,4.08214553 7.00732155,5.08531239 6.37296602,5.88121337 L10.457827,5.8854924 C14.0416255,5.8854924 17.2344493,8.77865664 17.2344493,12.3353391 C17.2344493,15.8901495 14.3173853,18.7833138 10.7327774,18.7849184 L7.41286657,18.7776976 L7.42743704,19.9135145 C7.42743704,19.9135145 7.47222778,22.9446778 5.72916667,24.3599694 L10.7365549,24.4166667 C17.4524669,24.4121202 22.9166667,18.9921842 22.9166667,12.3353391 C22.9166667,5.67341261 17.1713106,0.253476718 10.450272,0.253476718"
            id="Fill-8"
            fill="#0A0B09"
          ></path>
          <path
            d="M0.691848451,10.456237 C0.196276756,11.2303473 0,12.2071056 0,13.3172761 L0,24.4109925 C2.58006337,24.4844889 4.09768391,23.8397964 4.91586519,22.7216372 C5.14087861,22.4143365 5.31302741,22.0713526 5.43963134,21.6972127 C5.64241451,21.0977898 5.72916667,20.419811 5.72916667,19.6827152 L5.72916667,8.58899892 C3.01545076,8.5117743 1.47695548,9.22863181 0.691848451,10.456237"
            id="Fill-9"
            fill="#0A0B09"
          ></path>
        </g>
      </g>
    </svg>
  );
};

LogoLockupColor.defaultProps = {
  text: "Tool Name",
};

LogoLockupColor.propTypes = {
  className: PropTypes.string,
  text: PropTypes.string,
};

export default LogoLockupColor;
