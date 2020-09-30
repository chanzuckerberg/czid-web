import React from "react";
import PropTypes from "prop-types";

import cs from "./forgot_password.scss";

const ForgotPassword = props => {
  const { endpoint, csrf, emailLabel } = props;
  return (
    <div className={cs.form}>
      <div>
        <form action={endpoint} method="POST">
          <div className={cs.title}>Forgot your password?</div>
          <div className={cs.content}>
            Please enter your email address. We will send you an email to reset
            your password.
          </div>
          <div className={cs.content}>
            <i className="fa fa-envelope" aria-hidden="true" />
            <label htmlFor="user_password" className={cs.emailLabel}>
              Email
            </label>
            <input type="hidden" name="authenticity_token" value={csrf} />
            <input
              type="email"
              id="user_password"
              name={emailLabel}
              className={cs.inputField}
              placeholder="Enter your registered email"
            />
          </div>
          <button type="submit" className={cs.submit}>
            Send Email
          </button>
        </form>
      </div>
    </div>
  );
};

ForgotPassword.propTypes = {
  endpoint: PropTypes.string,
  csrf: PropTypes.string,
  emailLabel: PropTypes.string,
};

ForgotPassword.defaultProps = {
  endpoint: PropTypes.string,
  csrf: PropTypes.string,
  emailLabel: PropTypes.string,
};

export default ForgotPassword;
