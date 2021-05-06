import React, { useState } from "react";

import Input from "~ui/controls/Input";
import { requestPasswordReset } from "~/api/user";

import cs from "./forgot_password.scss";

const ForgotPassword = () => {
  const [email, setEmail] = useState(null);
  const [sent, setSent] = useState(false);

  const handleFormSubmit = () => {
    if (email) {
      requestPasswordReset(email);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className={cs.form}>
        <div className={cs.text}>
          Form submitted! Please check your email for next steps.
        </div>
      </div>
    );
  }

  return (
    <div className={cs.form}>
      <div>
        <div className={cs.title}>Forgot your password?</div>
        <div className={cs.mainContent}>
          <div className={cs.content}>
            Please enter your email address. We will send you an email to reset
            your password.
          </div>
          <div className={cs.content}>
            <i className="fa fa-envelope" aria-hidden="true" />
            <label htmlFor="user_password" className={cs.emailLabel}>
              Email
            </label>
            <div>
              <Input
                className={cs.inputField}
                onChange={setEmail}
                placeholder="Enter your registered email"
                type="email"
              />
            </div>
          </div>
        </div>
        <button className={cs.submit} onClick={handleFormSubmit}>
          Send Email
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
