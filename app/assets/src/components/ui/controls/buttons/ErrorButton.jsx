import cx from "classnames";
import React from "react";
import PropTypes from "~/components/utils/propTypes";
import Button from "./Button";

import cs from "./error_button.scss";

const ErrorButton = ({ className, ...props }) => {
  return (
    <Button
      className={cx(cs.ui, cs.button, cs["idseq-ui"], cs.error, className)}
      {...props}
    />
  );
};

ErrorButton.propTypes = {
  className: PropTypes.string,
};

export default ErrorButton;
