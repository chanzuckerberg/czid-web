import { Label as BaseLabel } from "semantic-ui-react";
import { forbidExtraProps } from "airbnb-prop-types";
import PropTypes from "prop-types";
import React from "react";

const Label = ({
  className,
  color,
  size,
  circular,
  floating,
  text,
  onClick
}) => {
  return (
    <BaseLabel
      className={`idseq-ui ${className}`}
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
  text: PropTypes.string,
  onClick: PropTypes.func
});

export default Label;
