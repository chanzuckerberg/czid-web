import { Button, Icon } from "czifui";
import React from "react";

interface ShareButtonProps {
  primary: boolean;
  className?: string;
  onClick: $TSFixMeFunction;
}

const ShareButton = ({ primary, ...props }: ShareButtonProps) => (
  <Button
    sdsStyle="rounded"
    sdsType={primary ? "primary" : "secondary"}
    {...props}
    startIcon={<Icon sdsIcon="share" sdsSize="l" sdsType="button" />}>
    Share
  </Button>
);

ShareButton.defaultProps = {
  primary: true,
};

export default ShareButton;
