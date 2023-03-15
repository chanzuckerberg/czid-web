import cx from "classnames";
import { Button, ButtonProps } from "czifui";
import React from "react";
import cs from "./error_button.scss";

interface ErrorButtonProps extends ButtonProps {
  className?: string;
  onClick?: () => void;
  text?: string;
  children?: string | React.ReactNode;
  disabled?: boolean;
}

const ErrorButton = ({
  className,
  onClick,
  text,
  children,
  disabled,
}: ErrorButtonProps) => {
  return (
    <Button
      // these classes are temporarily needed to override the default styling of the czifui button
      // until the czifui error button is ready
      className={cx(
        cs.ui,
        cs.button,
        cs["idseq-ui"],
        cs.error,
        disabled,
        className,
      )}
      sdsType="primary"
      color="error"
      sdsStyle="rounded"
      onClick={onClick}
      disabled={disabled}
    >
      {text || children}
    </Button>
  );
};

export default ErrorButton;
