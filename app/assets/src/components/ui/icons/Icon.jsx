import { forbidExtraProps } from "airbnb-prop-types";
import PropTypes from "prop-types";
import React from "react";
import { Icon as BaseIcon } from "semantic-ui-react";

const Icon = ({ name, size, className, onClick }) => {
  return (
    <BaseIcon className={className} name={name} size={size} onClick={onClick} />
  );
};

Icon.propTypes = forbidExtraProps({
  // Add more as needed
  name: PropTypes.string,
  size: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
});

export default Icon;
