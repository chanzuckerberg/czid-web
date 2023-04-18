import { Link } from "czifui";
import { isEmpty } from "lodash/fp";
import React from "react";
import cs from "./confirmation_message.scss";
interface ConfirmationMessageProps {
  errorType?: string;
}

const SUCCESS_MESSAGE =
  "Form submitted! Please check your email for next steps.";

const ConfirmationMessage = ({ errorType }: ConfirmationMessageProps) => {
  const message = () => {
    if (isEmpty(errorType)) {
      return SUCCESS_MESSAGE;
    } else if (errorType === "email") {
      return (
        <div>
          There is an existing account associated with the email address you
          entered. Please{" "}
          <Link sdsStyle="default" href="/">
            register
          </Link>{" "}
          with a different email address or{" "}
          <Link sdsStyle="default" href="/auth0/login">
            log in
          </Link>{" "}
          instead.
        </div>
      );
    } else if (errorType === "unknown") {
      return (
        <div>
          There has been an error in creating your account. Please try again or
          contact us at{" "}
          <Link sdsStyle="default" href="mailto:help@czid.org">
            help@czid.org
          </Link>{" "}
          for assistance.
        </div>
      );
    }
  };

  return (
    <div className={cs.container}>
      <div className={cs.text}>{message()}</div>
    </div>
  );
};

export default ConfirmationMessage;
