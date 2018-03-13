import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'semantic-ui-react';

const RoundedDropdown = (props) => {
  const propsCopy = Object.assign({}, props);
  propsCopy.className = `${props.className}  __custom _dropdown-rounded-corners`
  return (
    <Dropdown {...propsCopy} />
  );
};
export default RoundedDropdown;
