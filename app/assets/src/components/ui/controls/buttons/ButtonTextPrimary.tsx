import cx from "classnames";
import React from "react";
import Button from "./Button";

import cs from "./button_text_primary.scss";

const ButtonTextPrimary = (props: ButtonTextPrimaryProps) => {
  const { className } = props;

  return (
    <Button
      className={cx(cs.button, className)}
      labelClassName={cs.label}
      {...props}
    />
  );
};

interface ButtonTextPrimaryProps {
  className: string;
}

export default ButtonTextPrimary;
