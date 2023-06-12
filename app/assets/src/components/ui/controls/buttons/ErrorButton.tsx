import {
  Button,
  ButtonProps,
  Icon,
  IconNameToSizes,
} from "@czi-sds/components";
import cx from "classnames";
import React from "react";
import cs from "./error_button.scss";

interface ErrorButtonProps extends ButtonProps {
  className?: string;
  onClick?: () => void;
  text?: string;
  children?: string | React.ReactNode;
  disabled?: boolean;
  startIcon?: keyof IconNameToSizes;
}

const ErrorButton = ({
  className,
  onClick,
  text,
  children,
  disabled,
  startIcon,
}: ErrorButtonProps) => {
  return (
    <Button
      className={cx(cs.deleteButton, className)}
      sdsType="primary"
      color="error"
      sdsStyle="rounded"
      onClick={onClick}
      disabled={disabled}
      startIcon={
        startIcon && <Icon sdsIcon={startIcon} sdsSize="l" sdsType="button" />
      }
    >
      {text || children}
    </Button>
  );
};

export default ErrorButton;
