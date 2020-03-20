import React from "react";
import PropTypes from "prop-types";

const ForgotPassword = props => {
  const { endpoint, csrf, emailLabel } = props;
  return (
    <div className="login-form forgot-password">
      <div className="row">
        <form action={endpoint} method="POST" className="new_user">
          <div className="mail">
            <br />
            <div className="form-title">Forgot your password?</div>
          </div>
          <div className="row content-wrapper">
            <div>
              Please enter your email address. We will send you an email to
              reset your password.
            </div>
          </div>
          <div className="row content-wrapper">
            <div className="input-field">
              <i className="sample fa fa-envelope" aria-hidden="true" />
              <input type="hidden" name="authenticity_token" value={csrf} />
              <input
                type="email"
                id="user_password"
                name={emailLabel}
                className="user_password"
                placeholder="Enter your registered email"
              />
              <label htmlFor="user_password">Email</label>
            </div>
          </div>
          <button type="submit" className="center-align col s12 login-wrapper">
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
