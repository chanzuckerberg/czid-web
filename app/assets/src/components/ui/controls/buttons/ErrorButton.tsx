import cx from "classnames";
import { Button } from "czifui";
import React from "react";
import cs from "./error_button.scss";

interface ErrorButtonProps {
  className?: string;
  onClick?: () => void;
  text?: string;
}

const ErrorButton = ({ className, onClick, text }: ErrorButtonProps) => {
  return (
    <Button
      // these classes are temporarily needed to override the default styling of the czifui button
      // until the czifui error button is ready
      className={cx(cs.ui, cs.button, cs["idseq-ui"], cs.error, className)}
      sdsType="primary"
      color="error"
      sdsStyle="rounded"
      onClick={onClick}
    >
      {text}
    </Button>
  );
};

export default ErrorButton;
