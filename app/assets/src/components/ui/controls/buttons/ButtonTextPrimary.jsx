import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";
import Button from "./Button";

import cs from "./button_text_primary.scss";

const ButtonTextPrimary = props => {
  const { className } = props;

  return (
    <Button
      className={cx(cs.button, className)}
      labelClassName={cs.label}
      {...props}
    />
  );
};

ButtonTextPrimary.propTypes = {
  className: PropTypes.string,
};

export default ButtonTextPrimary;
