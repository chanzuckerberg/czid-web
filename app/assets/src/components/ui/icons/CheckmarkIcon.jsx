import React from "react";
import PropTypes from "prop-types";
import { Icon } from "semantic-ui-react";
import cs from "./checkmark_icon.scss";
import cx from "classnames";

const CheckmarkIcon = ({ className, size }) => {
  return (
    <Icon
      size={size}
      className={cx(cs.checkmarkIcon, className)}
      name="check"
    />
  );
};

CheckmarkIcon.propTypes = {
  className: PropTypes.string,
  size: PropTypes.string
};

export default CheckmarkIcon;
