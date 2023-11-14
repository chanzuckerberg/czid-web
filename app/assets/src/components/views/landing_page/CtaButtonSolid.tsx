import React from "react";
import cs from "./CtaButtonSolid.scss";

interface CtaButtonSolidProps {
  text: string;
  linkUrl: string;
  newTab: boolean;
}

const CtaButtonSolid = (props: CtaButtonSolidProps) => {
  return (
    <a
      className={cs.ctaButton}
      href={props.linkUrl}
      target={props.newTab ? "_blank" : "_self"}
      rel="noreferrer"
    >
      {props.text}
    </a>
  );
};

export default CtaButtonSolid;
