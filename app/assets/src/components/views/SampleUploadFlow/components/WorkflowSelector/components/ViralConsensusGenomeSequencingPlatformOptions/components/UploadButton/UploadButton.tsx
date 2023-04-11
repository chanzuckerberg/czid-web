import { Button, Icon } from "czifui";
import React from "react";
import cs from "./upload_button.scss";

const UploadButton = props => (
  <Button
    className={cs.button}
    sdsType="primary"
    sdsStyle="minimal"
    isAllCaps
    {...props}>
    <Icon
      className={cs.icon}
      sdsIcon="download"
      sdsSize="xs"
      sdsType="button"
    />{" "}
    {/* // TODO (mlila): upload icon instead of download */}
    <div>Select file</div>
  </Button>
);

export { UploadButton };
