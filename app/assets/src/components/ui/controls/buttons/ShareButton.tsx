
import React from "react";
import IconShare from "~ui/icons/IconShare";


import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

const ShareButton = ({ primary, ...props } : ShareButtonProps) => {
  if (primary) {
    return <PrimaryButton text="Share" {...props} icon={<IconShare />} />;
  } else {
    return <SecondaryButton text="Share" {...props} icon={<IconShare />} />;
  }
};

ShareButton.defaultProps = {
  primary: true,
};

interface ShareButtonProps {
  primary: boolean,
};

export default ShareButton;
