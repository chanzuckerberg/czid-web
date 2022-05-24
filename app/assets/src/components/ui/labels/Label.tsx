import cx from "classnames";
import React from "react";
import {
  Label as BaseLabel,
  SemanticCOLORS,
  SemanticSIZES,
} from "semantic-ui-react";
import cs from "./label.scss";

const Label = ({
  className,
  color,
  size,
  circular,
  floating,
  text,
  onClick,
}: LabelProps) => {
  return (
    <BaseLabel
      className={cx(className, cs.label)}
      color={color}
      size={size}
      circular={circular}
      floating={floating}
      onClick={onClick}
    >
      {text}
    </BaseLabel>
  );
};

interface LabelProps {
  className?: string;
  color: SemanticCOLORS;
  size: SemanticSIZES;
  circular?: boolean;
  floating?: boolean;
  text: React.ReactNode;
  onClick?: $TSFixMeFunction;
}

export default Label;
