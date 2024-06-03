import { CheckCircle } from "@mui/icons-material";
import React from "react";
import { SampleMessage } from "~/components/common/SampleMessage";
import cs from "~/components/common/SampleMessage/sample_message.scss";

export const AmrNullResult = () => {
  return (
    <SampleMessage
      icon={<CheckCircle className={cs.icon} />}
      link={"https://czid.org/samples/upload"}
      linkText={"Upload another sample"}
      message={
        "No antimicrobial resistant genes were identified in this sample."
      }
      status={"Complete"}
      type={"success"}
    />
  );
};
