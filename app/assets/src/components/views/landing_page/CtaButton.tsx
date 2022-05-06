import React from "react";
import cs from "./CtaButton.scss";

interface CtaButtonProps {
  text: string;
  className: string;
  linkUrl: string;
}

const CtaButton = (props: CtaButtonProps) => {
  return (
    <a
      className={`${cs.ctaButton} ${props.className}`}
      href={props.linkUrl}
      target="_blank"
      rel="noreferrer"
    >
      {props.text}
    </a>
  );
};

export default CtaButton;
