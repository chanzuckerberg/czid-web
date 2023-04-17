import React from "react";
import cs from "./confirmation_message.scss";

const ConfirmationMessage = () => {
  return (
    <div className={cs.container}>
      <div className={cs.text}>
        Form submitted! Please check your email for next steps.
      </div>
    </div>
  );
};

export default ConfirmationMessage;
