import { Icon as BaseIcon } from "semantic-ui-react";
import { forbidExtraProps } from "airbnb-prop-types";
import PropTypes from "prop-types";
import React from "react";

const Icon = ({ name, size, className }) => {
  return <BaseIcon className={className} name={name} size={size} />;
};

Icon.propTypes = forbidExtraProps({
  // Add more as needed
  name: PropTypes.string,
  size: PropTypes.string,
  className: PropTypes.string
});

export default Icon;
