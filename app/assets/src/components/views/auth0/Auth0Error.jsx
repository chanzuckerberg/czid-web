import React from "react";

import BacteriaIcon from "~ui/icons/BacteriaIcon";
import BlankScreenMessage from "~/components/common/BlankScreenMessage";
import PropTypes from "~/components/utils/propTypes";

import cs from "./auth0_error.scss";

class Auth0Error extends React.Component {
  render() {
    const { message } = this.props;
    console.log("message 11:45am", message);
    return (
      <div className={cs.auth0Error}>
        <BlankScreenMessage
          message={message}
          textWidth={300}
          tagline={
            <a className={cs.helpLink} href="mailto:help@idseq.net">
              Contact us for help
            </a>
          }
          icon={<BacteriaIcon className={cs.bacteriaIcon} />}
        />
      </div>
    );
  }
}

Auth0Error.propTypes = {
  message: PropTypes.string,
};

export default Auth0Error;
