import { forbidExtraProps } from "airbnb-prop-types";
import PropTypes from "prop-types";
import React from "react";

import Link from "./Link";

const ExternalLink = props => {
  return <Link external {...props} />;
};

ExternalLink.propTypes = forbidExtraProps({
  analyticsEventData: PropTypes.object,
  analyticsEventName: PropTypes.string,
  coloredBackground: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  href: PropTypes.string,
  onClick: PropTypes.func,
});

export default ExternalLink;
