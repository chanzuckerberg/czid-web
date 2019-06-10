import React from "react";
import PropTypes from "prop-types";
import { Icon } from "semantic-ui-react";

const GlobeLinedIcon = props => {
  const { className } = props;
  return <Icon name="globe" className={className} />;
};

GlobeLinedIcon.propTypes = {
  className: PropTypes.string
};

export default GlobeLinedIcon;
