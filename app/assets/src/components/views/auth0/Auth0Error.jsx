import React from "react";
import { upperFirst } from "lodash/fp";

import ImgMicrobeSecondary from "~ui/illustrations/ImgMicrobeSecondary";
import BlankScreenMessage from "~/components/common/BlankScreenMessage";
import PropTypes from "~/components/utils/propTypes";

import cs from "./auth0_error.scss";

class Auth0Error extends React.Component {
  render() {
    const { message } = this.props;
    return (
      <div className={cs.auth0Error}>
        <BlankScreenMessage
          message={upperFirst(message)}
          textWidth={300}
          tagline={
            <a className={cs.helpLink} href="mailto:help@idseq.net">
              Contact us for help
            </a>
          }
          icon={<ImgMicrobeSecondary className={cs.imgMicrobe} />}
        />
      </div>
    );
  }
}

Auth0Error.propTypes = {
  message: PropTypes.string,
};

export default Auth0Error;
