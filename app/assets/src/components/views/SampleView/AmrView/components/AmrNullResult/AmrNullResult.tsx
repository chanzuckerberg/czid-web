import { CheckCircle } from "@mui/icons-material";
import React from "react";
import cs from "~/components/views/SampleView/sample_message.scss";
import SampleMessage from "../../../SampleMessage";

export const AmrNullResult = () => {
  return (
    <div className={cs.sampleMessage}>
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
    </div>
  );
};
