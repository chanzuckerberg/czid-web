import PropTypes from "prop-types";
import React from "react";

import { IconShare } from "~ui/icons";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

const ShareButton = ({ primary, ...props }) => {
  if (primary) {
    return <PrimaryButton text="Share" {...props} icon={<IconShare />} />;
  } else {
    return <SecondaryButton text="Share" {...props} icon={<IconShare />} />;
  }
};

ShareButton.defaultProps = {
  primary: true,
};

ShareButton.propTypes = {
  primary: PropTypes.bool,
};

export default ShareButton;
