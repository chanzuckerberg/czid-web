import { Button, Icon } from "czifui";
import React from "react";

import BasicPopup from "~/components/BasicPopup";

interface SaveButtonProps {
  onClick: $TSFixMeFunction;
  className?: string;
}

export const SaveButton = ({ onClick, className }: SaveButtonProps) => (
  <BasicPopup
    trigger={
      <Button
        className={className}
        onClick={onClick}
        sdsStyle="rounded"
        sdsType="secondary"
        startIcon={<Icon sdsIcon="save" sdsSize="l" sdsType="button" />}
      >
        Save
      </Button>
    }
    content="Your visualization was saved!"
    on="click"
    hideOnScroll
  />
);

export default SaveButton;
