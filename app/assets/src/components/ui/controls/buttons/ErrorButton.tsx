import cx from "classnames";
import React from "react";
import Button from "./Button";

import cs from "./error_button.scss";

const ErrorButton = ({ className, ...props }: ErrorButtonProps) => {
  return (
    <Button
      className={cx(cs.ui, cs.button, cs["idseq-ui"], cs.error, className)}
      {...props}
    />
  );
};

interface ErrorButtonProps {
  className?: string;
  onClick?: $TSFixMeFunction;
  text?: string;
}

export default ErrorButton;
