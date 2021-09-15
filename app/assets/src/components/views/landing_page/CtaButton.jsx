import PropTypes from "prop-types";
import React from "react";
import cs from "./CtaButton.scss";

const CtaButton = props => {
  return (
    <a className={`${cs.ctaButton} ${props.className}`} href={props.linkUrl}>
      {props.text}
    </a>
  );
};

CtaButton.propTypes = {
  text: PropTypes.string,
  className: PropTypes.string,
  linkUrl: PropTypes.string,
};

export default CtaButton;
