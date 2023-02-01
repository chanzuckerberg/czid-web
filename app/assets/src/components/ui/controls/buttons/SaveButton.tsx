import { Button, Icon } from "czifui";
import React from "react";

import BasicPopup from "~/components/BasicPopup";

export const SaveButton = props => (
  <BasicPopup
    trigger={
      <Button
        {...props}
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
