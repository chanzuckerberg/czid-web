import { forbidExtraProps } from "airbnb-prop-types";
import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { Label as BaseLabel } from "semantic-ui-react";
import cs from "./label.scss";

const Label = ({
  className,
  color,
  size,
  circular,
  floating,
  text,
  onClick,
}) => {
  return (
    <BaseLabel
      className={cx(className, cs.label)}
      color={color}
      size={size}
      circular={circular}
      floating={floating}
      onClick={onClick}
    >
      {text}
    </BaseLabel>
  );
};

Label.propTypes = forbidExtraProps({
  className: PropTypes.string,
  color: PropTypes.string,
  size: PropTypes.string,
  circular: PropTypes.bool,
  floating: PropTypes.bool,
  text: PropTypes.node,
  onClick: PropTypes.func,
});

export default Label;
