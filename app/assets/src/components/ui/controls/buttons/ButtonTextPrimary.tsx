import cx from "classnames";
import React from "react";
import Button, { ButtonProps } from "./Button";

import cs from "./button_text_primary.scss";

const ButtonTextPrimary = (props: ButtonProps) => {
  const { className } = props;

  return (
    <Button
      className={cx(cs.button, className)}
      labelClassName={cs.label}
      {...props}
    />
  );
};

export default ButtonTextPrimary;
