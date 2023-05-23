import { CheckCircle } from "@mui/icons-material";
import React from "react";
import cs from "~/components/views/components/SampleMessage/sample_message.scss";
import SampleMessage from "~/components/views/components/SampleMessage/SampleMessage";

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
