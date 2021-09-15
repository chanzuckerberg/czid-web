import PropTypes from "prop-types";
import React from "react";
import cs from "./CtaButtonSolid.scss";

const CtaButtonSolid = props => {
  return (
    <a className={cs.ctaButton} href={props.linkUrl}>
      {props.text}
    </a>
  );
};

CtaButtonSolid.propTypes = {
  text: PropTypes.string,
  linkUrl: PropTypes.string,
};

export default CtaButtonSolid;
