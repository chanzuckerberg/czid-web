import React from "react";
import PropTypes from "prop-types";
import { Icon } from "semantic-ui-react";
import cs from "./checkmark_icon.scss";

const CheckmarkIcon = ({ size }) => {
  return <Icon size={size} className={cs.checkmarkIcon} name="check" />;
};

CheckmarkIcon.propTypes = {
  size: PropTypes.string
};

export default CheckmarkIcon;
