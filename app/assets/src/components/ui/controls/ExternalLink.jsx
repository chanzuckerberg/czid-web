import React from "react";
import PropTypes from "prop-types";
import { forbidExtraProps } from "airbnb-prop-types";

import Link from "./Link";

const ExternalLink = props => {
  return <Link external {...props} />;
};

ExternalLink.propTypes = forbidExtraProps({
  analyticsEventData: PropTypes.object,
  analyticsEventName: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  href: PropTypes.string,
});

export default ExternalLink;
