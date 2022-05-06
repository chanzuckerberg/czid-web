import React from "react";
import cs from "./CtaButtonSolid.scss";

interface CtaButtonSolidProps {
  text: string;
  linkUrl: string;
}

const CtaButtonSolid = (props: CtaButtonSolidProps) => {
  return (
    <a className={cs.ctaButton} href={props.linkUrl}>
      {props.text}
    </a>
  );
};

export default CtaButtonSolid;
