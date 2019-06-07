import React from "react";
import PropTypes from "prop-types";
import { Icon } from "semantic-ui-react";

const BulletListIcon = props => {
  const { className } = props;
  return <Icon name="list ul" className={className} />;
};

BulletListIcon.propTypes = {
  className: PropTypes.string
};

export default BulletListIcon;
